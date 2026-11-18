import sqlite3

con = sqlite3.connect('build/local_replica.sqlite')
tables = con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").fetchall()

print(f"Total tables: {len(tables)}")
for (tname,) in sorted(tables):
    cols = con.execute(f"PRAGMA table_info({tname})").fetchall()
    fks = con.execute(f"PRAGMA foreign_key_list({tname})").fetchall()
    fk_dict = {f[3]: f"{f[2]}({f[4]})" for f in fks}
    col_desc = []
    for c in cols:
        name = c[1]
        dtype = c[2]
        is_pk = c[5] > 0
        fk = f" -> {fk_dict[name]}" if name in fk_dict else ""
        col_desc.append(f"{'[PK] ' if is_pk else ''}{name}: {dtype}{fk}")
    print(f"[{tname}]")
    for cd in col_desc:
        print(f"  • {cd}")
    print()
