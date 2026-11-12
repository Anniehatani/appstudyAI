import os
import urllib.request
import json

ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID', 'f915ed0757fa4e116c1afe10952a3087')
DB_ID = os.environ.get('CLOUDFLARE_D1_DATABASE_ID', '89914e1e-bf4a-4dc7-9764-c0ae66276fe3')
API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', 'YOUR_CLOUDFLARE_API_TOKEN')
ENDPOINT = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query'

sql = "INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at) SELECT id, '3tg-bot', 'bot', CURRENT_TIMESTAMP FROM chat_groups;"
req = urllib.request.Request(
    ENDPOINT,
    data=json.dumps({'sql': sql}).encode('utf-8'),
    headers={'Authorization': f'Bearer {API_TOKEN}', 'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print('D1 Insert Bot result:', res.get('success'))
except Exception as e:
    print('D1 query error:', e)

