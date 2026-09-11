"""Durable local MVP storage. One transaction includes every change and its audit event."""
import hashlib
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env')
DATA = Path(os.getenv('BHARAT_DATA_DIR', str(ROOT / 'data'))).resolve()


def now():
    return datetime.now(timezone.utc).isoformat()


def uid(prefix):
    return prefix + '-' + uuid.uuid4().hex[:12].upper()


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


@contextmanager
def transaction():
    DATA.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DATA / 'bharat.sqlite3', timeout=30)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON')
    try:
        con.execute('BEGIN IMMEDIATE')
        yield con
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def initialize():
    with transaction() as con:
        con.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS entities(kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(kind,id));
        CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, parcel_id TEXT NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS fields(id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id), parcel_id TEXT NOT NULL, data TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS fields_parcel ON fields(parcel_id);
        CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id), status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, data TEXT NOT NULL, previous_hash TEXT NOT NULL, hash TEXT NOT NULL);
        CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT,'Audit events are append-only'); END;
        CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT,'Audit events are append-only'); END;
        CREATE TABLE IF NOT EXISTS login_attempts(identity TEXT PRIMARY KEY, failures INTEGER NOT NULL, reset_at REAL NOT NULL);
        ''')


def get(con, kind, key):
    row = con.execute('SELECT data FROM entities WHERE kind=? AND id=?', (kind, key)).fetchone()
    return json.loads(row['data']) if row else None


def all_entities(con, kind):
    return [json.loads(r['data']) for r in con.execute('SELECT data FROM entities WHERE kind=? ORDER BY id', (kind,))]


def put(con, kind, obj):
    con.execute('INSERT INTO entities VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data', (kind, obj['id'], encode(obj)))


def document(con, key):
    row = con.execute('SELECT data FROM documents WHERE id=?', (key,)).fetchone()
    return json.loads(row['data']) if row else None


def documents(con, parcel_id=None, include_archived=False):
    sql, args = ('SELECT data FROM documents ORDER BY rowid DESC', ()) if parcel_id is None else ('SELECT data FROM documents WHERE parcel_id=? ORDER BY rowid DESC', (parcel_id,))
    items = [json.loads(r['data']) for r in con.execute(sql, args)]
    return items if include_archived else [item for item in items if not item.get('archivedAt')]


def save_document(con, doc):
    con.execute('INSERT INTO documents VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,parcel_id=excluded.parcel_id', (doc['id'], doc['parcelId'], encode(doc)))


def fields(con, parcel_id=None, document_id=None):
    if document_id:
        rows = con.execute('SELECT data FROM fields WHERE document_id=? ORDER BY rowid', (document_id,))
    else:
        rows = con.execute('SELECT data FROM fields WHERE parcel_id=? ORDER BY rowid', (parcel_id,))
    items = [json.loads(r['data']) for r in rows]
    active_document_ids = {item['id'] for item in documents(con)}
    return [item for item in items if item['documentId'] in active_document_ids]


def save_field(con, field):
    con.execute('INSERT INTO fields VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data', (field['id'], field['documentId'], field['parcelId'], encode(field)))


def audit(con, actor, action, entity, description, metadata=None):
    last = con.execute('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').fetchone()
    previous = last['hash'] if last else '0' * 64
    event = dict(id=uid('AUD'), user=actor, action=action, entityId=entity, timestamp=now(), description=description, metadata=metadata or {})
    body = encode(event)
    digest = hashlib.sha256((previous + body).encode()).hexdigest()
    con.execute('INSERT INTO audit(id,data,previous_hash,hash) VALUES(?,?,?,?)', (event['id'], body, previous, digest))
    return event['id']


def audit_events(con):
    return [dict(json.loads(r['data']), previousHash=r['previous_hash'], hash=r['hash']) for r in con.execute('SELECT * FROM audit ORDER BY seq DESC')]


def verify_audit(con):
    previous, count = '0' * 64, 0
    for row in con.execute('SELECT * FROM audit ORDER BY seq'):
        expected = hashlib.sha256((previous + row['data']).encode()).hexdigest()
        if row['previous_hash'] != previous or row['hash'] != expected:
            return {'valid': False, 'checked': count, 'failedEvent': row['id']}
        previous, count = row['hash'], count + 1
    return {'valid': True, 'checked': count, 'headHash': previous}
