import hashlib
import hmac
import secrets
import time

from fastapi import HTTPException, Request
from . import store as db

COOKIE = 'bharat_session'
OFFICERS = {'verification_officer', 'revenue_officer'}
UPLOADERS = OFFICERS | {'system_admin', 'digitization_operator'}


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000).hex()
    return salt + ':' + digest


def check_password(password, stored):
    salt, digest = stored.split(':')
    return hmac.compare_digest(hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 310000).hex(), digest)


def current_user(request: Request):
    token = request.cookies.get(COOKIE, '')
    with db.transaction() as con:
        row = con.execute('SELECT u.data FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?', (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
    if not row:
        raise HTTPException(401, 'Sign in to continue.')
    return db.json.loads(row['data'])


def require_role(user, roles):
    if user['role'] not in roles:
        raise HTTPException(403, 'Your role cannot perform this action.')


def require_parcel(user, parcel):
    if not parcel:
        raise HTTPException(404, 'Parcel not found.')
    scope = user.get('district')
    if user['role'] != 'system_admin' and scope != parcel.get('village', {}).get('district'):
        raise HTTPException(403, 'Parcel is outside your assigned district.')
    return parcel
