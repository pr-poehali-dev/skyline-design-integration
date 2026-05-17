"""
CRUD управление товарами (запчастями для Нивы). Требует X-Admin-Token.
"""
import json
import os
import hashlib
import hmac
import time
import base64
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

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

def require_auth(event):
    token = event.get('headers', {}).get('X-Admin-Token', '')
    return verify_token(token)

def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    # GET — список товаров (публичный)
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id, name, description, price, category, sku, in_stock, image_url, created_at FROM ' + schema + '.products ORDER BY created_at DESC')
        rows = cur.fetchall()
        conn.close()
        products = [
            {'id': r[0], 'name': r[1], 'description': r[2], 'price': float(r[3]) if r[3] else None,
             'category': r[4], 'sku': r[5], 'in_stock': r[6], 'image_url': r[7], 'created_at': str(r[8])}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(products, ensure_ascii=False)}

    if not require_auth(event):
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

    body = json.loads(event.get('body') or '{}')

    # POST — создать товар
    if method == 'POST':
        name = body.get('name', '').strip()
        if not name:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Название обязательно'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO ' + schema + '.products (name, description, price, category, sku, in_stock, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id',
            (name, body.get('description'), body.get('price'), body.get('category'), body.get('sku'), body.get('in_stock', True), body.get('image_url'))
        )
        new_id = cur.fetchone()[0]
        conn.close()
        return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id})}

    # PUT — обновить товар
    if method == 'PUT':
        product_id = body.get('id')
        if not product_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'ID обязателен'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            'UPDATE ' + schema + '.products SET name=%s, description=%s, price=%s, category=%s, sku=%s, in_stock=%s, image_url=%s, updated_at=NOW() WHERE id=%s',
            (body.get('name'), body.get('description'), body.get('price'), body.get('category'), body.get('sku'), body.get('in_stock', True), body.get('image_url'), product_id)
        )
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    # DELETE — удалить товар
    if method == 'DELETE':
        product_id = body.get('id') or (event.get('queryStringParameters') or {}).get('id')
        if not product_id:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'ID обязателен'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE ' + schema + '.orders SET product_id=NULL WHERE product_id=%s', (product_id,))
        cur.execute('DELETE FROM ' + schema + '.products WHERE id=%s', (product_id,))
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}