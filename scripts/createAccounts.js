import * as fs from "fs"
import * as PH from "../server.js"

var data = fs.readFileSync(PH.__dirname + "/form.csv", "utf-8");

let rows = data.split("\n");

rows.forEach(r => {
    r = r.trim();
    let columns = r.split(",");
    let name = nameCase(columns[2].slice(1, -1).trim());
    let no = Number(columns[3].slice(1, -1).trim());
    let classroom = columns[4].slice(1, -1).trim();
    let password = columns[5].slice(1, -1).trim();

    let nickname = name.split(" ")[0].toLowerCase() + no;
    let graduation = 2037 - Number(classroom.slice(0, -2));
    if(classroom.startsWith("Haz")) graduation = 2029;

    PH.adminActions.createUser(nickname, password, name, no, graduation, false).catch(err => {});
});

function nameCase(s) {
    return s.split(" ").map(t => t[0].toUpperCase() + t.slice(1).toLowerCase()).join(" ");
}