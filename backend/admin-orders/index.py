"""
Управление заявками покупателей. GET/PUT требуют X-Admin-Token. POST публичный (форма заказа).
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

def handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    body = json.loads(event.get('body') or '{}')

    # POST — создать заявку (публичный)
    if method == 'POST':
        name = body.get('customer_name', '').strip()
        phone = body.get('customer_phone', '').strip()
        if not name or not phone:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO ' + schema + '.orders (customer_name, customer_phone, customer_email, product_id, product_name, message) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
            (name, phone, body.get('customer_email'), body.get('product_id'), body.get('product_name'), body.get('message'))
        )
        new_id = cur.fetchone()[0]
        conn.close()
        return {'statusCode': 201, 'headers': CORS_HEADERS, 'body': json.dumps({'id': new_id, 'ok': True})}

    token = event.get('headers', {}).get('X-Admin-Token', '')
    if not verify_token(token):
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

    # GET — список заявок
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id, customer_name, customer_phone, customer_email, product_name, message, status, created_at FROM ' + schema + '.orders ORDER BY created_at DESC')
        rows = cur.fetchall()
        conn.close()
        orders = [
            {'id': r[0], 'customer_name': r[1], 'customer_phone': r[2], 'customer_email': r[3],
             'product_name': r[4], 'message': r[5], 'status': r[6], 'created_at': str(r[7])}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(orders, ensure_ascii=False)}

    # PUT — обновить статус заявки
    if method == 'PUT':
        order_id = body.get('id')
        status = body.get('status')
        if not order_id or not status:
            return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'ID и статус обязательны'})}
        conn = get_db()
        cur = conn.cursor()
        cur.execute('UPDATE ' + schema + '.orders SET status=%s WHERE id=%s', (status, order_id))
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}