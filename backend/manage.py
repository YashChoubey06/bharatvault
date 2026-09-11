"""Local administrator password reset. Run interactively; never put passwords in CLI arguments."""
import argparse
import getpass
from . import store as db
from .auth import hash_password

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('email',help='Existing local account email')
    args=parser.parse_args()
    password=getpass.getpass('New password (at least 10 characters): ')
    if len(password)<10 or password!=getpass.getpass('Confirm password: '):
        raise SystemExit('Passwords must match and contain at least 10 characters.')
    with db.transaction() as con:
        row=con.execute('SELECT id FROM users WHERE email=?',(args.email.strip().lower(),)).fetchone()
        if not row: raise SystemExit('Account does not exist.')
        con.execute('UPDATE users SET password=? WHERE id=?',(hash_password(password),row['id']))
        con.execute('DELETE FROM sessions WHERE user_id=?',(row['id'],))
        db.audit(con,'local-administrator','PASSWORD_RESET','SYSTEM','Local account password reset; active sessions revoked.',{'userId':row['id']})
    print('Password updated; sign in again.')
