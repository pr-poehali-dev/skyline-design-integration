"""
Авторизация администратора: регистрация первого админа, вход, проверка токена.
"""
import json
import os
import hashlib
import hmac
import time
import base64
import psycopg2
from typing import Optional

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def make_token(username):
    secret = os.environ.get('ADMIN_SECRET_KEY', 'fallback-secret')
    payload = base64.b64encode(json.dumps({'u': username, 'exp': int(time.time()) + 86400 * 7}).encode()).decode()
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return payload + '.' + sig

def verify_token(token):
    try:
        parts = token.rsplit('.', 1)
        if len(parts) != 2:
            return None
        payload, sig = parts
        secret = os.environ.get('ADMIN_SECRET_KEY', 'fallback-secret')
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(base64.b64decode(payload).decode())
        if data['exp'] < time.time():
            return None
        return data['u']
    except Exception:
        return None

def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    body = json.loads(event.get('body') or '{}')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    # POST /login
    if method == 'POST' and path.endswith('/login'):
        username = body.get('username', '').strip()
        password = body.get('password', '')
        if not username or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT password_hash FROM ' + schema + '.admins WHERE username = %s', (username,))
        row = cur.fetchone()
        conn.close()

        if not row or row[0] != hash_password(password):
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

        token = make_token(username)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token, 'username': username})}

    # POST /register — создать первого админа (только если нет ни одного)
    if method == 'POST' and path.endswith('/register'):
        username = body.get('username', '').strip()
        password = body.get('password', '')
        if not username or not password:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите логин и пароль'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM ' + schema + '.admins')
        count = cur.fetchone()[0]
        if count > 0:
            conn.close()
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Регистрация закрыта'})}

        cur.execute('INSERT INTO ' + schema + '.admins (username, password_hash) VALUES (%s, %s)', (username, hash_password(password)))
        conn.close()
        token = make_token(username)
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'token': token, 'username': username})}

    # GET /me — проверка токена
    if method == 'GET' and path.endswith('/me'):
        token = event.get('headers', {}).get('X-Admin-Token', '')
        username = verify_token(token)
        if not username:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'username': username})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}
