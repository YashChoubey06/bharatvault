import hashlib
import os
import tempfile
import time
import unittest
from unittest.mock import patch
from pathlib import Path
from fastapi.testclient import TestClient
from . import store as db
from .main import app
from .samples import generate
from .intelligence import normalize


class LocalMVPTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix='bharat-mvp-')
        db.DATA=Path(cls.temp.name)
        os.environ['BHARAT_BOOTSTRAP_PASSWORD']='test-password-local'
        cls.samples=generate(db.DATA/'samples')
        cls.client=TestClient(app)
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None,None,None)
        cls.temp.cleanup()

    def login(self,role='officer'):
        response=self.client.post('/api/v1/auth/login',json={'email':role+'@bharatvault.gov','password':'test-password-local'})
        self.assertEqual(response.status_code,200,response.text)

    def upload(self,name,parcel='PRC-001',kind='Current RoR',lang='eng'):
        with (self.samples/name).open('rb') as f:
            response=self.client.post('/api/v1/documents',data={'parcelId':parcel,'documentType':kind,'language':lang},files={'file':(name,f,'image/png')})
        self.assertEqual(response.status_code,202,response.text)
        doc=response.json()
        deadline=time.monotonic()+120
        while time.monotonic()<deadline:
            doc=self.client.get('/api/v1/documents/'+doc['id']).json()
            if doc['ocrStatus'] not in ('QUEUED','PROCESSING'): break
            time.sleep(.25)
        self.assertEqual(doc['ocrStatus'],'COMPLETED',doc)
        return doc

    def test_end_to_end_real_ocr(self):
        self.client.cookies.clear()
        self.assertEqual(self.client.get('/api/v1/parcels').status_code,401)
        self.assertEqual(self.client.post('/api/v1/auth/login',json={'email':'officer@bharatvault.gov','password':'wrong'}).status_code,401)
        self.login()
        self.assertEqual(self.client.post('/api/v1/auth/logout',headers={'origin':'https://malicious.example'}).status_code,403)
        invalid=self.client.post('/api/v1/documents',data={'parcelId':'PRC-001'},files={'file':('bad.pdf',b'not a pdf','application/pdf')})
        self.assertEqual(invalid.status_code,422)
        doc=self.upload('sample-ror-english.png')
        by_field={f['field']:f for f in doc['extractions']}
        self.assertGreaterEqual(len(by_field),7)
        self.assertEqual(by_field['survey_number']['value'],'124/3')
        self.assertEqual(by_field['area']['normalizedValue'],2.5)
        self.assertTrue(all(f['bbox'][2]>f['bbox'][0] and f['bbox'][3]>f['bbox'][1] for f in by_field.values()))
        original=self.client.get('/api/v1/documents/'+doc['id']+'/original')
        self.assertEqual(hashlib.sha256(original.content).hexdigest(),doc['sha256'])
        self.assertEqual(self.client.get('/api/v1/documents/'+doc['id']+'/pages/1').status_code,200)
        # A second independent source creates a real discrepancy from OCR values.
        sale=self.upload('sample-sale-conflict.png',kind='Registration Deed')
        conflicts=self.client.get('/api/v1/parcels/PRC-001/conflicts').json()
        self.assertTrue(any(c['type']=='AREA_CONSISTENCY' for c in conflicts),conflicts)
        answer=self.client.post('/api/v1/assistant/query',json={'parcelId':'PRC-001','question':'What is the area?'}).json()
        self.assertGreaterEqual(len(answer['sources']),2)
        unsupported=self.client.post('/api/v1/assistant/query',json={'parcelId':'PRC-001','question':'Predict tomorrow weather'}).json()
        self.assertEqual(unsupported['sources'],[])
        self.assertEqual(self.client.post('/api/v1/verification/CASE-PRC-001/decision',json={'decision':'VERIFIED','notes':'test'}).status_code,409)
        field=by_field['owner_name']
        review={'version':1,'state':'verified','notes':'Compared against original scan','value':'Suresh Kumar'}
        self.login('operator')
        self.assertEqual(self.client.patch('/api/v1/fields/'+field['id'],json=review).status_code,403)
        self.assertEqual(self.client.post('/api/v1/verification/CASE-PRC-001/decision',json={'decision':'VERIFIED','notes':'test'}).status_code,403)
        self.login()
        saved=self.client.patch('/api/v1/fields/'+field['id'],json=review)
        self.assertEqual(saved.status_code,200,saved.text)
        self.assertEqual(saved.json()['originalValue'],field['originalValue'])
        self.assertEqual(saved.json()['version'],2)
        self.assertEqual(self.client.patch('/api/v1/fields/'+field['id'],json=review).status_code,409)
        # Database reopened independently, proving the change is not client memory.
        with db.transaction() as con:
            self.assertEqual(next(f for f in db.fields(con,'PRC-001') if f['id']==field['id'])['version'],2)
            self.assertTrue(db.verify_audit(con)['valid'])
            with self.assertRaises(Exception): con.execute('DELETE FROM audit')
        # A non-conflicting record can be reviewed and approved.
        hindi=self.upload('sample-ror-hindi.png',parcel='PRC-003',lang='eng+hin')
        hindi_fields={f['field']:f for f in hindi['extractions']}
        self.assertGreaterEqual(len(hindi_fields),5,hindi['rawText'])
        for f in hindi['extractions']:
            result=self.client.patch('/api/v1/fields/'+f['id'],json={'version':f['version'],'state':'verified','notes':'Synthetic test scan inspected'})
            self.assertEqual(result.status_code,200,result.text)
        decision=self.client.post('/api/v1/verification/CASE-PRC-003/decision',json={'decision':'VERIFIED','notes':'All synthetic source fields checked; no conflicting sources.'})
        self.assertEqual(decision.status_code,200,decision.text)
        self.assertEqual(self.client.get('/api/v1/parcels/PRC-003').json()['recordStatus'],'VERIFIED')
        print('PASS: real English/Hindi OCR, conflicts, roles, source hash, preview, correction versions, persistence, approval and audit integrity')

    def test_normalization(self):
        self.assertEqual(normalize('area','२५००० वर्ग मीटर'),2.5)
        self.assertIsNone(normalize('area','2 bigha'))
        self.assertEqual(normalize('mutation_date','17/08/2021'),'2021-08-17')

    def test_pdf_and_empty_states(self):
        from PIL import Image
        self.login()
        image=Image.open(self.samples/'sample-ror-english.png').convert('RGB')
        image.save(self.samples/'sample-multipage.pdf',save_all=True,append_images=[image],resolution=180)
        pdf=self.upload('sample-multipage.pdf',parcel='PRC-002')
        self.assertEqual(pdf['pages'],2)
        self.assertEqual({f['page'] for f in pdf['extractions']},{1,2})
        self.assertEqual(self.client.get('/api/v1/documents/'+pdf['id']+'/pages/3').status_code,404)
        with (self.samples/'sample-multipage.pdf').open('rb') as f:
            duplicate=self.client.post('/api/v1/documents',data={'parcelId':'PRC-002'},files={'file':('copy.pdf',f)})
        self.assertEqual(duplicate.status_code,409)
        blank=self.samples/'blank.png'
        Image.new('RGB',(600,800),'white').save(blank)
        with blank.open('rb') as f:
            upload=self.client.post('/api/v1/documents',data={'parcelId':'PRC-004'},files={'file':('blank.png',f)}).json()
        for _ in range(120):
            result=self.client.get('/api/v1/documents/'+upload['id']).json()
            if result['ocrStatus'] not in ('QUEUED','PROCESSING'): break
            time.sleep(.1)
        self.assertEqual(result['ocrStatus'],'REVIEW_REQUIRED')
        self.assertEqual(result['extractions'],[])
        self.assertEqual(result['confidence'],0)
        self.assertEqual(self.client.post('/api/v1/verification/CASE-PRC-004/decision',json={'decision':'VERIFIED','notes':'Cannot approve blank evidence'}).status_code,409)

    def test_scope_manual_mapping_and_rate_limit(self):
        self.login()
        doc=next(d for d in self.client.get('/api/v1/documents').json() if d['fileName']=='sample-ror-english.png')
        details=self.client.get('/api/v1/documents/'+doc['id']).json()
        index=next(i for i,line in enumerate(details['ocrLines']) if line['text'].startswith('Owner:'))
        body={'lineIndex':index,'field':'buyer','value':'Suresh Kumar','notes':'Test manual source-line mapping'}
        mapped=self.client.post('/api/v1/documents/'+doc['id']+'/fields',json=body)
        self.assertEqual(mapped.status_code,201,mapped.text)
        self.assertEqual(mapped.json()['reviewStatus'],'PENDING')
        self.assertEqual(mapped.json()['originalValue'],details['ocrLines'][index]['text'])
        self.assertEqual(self.client.post('/api/v1/documents/'+doc['id']+'/fields',json=body).status_code,409)
        with db.transaction() as con:
            outside=db.get(con,'parcel','PRC-004')
            outside['village']['district']='Outside scope'
            db.put(con,'parcel',outside)
        self.assertEqual(self.client.get('/api/v1/parcels/PRC-004').status_code,403)
        self.assertFalse(any(p['id']=='PRC-004' for p in self.client.get('/api/v1/parcels').json()))
        for _ in range(8):
            self.client.post('/api/v1/auth/login',json={'email':'unknown@bharatvault.gov','password':'wrong'})
        self.assertEqual(self.client.post('/api/v1/auth/login',json={'email':'unknown@bharatvault.gov','password':'wrong'}).status_code,429)

    def test_worker_failure_retry(self):
        self.login()
        with patch.dict(os.environ,{'TESSERACT_CMD':'missing-tesseract-test.exe'}):
            with (self.samples/'sample-sale-conflict.png').open('rb') as f:
                upload=self.client.post('/api/v1/documents',data={'parcelId':'PRC-002'},files={'file':('retry-test.png',f)}).json()
            for _ in range(120):
                doc=self.client.get('/api/v1/documents/'+upload['id']).json()
                if doc['ocrStatus']=='FAILED': break
                time.sleep(.1)
            self.assertEqual(doc['ocrStatus'],'FAILED')
        self.assertEqual(self.client.post('/api/v1/documents/'+doc['id']+'/process').status_code,200)
        for _ in range(120):
            result=self.client.get('/api/v1/documents/'+doc['id']).json()
            if result['ocrStatus']=='COMPLETED': break
            time.sleep(.1)
        self.assertEqual(result['ocrStatus'],'COMPLETED')


if __name__=='__main__': unittest.main(verbosity=2)
