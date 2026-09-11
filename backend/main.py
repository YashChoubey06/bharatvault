"""Bharat Vault local MVP API. Run one process: python -m uvicorn backend.main:app."""
import hashlib
import os
import secrets
import time
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from . import store as db, auth, ocr, processing
from .seed import seed
from .intelligence import reconcile, normalize, LABELS, LABEL_NAMES


@asynccontextmanager
async def lifespan(app):
    db.initialize()
    seed()
    worker = processing.start()
    yield
    processing.stop_event.set()
    processing.wake_event.set()
    worker.join(timeout=3)


app = FastAPI(title='Bharat Vault — Local MVP', lifespan=lifespan)
api = APIRouter(prefix='/api/v1')
User = Depends(auth.current_user)


@app.middleware('http')
async def local_security(request, call_next):
    # Same-origin cookies; never allow a remote site to submit mutations to localhost.
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        origin = request.headers.get('origin')
        allowed = os.getenv('BHARAT_ALLOWED_ORIGINS', 'http://localhost:3003,http://127.0.0.1:3003').split(',')
        is_allowed_origin = (not origin) or ('*' in allowed) or (origin in allowed) or origin.endswith('.vercel.app')
        if not is_allowed_origin:
            return JSONResponse({'detail':'Origin is not allowed.'}, status_code=403)
        if request.headers.get('sec-fetch-site') == 'cross-site' and not is_allowed_origin:
            return JSONResponse({'detail':'Cross-site requests are not allowed.'}, status_code=403)
    response = await call_next(request)
    response.headers['Cache-Control'] = 'no-store'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


def parcel_for(con, key, user):
    parcel=auth.require_parcel(user, db.get(con, 'parcel', key))
    if parcel.get('archivedAt'):
        raise HTTPException(404, 'Parcel not found.')
    # Transaction panels use actual extracted sources, not fabricated fixture values.
    extracted=db.fields(con,key)
    for kind,fragment,mapping in [('registration','registration',{'area':'area','buyer':'buyer','seller':'seller','registration_number':'registrationNumber','registration_date':'registrationDate'}),('mutation','mutation',{'mutation_status':'status','mutation_number':'mutationNumber','mutation_date':'mutationDate','owner_name':'newOwner'})]:
        matching=[f for f in extracted if fragment in f.get('sourceType','').lower() and f['field'] in mapping]
        if matching:
            selected_doc=matching[-1]['documentId']
            values={mapping[f['field']]:(f['normalizedValue'] if f['field']=='area' else f['value']) for f in matching if f['documentId']==selected_doc}
            parcel[kind]=dict(values,date=values.get('registrationDate') or values.get('mutationDate'),documentId=selected_doc,reviewStatus='SOURCE_EXTRACTION')
    return parcel


def visible(con, user):
    return [p for p in db.all_entities(con, 'parcel') if not p.get('archivedAt') and (user['role']=='system_admin' or p['village']['district']==user.get('district'))]


def doc_for(con, key, user):
    doc = db.document(con, key)
    if not doc or doc.get('archivedAt'):
        raise HTTPException(404, 'Document not found.')
    parcel_for(con, doc['parcelId'], user)
    return doc


def public_doc(doc):
    return dict({k:v for k,v in doc.items() if k not in ('ocrLines',)},createdAt=doc['uploadedAt'],source='Local upload',description='Source document uploaded locally; upload date is not an ownership event date.')


def evidence(con, parcel_id):
    return [dict(f, confidence=f['confidence']/100, documentName=f['source']) for f in db.fields(con, parcel_id)]


@api.get('/health')
def health():
    return dict(status='ok', storage='local SQLite', ocr=ocr.health(), mode='local-mvp')


class Login(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=256)


@api.post('/auth/login')
def login(body: Login, request: Request, response: Response):
    identity = body.email.strip().lower()
    with db.transaction() as con:
        attempt = con.execute('SELECT * FROM login_attempts WHERE identity=?', (identity,)).fetchone()
        if attempt and attempt['reset_at']>time.time() and attempt['failures']>=8:
            raise HTTPException(429, 'Too many attempts. Try again in 15 minutes.')
        row = con.execute('SELECT * FROM users WHERE email=?', (identity,)).fetchone()
        valid = row and auth.check_password(body.password, row['password'])
        if not valid:
            failures = attempt['failures']+1 if attempt and attempt['reset_at']>time.time() else 1
            con.execute('INSERT OR REPLACE INTO login_attempts VALUES(?,?,?)', (identity,failures,time.time()+900))
        else:
            con.execute('DELETE FROM login_attempts WHERE identity=?', (identity,))
            token = secrets.token_urlsafe(32)
            con.execute('DELETE FROM sessions WHERE expires<?', (time.time(),))
            con.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),row['id'],time.time()+28800))
            user = db.json.loads(row['data'])
            db.audit(con,user['id'],'LOGIN','SYSTEM','Local user signed in.')
    if not valid:
        raise HTTPException(401,'Email or password is incorrect.')
    response.set_cookie(auth.COOKIE,token,httponly=True,samesite='strict',secure=os.getenv('BHARAT_SECURE_COOKIE')=='1',max_age=28800,path='/')
    return {'user':user}


@api.get('/auth/me')
def me(user=User):
    return user


@api.post('/auth/logout')
def logout(request: Request, response: Response, user=User):
    with db.transaction() as con:
        con.execute('DELETE FROM sessions WHERE token=?',(hashlib.sha256(request.cookies.get(auth.COOKIE,'').encode()).hexdigest(),))
    response.delete_cookie(auth.COOKIE,path='/')
    return {'ok':True}


@api.get('/parcels')
def parcels(search: str='', user=User):
    with db.transaction() as con:
        return [p for p in visible(con,user) if search.casefold() in ' '.join(str(p.get(k,'')) for k in ('id','surveyNumber','khataNumber','currentRecordedOwner')).casefold()]


class ParcelInput(BaseModel):
    surveyNumber: str = Field(min_length=1,max_length=100)
    currentRecordedOwner: str = Field(min_length=1,max_length=200)
    khataNumber: str = Field(default='',max_length=100)
    village: str = Field(min_length=1,max_length=100)
    tehsil: str = Field(min_length=1,max_length=100)
    district: str = Field(min_length=1,max_length=100)
    recordedArea: float | None = Field(default=None,gt=0)


@api.post('/parcels',status_code=201)
def create_parcel(body: ParcelInput,user=User):
    auth.require_role(user,auth.UPLOADERS)
    if user['role']!='system_admin' and body.district!=user.get('district'):
        raise HTTPException(403,'Use your assigned district.')
    p = body.model_dump()
    p.update(id=db.uid('PRC'),village=dict(name=body.village,tehsil=body.tehsil,district=body.district),owner={'name':body.currentRecordedOwner},sample=False,createdAt=db.now(),ownershipHistory={'events':[]})
    with db.transaction() as con:
        db.put(con,'parcel',p)
        reconcile(con,p['id'])
        db.audit(con,user['id'],'PARCEL_CREATED',p['id'],'Parcel context entered manually; not source-verified.',body.model_dump())
        return db.get(con,'parcel',p['id'])


@api.delete('/parcels/{key}')
def archive_parcel(key: str,user=User):
    auth.require_role(user,auth.UPLOADERS)
    with db.transaction() as con:
        p=parcel_for(con,key,user)
        if db.documents(con,key):
            raise HTTPException(409,'Remove the parcel documents first, then remove the parcel.')
        p.update(archivedAt=db.now(),archivedBy=user['id'])
        db.put(con,'parcel',p)
        db.audit(con,user['id'],'PARCEL_ARCHIVED',key,'Parcel removed from active registry; audit history retained.')
        return {'ok':True,'id':key}


class GISInput(BaseModel):
    area: float = Field(gt=0)
    source: str = Field(min_length=1,max_length=200)
    coordinates: list[list[float]] = Field(min_length=3,max_length=200)
    crs: str = Field(default='EPSG:4326',min_length=1,max_length=50)


@api.put('/parcels/{key}/gis')
def save_gis(key: str,body: GISInput,user=User):
    auth.require_role(user,auth.UPLOADERS)
    if any(len(point)!=2 for point in body.coordinates):
        raise HTTPException(422,'Each GIS coordinate must contain longitude and latitude.')
    coordinates=body.coordinates
    if coordinates[0] != coordinates[-1]:
        coordinates=coordinates+[coordinates[0]]
    with db.transaction() as con:
        p=parcel_for(con,key,user)
        gis=dict(id=p.get('gis',{}).get('id') or db.uid('GIS'),surveyNumber=p['surveyNumber'],area=body.area,source=body.source.strip(),crs=body.crs.strip(),geometry={'type':'Polygon','coordinates':[coordinates]},updatedAt=db.now(),enteredBy=user['id'],sample=False)
        p['gis']=gis
        db.put(con,'parcel',p)
        reconcile(con,key)
        db.audit(con,user['id'],'GIS_RECORD_SAVED',key,'Locally entered GIS evidence saved; no external GIS verification claimed.',{'gisId':gis['id'],'area':gis['area'],'source':gis['source']})
        return gis


@api.get('/parcels/{key}')
def parcel(key: str,user=User):
    with db.transaction() as con:
        return parcel_for(con,key,user)


@api.get('/parcels/{key}/{section}')
def parcel_section(key: str,section: str,user=User):
    with db.transaction() as con:
        p = parcel_for(con,key,user)
        if section=='documents': return [public_doc(d) for d in db.documents(con,key)]
        if section=='evidence': return evidence(con,key)
        if section=='export':
            payload=dict(schemaVersion='bharat-vault-local-v1',generatedAt=db.now(),parcel=p,documents=[public_doc(d) for d in db.documents(con,key)],fields=db.fields(con,key),validation=db.get(con,'validation',key),risk=db.get(con,'risk',key),conflicts=(db.get(con,'conflicts',key) or {'items':[]})['items'])
            return JSONResponse(payload,headers={'Content-Disposition':f'attachment; filename="{key}-evidence.json"'})
        if section=='conflicts': return (db.get(con,'conflicts',key) or {'items':[]})['items']
        if section in ('validation','risk'): return db.get(con,section,key)
        if section=='intelligence': return dict(validation=db.get(con,'validation',key),risk=db.get(con,'risk',key),conflicts=(db.get(con,'conflicts',key) or {'items':[]})['items'],evidence=evidence(con,key))
        if section=='workspace':
            conflicts = (db.get(con,'conflicts',key) or {'items':[]})['items']
            fields = db.fields(con,key)
            for f in fields:
                box=f['bbox']
                f['bbox']=dict(left=100*box[0]/f['pageWidth'],top=100*box[1]/f['pageHeight'],width=100*(box[2]-box[0])/f['pageWidth'],height=100*(box[3]-box[1])/f['pageHeight'])
                f['conflicts']=[c['description'] for c in conflicts if any(s.get('fieldId')==f['id'] for s in c['sources'])]
            return dict(parcel=p,documents=[dict(public_doc(d),name=d['fileName'],type=d['documentType']) for d in db.documents(con,key)],fields=fields)
        if section=='history': return p.get('ownershipHistory',{'events':[]})
        if section=='gis': return p.get('gis')
    raise HTTPException(404,'Unknown parcel section.')


@api.get('/documents')
def documents(user=User):
    with db.transaction() as con:
        ids={p['id'] for p in visible(con,user)}
        return [public_doc(d) for d in db.documents(con) if d['parcelId'] in ids]


@api.post('/documents',status_code=202)
async def upload(file: UploadFile=File(...),parcelId: str=Form(...),documentType: str=Form('Auto detect'),language: str=Form('eng+hin'),user=User):
    auth.require_role(user,auth.UPLOADERS)
    if language not in ('eng','hin','eng+hin') or documentType not in ('Auto detect','Current RoR','Historical RoR','Registration Deed','Mutation Record','GIS Extract','Other'):
        raise HTTPException(422,'Unsupported language or document type.')
    with db.transaction() as con:
        parcel_for(con,parcelId,user)
    content=await file.read(20*1024*1024+1)
    await file.close()
    if not content or len(content)>20*1024*1024:
        raise HTTPException(413,'Upload a nonempty file of at most 20 MB.')
    try:
        fmt,pages=ocr.validate(content)
    except Exception as error:
        raise HTTPException(422,'Invalid or unsupported document. Use an unencrypted PDF, PNG, JPEG or TIFF, up to 20 pages and 25 megapixels per page.') from error
    digest=hashlib.sha256(content).hexdigest()
    with db.transaction() as con:
        if any(d['sha256']==digest for d in db.documents(con,parcelId)):
            raise HTTPException(409,'This exact document is already attached to the parcel.')
        doc=dict(id=db.uid('DOC'),parcelId=parcelId,fileName=Path((file.filename or 'document').replace('\\','/')).name[:200],documentType=documentType,language=language,pages=pages,format=fmt,sha256=digest,size=len(content),uploadedAt=db.now(),uploadedBy=user['id'])
        folder=db.DATA/'documents'/doc['id']
        folder.mkdir(parents=True)
        # Exclusive write: originals can never be overwritten by review actions.
        with (folder/('original.'+fmt)).open('xb') as output:
            output.write(content)
        doc['fileUrl']=f"/api/v1/documents/{doc['id']}/original"
        db.save_document(con,doc)
        processing.enqueue(con,doc,user['id'])
        db.audit(con,user['id'],'DOCUMENT_UPLOADED',parcelId,'Original stored locally with SHA-256.',{'documentId':doc['id'],'sha256':digest})
    return public_doc(doc)


@api.get('/documents/{key}')
def document(key: str,user=User):
    with db.transaction() as con:
        doc=doc_for(con,key,user)
        return dict(public_doc(doc),ocrLines=doc.get('ocrLines',[]),extractions=db.fields(con,document_id=key),evidence=db.fields(con,document_id=key))


@api.get('/documents/{key}/extractions')
def extractions(key: str,user=User):
    with db.transaction() as con:
        doc_for(con,key,user)
        return db.fields(con,document_id=key)


@api.get('/documents/{key}/original')
def original(key: str,user=User):
    with db.transaction() as con:
        doc=doc_for(con,key,user)
    return FileResponse(db.DATA/'documents'/key/('original.'+doc['format']),filename=doc['fileName'])


@api.get('/documents/{key}/pages/{page}')
def page_image(key: str,page: int,user=User):
    with db.transaction() as con:
        doc=doc_for(con,key,user)
    path=db.DATA/'documents'/key/f'page-{page}.png'
    if page<1 or page>doc['pages'] or not path.is_file():
        raise HTTPException(404,'Preview not ready.')
    return FileResponse(path,media_type='image/png')


@api.post('/documents/{key}/process')
def retry(key: str,user=User):
    auth.require_role(user,auth.UPLOADERS)
    with db.transaction() as con:
        doc=doc_for(con,key,user)
        if doc['ocrStatus']!='FAILED':
            raise HTTPException(409,'Only failed jobs may be retried. Upload a new source version to replace completed evidence.')
        return processing.enqueue(con,doc,user['id'])


@api.delete('/documents/{key}')
def archive_document(key: str,user=User):
    auth.require_role(user,auth.UPLOADERS)
    with db.transaction() as con:
        doc=doc_for(con,key,user)
        if doc.get('ocrStatus') in ('QUEUED','PROCESSING'):
            raise HTTPException(409,'Wait for local OCR to finish before removing this document.')
        doc.update(archivedAt=db.now(),archivedBy=user['id'],status='ARCHIVED')
        db.save_document(con,doc)
        reconcile(con,doc['parcelId'])
        db.audit(con,user['id'],'DOCUMENT_ARCHIVED',doc['parcelId'],'Document removed from active parcel evidence; original file and audit history retained.',{'documentId':key,'sha256':doc['sha256']})
        return {'ok':True,'id':key,'parcelId':doc['parcelId']}


class FieldReview(BaseModel):
    version: int = Field(ge=1)
    state: str
    notes: str = Field(min_length=1,max_length=4000)
    value: str | None = Field(default=None,min_length=1,max_length=1000)


class ManualField(BaseModel):
    lineIndex: int = Field(ge=0)
    field: str
    value: str = Field(min_length=1,max_length=1000)
    notes: str = Field(min_length=1,max_length=4000)


@api.post('/documents/{key}/fields',status_code=201)
def map_line(key: str,body: ManualField,user=User):
    auth.require_role(user,auth.OFFICERS)
    if body.field not in LABELS or not body.value.strip() or not body.notes.strip():
        raise HTTPException(422,'Choose a supported field and provide a value and mapping note.')
    with db.transaction() as con:
        doc=doc_for(con,key,user)
        lines=doc.get('ocrLines',[])
        if body.lineIndex>=len(lines): raise HTTPException(422,'OCR source line is unavailable.')
        line=lines[body.lineIndex]
        if any(f['field']==body.field and f['page']==line['page'] and f['bbox']==line['bbox'] for f in db.fields(con,document_id=key)):
            raise HTTPException(409,'This source line is already mapped to that field. Review the existing field instead.')
        field=dict(id=db.uid('EXT'),documentId=key,parcelId=doc['parcelId'],field=body.field,label=LABEL_NAMES.get(body.field,body.field.replace('_',' ').title()),value=body.value.strip(),originalValue=line['text'],normalizedValue=normalize(body.field,body.value),confidence=round(line['confidence']*100,1),confidenceType=line['method']+'; value manually mapped',page=line['page'],bbox=line['bbox'],pageWidth=line['pageWidth'],pageHeight=line['pageHeight'],source=doc['fileName'],sourceType=doc['documentType'],extractedAt=db.now(),modelVersion='manual-line-mapping-v1',version=1,state='warning',reviewStatus='PENDING',validation='Manual mapping awaits verification.',lowConfidence=True,notes=body.notes.strip(),mappedBy=user['id'],entityType='PARCEL',entityId=doc['parcelId'],evidenceType='MANUAL_SOURCE_MAPPING')
        db.save_field(con,field)
        doc.update(extractionCount=len(db.fields(con,document_id=key)),ocrStatus='COMPLETED',status='PROCESSED')
        db.save_document(con,doc)
        reconcile(con,doc['parcelId'])
        db.audit(con,user['id'],'FIELD_MAPPED',doc['parcelId'],'Officer mapped an OCR source line; verification still required.',{'documentId':key,'field':field})
        return field


@api.patch('/fields/{key}')
def review_field(key: str,body: FieldReview,user=User):
    auth.require_role(user,auth.OFFICERS)
    if body.state not in ('verified','warning') or not body.notes.strip():
        raise HTTPException(422,'Choose a review state and add officer notes.')
    with db.transaction() as con:
        row=con.execute('SELECT data FROM fields WHERE id=?',(key,)).fetchone()
        if not row: raise HTTPException(404,'Field not found.')
        field=db.json.loads(row['data'])
        parcel_for(con,field['parcelId'],user)
        if field['version']!=body.version: raise HTTPException(409,'Evidence changed. Reload before saving your review.')
        before=dict(field)
        value=body.value.strip() if body.value is not None else field['value']
        normalized=normalize(field['field'],value)
        if body.state=='verified' and normalized is None: raise HTTPException(422,'Value cannot be normalized. Include a supported area unit or valid date.')
        field.update(value=value,normalizedValue=normalized,state=body.state,reviewStatus='VERIFIED' if body.state=='verified' else 'FLAGGED',notes=body.notes.strip(),reviewedBy=user['id'],reviewedAt=db.now(),version=field['version']+1,validation='Officer verified source evidence.' if body.state=='verified' else 'Flagged for officer review.')
        db.put(con,'field_revision',dict(id=f"{key}-v{before['version']}",field=before))
        db.save_field(con,field)
        reconcile(con,field['parcelId'])
        db.audit(con,user['id'],'FIELD_REVIEWED',field['parcelId'],'Source field reviewed; original extraction retained.',{'fieldId':key,'before':before,'after':field})
        return field


def joined_case(con,case):
    return dict(case,parcel=db.get(con,'parcel',case['parcelId']),assignedUser={'id':case['assignedTo'],'name':'Assigned verification officer'})


@api.get('/verification')
def cases(user=User):
    with db.transaction() as con:
        ids={p['id'] for p in visible(con,user)}
        return sorted([joined_case(con,c) for c in db.all_entities(con,'case') if c['parcelId'] in ids],key=lambda c:c.get('riskScore',0),reverse=True)


@api.get('/verification/{key}')
def case(key: str,user=User):
    with db.transaction() as con:
        c=db.get(con,'case',key)
        if not c: raise HTTPException(404,'Case not found.')
        parcel_for(con,c['parcelId'],user)
        return joined_case(con,c)


class Decision(BaseModel):
    decision: str
    notes: str = Field(min_length=1,max_length=4000)


@api.post('/verification/{key}/decision')
def decide(key: str,body: Decision,user=User):
    auth.require_role(user,auth.OFFICERS)
    status={'VERIFY':'VERIFIED','VERIFIED':'VERIFIED','REVIEW':'PENDING_REVIEW','REVIEW_REQUIRED':'PENDING_REVIEW','REJECT':'REJECTED','REJECTED':'REJECTED'}.get(body.decision)
    if not status or not body.notes.strip(): raise HTTPException(422,'Valid decision and officer remarks are required.')
    with db.transaction() as con:
        c=db.get(con,'case',key)
        if not c: raise HTTPException(404,'Case not found.')
        p=parcel_for(con,c['parcelId'],user)
        if c['assignedTo']!=user['id']: raise HTTPException(403,'Only the assigned officer may decide this case.')
        fields=db.fields(con,p['id'])
        docs=db.documents(con,p['id'])
        if status=='VERIFIED' and (not fields or any(f.get('reviewStatus')!='VERIFIED' for f in fields) or any(d['ocrStatus']!='COMPLETED' for d in docs)):
            raise HTTPException(409,'Review every extracted field and complete document processing before approving the parcel.')
        checks=(db.get(con,'validation',p['id']) or {}).get('checks',[])
        if status=='VERIFIED' and any(c['status'] in ('REVIEW_REQUIRED','HIGH_RISK','CRITICAL') for c in checks):
            raise HTTPException(409,'Resolve validation discrepancies or keep the parcel in review; field verification alone does not resolve cross-source conflicts.')
        c.update(status=status,notes=body.notes.strip(),decision=body.decision,reviewedBy=user['id'],reviewedAt=db.now())
        p.update(recordStatus='REVIEW_REQUIRED' if status=='PENDING_REVIEW' else status,updatedAt=db.now())
        if status=='VERIFIED':
            # Only an explicit final officer decision promotes reviewed source values.
            source_fields=[f for f in fields if 'ror' in f.get('sourceType','').lower()]
            mapping={'owner_name':'currentRecordedOwner','area':'recordedArea','khata_number':'khataNumber'}
            for field in source_fields:
                if field['field'] in mapping:
                    p[mapping[field['field']]]=field['normalizedValue'] if field['field']=='area' else field['value']
            p['owner']={'name':p['currentRecordedOwner']}
        db.put(con,'case',c)
        db.put(con,'parcel',p)
        db.audit(con,user['id'],'CASE_DECISION_RECORDED',p['id'],'Officer decision saved.',{'caseId':key,'decision':status,'notes':body.notes.strip()})
        return joined_case(con,c)


@api.get('/audit')
def audit(entityId: str | None=None,user=User):
    with db.transaction() as con:
        ids={p['id'] for p in visible(con,user)}
        return [e for e in db.audit_events(con) if (user['role']=='system_admin' or e['entityId'] in ids) and (not entityId or e['entityId']==entityId)]


@api.get('/audit/integrity')
def integrity(user=User):
    with db.transaction() as con: return db.verify_audit(con)


def statistics(con,user):
    ps=visible(con,user)
    ids={p['id'] for p in ps}
    docs=[d for d in db.documents(con) if d['parcelId'] in ids]
    return dict(totalRecords=len(ps),totalParcels=len(ps),totalDocuments=len(docs),processedRecords=sum(any(d['ocrStatus']=='COMPLETED' and d['parcelId']==p['id'] for d in docs) for p in ps),verifiedRecords=sum(p['recordStatus']=='VERIFIED' for p in ps),reviewRequired=sum(p['recordStatus']=='REVIEW_REQUIRED' for p in ps),highRisk=sum(p['riskLevel']=='HIGH' for p in ps),criticalRisk=sum(p['riskLevel']=='CRITICAL' for p in ps),recordHealth=round(sum(p['recordHealth'] for p in ps)/max(1,len(ps))),processingToday=sum(d['uploadedAt'][:10]==db.now()[:10] for d in docs),averageProcessingTime=None)


@api.get('/dashboard')
def dashboard(user=User):
    with db.transaction() as con: return statistics(con,user)


@api.get('/reports/{kind}')
def report(kind: str,user=User):
    with db.transaction() as con:
        ps=visible(con,user)
        if kind=='summary': return statistics(con,user)
        if kind=='risk-distribution': return {level.lower():sum(p['riskLevel']==level for p in ps) for level in ('LOW','MEDIUM','HIGH','CRITICAL')}
        if kind=='validation-distribution': return dict(verified=sum(p['recordStatus']=='VERIFIED' for p in ps),reviewRequired=sum(p['recordStatus']=='REVIEW_REQUIRED' for p in ps),highRisk=sum(p['riskLevel']=='HIGH' for p in ps),critical=sum(p['riskLevel']=='CRITICAL' for p in ps))
        if kind=='risk': return [dict(db.get(con,'risk',p['id']),parcel=p) for p in ps]
        if kind=='conflicts': return [c for p in ps for c in (db.get(con,'conflicts',p['id']) or {'items':[]})['items']]
        if kind=='validation': return [dict(db.get(con,'validation',p['id']),parcel=p,overallResult=p['recordStatus'],conflicts=(db.get(con,'conflicts',p['id']) or {'items':[]})['items']) for p in ps]
    raise HTTPException(404,'Unknown report.')


class Question(BaseModel):
    parcelId: str
    question: str = Field(min_length=1,max_length=2000)


@api.post('/assistant/query')
def assistant(body: Question,user=User):
    # Deliberately bounded local retrieval, not a cloud LLM or legal opinion.
    terms={'owner':['owner_name','buyer'],'buyer':['buyer'],'area':['area','gis_area'],'survey':['survey_number'],'khasra':['survey_number'],'mutation':['mutation_status','mutation_number'],'khata':['khata_number'],'village':['village'],'district':['district']}
    keys={field for term,fields in terms.items() if term in body.question.casefold() for field in fields}
    with db.transaction() as con:
        parcel=parcel_for(con,body.parcelId,user)
        sources=[f for f in evidence(con,body.parcelId) if f['field'] in keys]
        context_values={
            'owner_name': parcel.get('currentRecordedOwner'),
            'area': parcel.get('recordedArea'),
            'survey_number': parcel.get('surveyNumber'),
            'khata_number': parcel.get('khataNumber'),
            'village': parcel.get('village',{}).get('name'),
            'district': parcel.get('village',{}).get('district'),
        }
        for field,value in context_values.items():
            if field in keys and value not in (None,''):
                sources.append(dict(id=f"CTX-{body.parcelId}-{field}",parcelId=body.parcelId,field=field,value=(f'{value} ha' if field=='area' else str(value)),sourceType='PARCEL_CONTEXT',documentName='Parcel registry context',page=None,reviewStatus='CONTEXT'))
        if 'gis_area' in keys and parcel.get('gis',{}).get('area') is not None:
            gis=parcel['gis']
            sources.append(dict(id=gis['id'],parcelId=body.parcelId,field='gis_area',value=f"{gis['area']} ha",sourceType='GIS',documentName=gis.get('source','GIS record'),page=None,reviewStatus='SYNTHETIC_SAMPLE' if gis.get('sample') else 'LOCAL_SOURCE'))
        answer='\n'.join(f"{f['field'].replace('_',' ').title()}: {f['value']} — {f.get('source') or f.get('documentName')}" + (f", page {f['page']}" if f.get('page') else '') + f" ({f.get('reviewStatus','AVAILABLE')})." for f in sources)
        if not answer: answer='No supporting extracted evidence was found for this question. Ask about an owner, area, survey/khasra, khata, mutation, village, or district. This local MVP does not infer missing facts or determine legal ownership.'
        return dict(id=db.uid('ANS'),parcelId=body.parcelId,question=body.question,answer=answer,sources=sources,generatedAt=db.now(),mode='local-evidence-retrieval')


app.include_router(api)
