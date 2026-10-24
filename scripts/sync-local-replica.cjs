const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("build/local_replica.sqlite");

db.exec("UPDATE profiles SET avatar_url = '/media/avatars/d6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc/4e444adf-e42e-447f-a2aa-591a1073df21.jpg' WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc'");
const userProf = db.prepare("SELECT full_name, avatar_url, cover_url FROM profiles WHERE user_id = 'd6fe9be1-8be9-43af-9b6a-ac2cfdd0eccc'").get();
console.log("Local replica user profile:", userProf);
