"""Explainable extraction and reconciliation. Evidence is never inferred from parcel fixtures."""
import os
import re
import unicodedata
from . import store as db

CONFIDENCE_THRESHOLD = float(os.getenv('OCR_CONFIDENCE_THRESHOLD', '85'))
AREA_TOLERANCE_HA = float(os.getenv('AREA_TOLERANCE_HA', '0.02'))
LABELS = {
    'owner_name': r'(?:current\s+(?:primary\s+)?owner|owner(?:\s+name)?|landowner|khatedar|खातेदार|भूमिस्वामी)',
    'buyer': r'(?:registered\s+buyer|buyer|क्रेता)',
    'seller': r'(?:seller|विक्रेता)',
    'survey_number': r'(?:survey(?:\s+(?:number|no\.?))?|khasra(?:\s+(?:number|no\.?))?|खसरा(?:\s+नंबर)?)',
    'khata_number': r'(?:khata(?:\s+(?:number|no\.?))?|खाता(?:\s+नंबर)?)',
    'area': r'(?:total\s+(?:parcel\s+)?area|recorded\s+area|plot\s+area|area|रकबा|क्षेत्रफल)',
    'gis_area': r'(?:calculated\s+gis\s+area|gis\s+area)',
    'village': r'(?:village|ग्राम|गांव)',
    'tehsil': r'(?:tehsil|तहसील)',
    'district': r'(?:district|जिला)',
    'land_classification': r'(?:land\s+classification|land\s+type|भूमि\s+प्रकार)',
    'mutation_status': r'(?:mutation\s+(?:entry\s+)?status|नामांतरण\s+स्थिति)',
    'mutation_number': r'(?:mutation\s+(?:number|no\.?|entry)|नामांतरण\s+क्रमांक)',
    'registration_number': r'(?:registration\s+(?:number|no\.?)|पंजीकरण\s+क्रमांक)',
    'registration_date': r'(?:registration\s+date|पंजीकरण\s+दिनांक)',
    'mutation_date': r'(?:mutation\s+date|नामांतरण\s+दिनांक)',
}
LABEL_NAMES = {'owner_name': 'Current Primary Owner', 'buyer': 'Registered Buyer', 'area': 'Total Parcel Area', 'gis_area': 'Calculated GIS Area', 'survey_number': 'Khasra / Survey Number', 'mutation_status': 'Mutation Entry Status'}


def normalize(field, value):
    value = unicodedata.normalize('NFKC', str(value))
    value = ''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in value)
    value = re.sub(r'\s+', ' ', value).strip()
    if field in {'area', 'gis_area'}:
        m = re.search(r'-?\d+(?:\.\d+)?', value.replace(',', ''))
        if not m:
            return None
        amount = float(m[0])
        if re.search(r'acre|एकड़', value, re.I):
            amount *= 0.40468564224
        elif re.search(r'(?:sq\.?\s*m|m²|square\s+met|वर्ग\s*मीटर)', value, re.I):
            amount /= 10000
        elif not re.search(r'hectare|\bha\b|हेक्टेयर', value, re.I):
            return None  # Never guess a regional area unit.
        return round(amount, 6)
    if field.endswith('_date'):
        from datetime import datetime
        for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
            try:
                return datetime.strptime(value, fmt).date().isoformat()
            except ValueError:
                pass
        return None
    return value.casefold()


def extract(lines, doc):
    result = []
    patterns = {name: re.compile(r'^\s*' + label + r'\s*[:=\-]\s*(.+?)\s*$', re.I) for name, label in LABELS.items()}
    for line in lines:
        for name, pattern in patterns.items():
            match = pattern.match(line['text'])
            if not match:
                continue
            value = match[1].strip()
            confidence = round(float(line.get('confidence', 0)) * 100, 1)
            normalized = normalize(name, value)
            result.append(dict(id=db.uid('EXT'), documentId=doc['id'], parcelId=doc['parcelId'], field=name,
                label=LABEL_NAMES.get(name, name.replace('_', ' ').title()), value=value, originalValue=value,
                normalizedValue=normalized, confidence=confidence, confidenceType=line.get('method', 'ocr'),
                page=line['page'], bbox=line['bbox'], pageWidth=line['pageWidth'], pageHeight=line['pageHeight'],
                source=doc['fileName'], sourceType=doc['documentType'], extractedAt=db.now(),
                modelVersion=line.get('modelVersion', 'native-pdf+label-rules-v1'), version=1,
                state='warning', reviewStatus='PENDING', validation='Awaiting officer review.',
                lowConfidence=confidence < CONFIDENCE_THRESHOLD or normalized is None,
                entityType='PARCEL', entityId=doc['parcelId'], evidenceType='SOURCE_EXTRACTION'))
            break
    return result


def classify(text):
    for kind, expression in [('Mutation Record', 'mutation|नामांतरण'), ('Registration Deed', 'sale deed|registration deed|विक्रय'), ('GIS Extract', 'cadastral|gis area'), ('Current RoR', 'record of rights|jamabandi|जमाबंदी')]:
        if re.search(expression, text, re.I):
            return kind
    return 'Unknown — Manual Review Required'


def reconcile(con, parcel_id):
    parcel = db.get(con, 'parcel', parcel_id)
    docs = db.documents(con, parcel_id)
    extracted = db.fields(con, parcel_id)
    checks, conflicts, factors = [], [], []

    def check(name, status, message, impact=0, sources=None):
        checks.append(dict(check=name, status=status, message=message, sources=sources or []))
        if impact:
            factors.append(dict(factor=message, impact=impact))

    def conflict(name, field, values, severity='MEDIUM'):
        message = ' vs '.join(f"{v['source']}: {v['value']}" for v in values)
        conflicts.append(dict(id=f'{parcel_id}-{name}-{len(conflicts)}', parcelId=parcel_id, type=name,
            field=field, severity=severity, sources=values, status='OPEN', description=message,
            sourceA=values[0]['source'], sourceAValue=values[0]['value'],
            sourceB=values[-1]['source'], sourceBValue=values[-1]['value']))
        check(name, 'HIGH_RISK' if severity == 'HIGH' else 'REVIEW_REQUIRED', message, 25 if severity == 'HIGH' else 15, values)

    low = [f for f in extracted if f.get('lowConfidence') and f.get('reviewStatus') != 'VERIFIED']
    check('DOCUMENT_QUALITY', 'REVIEW_REQUIRED' if low or not extracted else 'VERIFIED',
          f'{len(low)} fields need confidence review.' if extracted else 'No extracted evidence available.', 10 if low or not extracted else 0)
    available = {f['field'] for f in extracted}
    missing = sorted({'owner_name', 'survey_number', 'area', 'village', 'tehsil', 'district'} - available)
    check('RECORD_COMPLETENESS', 'REVIEW_REQUIRED' if missing else 'VERIFIED', 'Missing: ' + ', '.join(missing) if missing else 'Core fields are present.', 10 if missing else 0)
    categories = {'RoR': any('ror' in d['documentType'].lower() or 'rights' in d['documentType'].lower() for d in docs),
                  'Registration': any('registration' in d['documentType'].lower() for d in docs),
                  'Mutation': any('mutation' in d['documentType'].lower() for d in docs),
                  'GIS': bool(parcel.get('gis')) or 'gis_area' in available}
    check('SOURCE_COMPLETENESS', 'INFORMATIONAL', 'Available sources: ' + ', '.join(k for k, v in categories.items() if v) + '. Missing: ' + ', '.join(k for k,v in categories.items() if not v))

    def sources(field_names):
        return [dict(source=f['source'], value=f['value'], normalized=f.get('normalizedValue'), documentId=f['documentId'], page=f['page'], fieldId=f['id']) for f in extracted if f['field'] in field_names and f.get('normalizedValue') is not None and 'historical' not in f.get('sourceType','').lower()]

    for name, group in [('OWNER_CONSISTENCY', {'owner_name', 'buyer'}), ('SURVEY_NUMBER_CONSISTENCY', {'survey_number'}), ('KHATA_CONSISTENCY', {'khata_number'})]:
        values = sources(group)
        if len({v['normalized'] for v in values}) > 1:
            conflict(name, next(iter(sorted(group))), values)
        else:
            check(name, 'VERIFIED' if len(values) > 1 else 'INFORMATIONAL', 'Available values agree.' if len(values) > 1 else 'Insufficient independent sources for comparison.', sources=values)
    identifiers = sources({'survey_number'})
    mismatches = [v for v in identifiers if v['normalized'] != normalize('survey_number', parcel.get('surveyNumber', ''))]
    if mismatches:
        conflict('PARCEL_MATCH', 'survey_number', [dict(source='Selected parcel', value=parcel['surveyNumber'])] + mismatches, 'HIGH')
    areas = sources({'area'})
    spatial = sources({'gis_area'})
    if parcel.get('gis', {}).get('area') is not None:
        spatial.append(dict(source='Imported GIS dataset' + (' (sample)' if parcel.get('sample') else ''), value=f"{parcel['gis']['area']} ha", normalized=float(parcel['gis']['area'])))
    if any(v['normalized'] <= 0 for v in areas + spatial):
        conflict('INVALID_AREA', 'area', areas + spatial, 'HIGH')
    if len(areas) > 1 and max(v['normalized'] for v in areas) - min(v['normalized'] for v in areas) > AREA_TOLERANCE_HA:
        conflict('AREA_CONSISTENCY', 'area', areas)
    else:
        check('AREA_CONSISTENCY', 'VERIFIED' if len(areas)>1 else 'INFORMATIONAL', f'Area tolerance: {AREA_TOLERANCE_HA} ha; {len(areas)} textual source values available.', sources=areas)
    if areas and spatial and any(abs(a['normalized'] - b['normalized']) > AREA_TOLERANCE_HA for a in areas for b in spatial):
        conflict('TEXT_GIS_CONSISTENCY', 'area', areas + spatial, 'HIGH')
    else:
        check('TEXT_GIS_CONSISTENCY', 'VERIFIED' if areas and spatial else 'INFORMATIONAL', 'Spatial and textual areas agree.' if areas and spatial else 'GIS comparison unavailable.', sources=areas + spatial)
    dates = {f['field']: f.get('normalizedValue') for f in extracted if f['field'].endswith('_date')}
    bad_date = dates.get('mutation_date') and dates.get('registration_date') and dates['mutation_date'] < dates['registration_date']
    check('MUTATION_CONTINUITY', 'REVIEW_REQUIRED' if bad_date else 'INFORMATIONAL', 'Mutation predates registration.' if bad_date else 'Dates reviewed where available; missing history is not inferred.', 15 if bad_date else 0)
    pending = [f for f in extracted if f['field']=='mutation_status' and str(f['normalizedValue']).upper() not in ('APPROVED','VERIFIED','स्वीकृत')]
    if pending:
        conflict('MUTATION_STATUS', 'mutation_status', sources({'mutation_status'}))
    check('HISTORICAL_CONTINUITY', 'INFORMATIONAL', 'Historical continuity requires dated source evidence; no ownership history is inferred.')
    if parcel.get('courtCase'):
        check('DISPUTE_STATUS', 'REVIEW_REQUIRED', 'An imported dispute record requires review.', 15)
    score = min(100, sum(f['impact'] for f in factors))
    level = 'LOW' if score <= 20 else 'MEDIUM' if score <= 50 else 'HIGH' if score <= 80 else 'CRITICAL'
    health = round(100 * sum(c['status']=='VERIFIED' for c in checks) / max(1, sum(c['status']!='INFORMATIONAL' for c in checks)))
    validation = dict(id=parcel_id, parcelId=parcel_id, checks=checks, overallConfidence=sum(f['confidence'] for f in extracted)/max(1,len(extracted))/100, updatedAt=db.now(), sourceCompleteness=categories)
    risk = dict(id=parcel_id, parcelId=parcel_id, riskScore=score, score=score, riskLevel=level, level=level, factors=factors)
    db.put(con, 'validation', validation)
    db.put(con, 'risk', risk)
    db.put(con, 'conflicts', {'id': parcel_id, 'items': conflicts})
    parcel.update(risk=risk, riskScore=score, riskLevel=level, recordHealth=health, healthScore=health, updatedAt=db.now())
    # Reprocessing evidence invalidates a prior parcel decision, never grants approval.
    parcel.update(recordStatus='REVIEW_REQUIRED', status='REVIEW_REQUIRED')
    db.put(con, 'parcel', parcel)
    case = db.get(con, 'case', f'CASE-{parcel_id}') or dict(id=f'CASE-{parcel_id}', parcelId=parcel_id, assignedTo='USR-001', createdAt=db.now())
    case.update(priority=level, riskScore=score, status='PENDING_REVIEW', reason=[f['factor'] for f in factors] or ['Evidence awaits officer verification.'])
    db.put(con, 'case', case)
    return validation
