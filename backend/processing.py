import logging
import threading
from . import store as db, ocr
from .intelligence import extract, classify, reconcile

stop_event = threading.Event()
wake_event = threading.Event()


def enqueue(con, doc, actor):
    job = dict(id=db.uid('JOB'), documentId=doc['id'], createdAt=db.now(), actor=actor)
    con.execute('INSERT INTO jobs VALUES(?,?,?,0,?)', (job['id'], doc['id'], 'QUEUED', db.encode(job)))
    doc.update(ocrStatus='QUEUED', status='QUEUED', processedPages=0, error=None, jobId=job['id'])
    db.save_document(con, doc)
    db.audit(con, actor, 'DOCUMENT_QUEUED', doc['parcelId'], 'Document queued for local OCR.', {'documentId': doc['id'], 'jobId': job['id']})
    wake_event.set()
    return job


def run_one():
    with db.transaction() as con:
        row = con.execute("SELECT * FROM jobs WHERE status='QUEUED' ORDER BY rowid LIMIT 1").fetchone()
        if not row:
            return False
        job = db.json.loads(row['data'])
        con.execute("UPDATE jobs SET status='RUNNING', attempts=attempts+1 WHERE id=?", (job['id'],))
        doc = db.document(con, job['documentId'])
        doc.update(ocrStatus='PROCESSING', status='PROCESSING', startedAt=db.now())
        db.save_document(con, doc)
    try:
        def progress(page):
            with db.transaction() as con:
                current = db.document(con, doc['id'])
                current['processedPages'] = page
                db.save_document(con, current)
        lines = ocr.process(doc, progress)
        if doc['documentType'] == 'Auto detect':
            doc['documentType'] = classify('\n'.join(line['text'] for line in lines))
        fields = extract(lines, doc)
        with db.transaction() as con:
            for field in fields:
                db.save_field(con, field)
            doc.update(ocrStatus='COMPLETED' if fields else 'REVIEW_REQUIRED', status='PROCESSED' if fields else 'REVIEW_REQUIRED', processedPages=doc['pages'], completedAt=db.now(), rawText='\n'.join(line['text'] for line in lines), ocrLines=lines, extractionCount=len(fields), confidence=round(sum(f['confidence'] for f in fields)/max(1,len(fields)), 1))
            db.save_document(con, doc)
            con.execute("UPDATE jobs SET status='COMPLETED' WHERE id=?", (job['id'],))
            reconcile(con, doc['parcelId'])
            db.audit(con, 'local-ocr-worker', 'OCR_COMPLETED', doc['parcelId'], f'Extracted {len(fields)} fields; validation recalculated.', {'documentId': doc['id'], 'model': 'tesseract-5-label-rules-v1'})
    except Exception:
        logging.exception('Local OCR job failed: %s', job['id'])
        with db.transaction() as con:
            doc.update(ocrStatus='FAILED', status='FAILED', error='Local OCR failed. Check the OCR runtime and document quality, then retry.')
            db.save_document(con, doc)
            con.execute("UPDATE jobs SET status='FAILED' WHERE id=?", (job['id'],))
            db.audit(con, 'local-ocr-worker', 'OCR_FAILED', doc['parcelId'], doc['error'], {'documentId': doc['id']})
    return True


def worker():
    while not stop_event.is_set():
        if not run_one():
            wake_event.wait(2)
            wake_event.clear()


def start():
    stop_event.clear()
    with db.transaction() as con:
        interrupted=con.execute("SELECT * FROM jobs WHERE status='RUNNING'").fetchall()
        for row in interrupted:
            doc=db.document(con,row['document_id'])
            if row['attempts']>=3:
                con.execute("UPDATE jobs SET status='FAILED' WHERE id=?",(row['id'],))
                doc.update(ocrStatus='FAILED',status='FAILED',error='Processing was interrupted repeatedly. Review the source and retry manually.')
            else:
                con.execute("UPDATE jobs SET status='QUEUED' WHERE id=?",(row['id'],))
                doc.update(ocrStatus='QUEUED',status='QUEUED')
            db.save_document(con,doc)
            db.audit(con,'local-ocr-worker','JOB_RECOVERED',doc['parcelId'],'Interrupted local job recovered.',{'documentId':doc['id'],'attempts':row['attempts']})
    thread = threading.Thread(target=worker, name='local-ocr', daemon=True)
    thread.start()
    return thread
