"""Sample parcel context only. No invented documents or extracted evidence."""
import os
from . import store as db
from .auth import hash_password
from .intelligence import reconcile


def seed():
    password = os.getenv('BHARAT_BOOTSTRAP_PASSWORD', 'BharatVault-Local-2026')
    with db.transaction() as con:
        if not con.execute('SELECT 1 FROM users LIMIT 1').fetchone():
            if len(password) < 10:
                raise RuntimeError('Set BHARAT_BOOTSTRAP_PASSWORD (at least 10 characters) in environment variables before first start.')
            for index, name, email, role in [(1, 'Rajesh Sharma', 'officer', 'verification_officer'), (2, 'Anita Verma', 'operator', 'digitization_operator'), (3, 'System Administrator', 'admin', 'system_admin')]:
                user = dict(id=f'USR-00{index}', name=name, email=email+'@bharatvault.gov', role=role, district='Kota')
                con.execute('INSERT INTO users VALUES(?,?,?,?)', (user['id'], user['email'], hash_password(password), db.encode(user)))
            db.audit(con, 'bootstrap', 'USERS_CREATED', 'SYSTEM', 'Local MVP accounts initialized with password authentication.')
        existing = db.all_entities(con, 'parcel')
        if existing:
            # Keep built-in demo parcels useful without presenting their geometry as real data.
            for index, parcel in enumerate(existing):
                if parcel.get('sample') and not parcel.get('gis'):
                    x, y = 75.80 + index * .015, 25.18 + index * .012
                    parcel['gis'] = dict(id=f"GIS-{parcel['id']}", surveyNumber=parcel['surveyNumber'], area=round(parcel['recordedArea'] * (1 + (.02 if index % 2 else 0)), 2), source='Synthetic cadastral demo layer', crs='EPSG:4326', geometry={'type':'Polygon','coordinates':[[[x,y],[x+.008,y+.001],[x+.007,y+.007],[x+.001,y+.008],[x,y]]]}, updatedAt=db.now(), sample=True)
                    db.put(con,'parcel',parcel)
                    reconcile(con,parcel['id'])
            return
        for index, owner, survey, area in [(1,'Suresh Kumar','124/3',2.5),(2,'Mohan Kumar','125/1',1.8),(3,'Kavita Devi','126/2',0.82),(4,'Ramesh Chand','127/4',3.1)]:
            x, y = 75.80 + (index-1) * .015, 25.18 + (index-1) * .012
            gis = dict(id=f'GIS-PRC-00{index}',surveyNumber=survey,area=round(area * (1 + (.02 if index % 2 == 0 else 0)),2),source='Synthetic cadastral demo layer',crs='EPSG:4326',geometry={'type':'Polygon','coordinates':[[[x,y],[x+.008,y+.001],[x+.007,y+.007],[x+.001,y+.008],[x,y]]]},updatedAt=db.now(),sample=True)
            parcel = dict(id=f'PRC-00{index}', currentRecordedOwner=owner, owner={'name':owner}, surveyNumber=survey, khataNumber=f'KH-{781+index}', recordedArea=area, area=area, landClassification='Agricultural', sample=True, gis=gis, village=dict(id='VIL-001',name='Rampura',tehsil='Ladpura',district='Kota',state='Rajasthan'), createdAt=db.now(), ownershipHistory={'events':[]})
            db.put(con,'parcel',parcel)
            reconcile(con,parcel['id'])
            db.audit(con,'bootstrap','SAMPLE_PARCEL_CREATED',parcel['id'],'Synthetic parcel context; upload evidence to validate.')
