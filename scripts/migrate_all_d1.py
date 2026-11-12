import os
import sqlite3
import glob
import urllib.request
import json

# Cloudflare D1 Credentials
ACCOUNT_ID = os.environ.get('CLOUDFLARE_ACCOUNT_ID', 'f915ed0757fa4e116c1afe10952a3087')
DB_ID = os.environ.get('CLOUDFLARE_D1_DATABASE_ID', '89914e1e-bf4a-4dc7-9764-c0ae66276fe3')
API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', 'YOUR_CLOUDFLARE_API_TOKEN')
ENDPOINT = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query'

sql_statements = [
    # 1. chat_groups
    """
    CREATE TABLE IF NOT EXISTS chat_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar_url TEXT DEFAULT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # 2. chat_group_members
    """
    CREATE TABLE IF NOT EXISTS chat_group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, user_id)
    );
    """,
    # 3. chat_group_messages
    """
    CREATE TABLE IF NOT EXISTS chat_group_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        message TEXT NOT NULL,
        media_url TEXT DEFAULT NULL,
        media_type TEXT DEFAULT NULL,
        media_name TEXT DEFAULT NULL,
        media_size INTEGER DEFAULT 0,
        reply_to_id INTEGER DEFAULT NULL,
        reply_to_name TEXT DEFAULT NULL,
        reply_to_text TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # 4. direct_messages (ensure columns)
    """
    CREATE TABLE IF NOT EXISTS direct_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        media_url TEXT DEFAULT NULL,
        media_type TEXT DEFAULT NULL,
        media_name TEXT DEFAULT NULL,
        media_size INTEGER DEFAULT 0,
        reply_to_id INTEGER DEFAULT NULL,
        reply_to_name TEXT DEFAULT NULL,
        reply_to_text TEXT DEFAULT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # 5. friendships
    """
    CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'accepted',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, friend_id)
    );
    """
]

alter_statements = [
    "ALTER TABLE profiles ADD COLUMN last_active_at TEXT DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN media_url TEXT DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN media_type TEXT DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN media_name TEXT DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN media_size INTEGER DEFAULT 0;",
    "ALTER TABLE chat_group_messages ADD COLUMN reply_to_id INTEGER DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN reply_to_name TEXT DEFAULT NULL;",
    "ALTER TABLE chat_group_messages ADD COLUMN reply_to_text TEXT DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN media_url TEXT DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN media_type TEXT DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN media_name TEXT DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN media_size INTEGER DEFAULT 0;",
    "ALTER TABLE direct_messages ADD COLUMN reply_to_id INTEGER DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN reply_to_name TEXT DEFAULT NULL;",
    "ALTER TABLE direct_messages ADD COLUMN reply_to_text TEXT DEFAULT NULL;"
]

def run_d1_query(sql):
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({"sql": sql}).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return True, data
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        return False, err_msg
    except Exception as e:
        return False, str(e)

print("=== MIGRATING REMOTE CLOUDFLARE D1 ===")
for sql in sql_statements:
    ok, res = run_d1_query(sql)
    print("CREATE TABLE:", ok, res if not ok else "SUCCESS")

for sql in alter_statements:
    ok, res = run_d1_query(sql)
    # Duplicate column is expected if already added
    print("ALTER TABLE:", ok, "SUCCESS" if ok else "(May already exist)")

print("\n=== MIGRATING LOCAL SQLITE REPLICAS ===")
sqlite_files = ["build/local_replica.sqlite"] + glob.glob(".wrangler/**/*.sqlite", recursive=True) + glob.glob("dist-electron/**/*.sqlite", recursive=True)
for f in set(sqlite_files):
    try:
        conn = sqlite3.connect(f)
        c = conn.cursor()
        for sql in sql_statements:
            c.execute(sql)
        for sql in alter_statements:
            try:
                c.execute(sql)
            except Exception:
                pass
        conn.commit()
        conn.close()
        print(f"Migrated SQLite file: {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")

print("\nAll database migrations completed!")

