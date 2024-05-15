const { readdirSync: readdir, statSync: stat } = require("fs");
const path = require("path");

async function require_all(d, option) {
   /*let direct = __filename.split("/")
    direct.pop()
    direct = direct.join("/")
    direct = direct.replace(/^.\//, direct + "/")
    console.log(direct);
    const result = {}
    let dirs = readdir(direct)
    const toAll = option === "all" || option?.toAll === true
    for (let dir of dirs) {
        const full = direct + "/" + dir
        const stats = stat(full)
        if (stats.isDirectory() && toAll) {
            result[dir] = await require_all(full)
        } else if (!stats.isDirectory()) {
            result[dir] = require(fuĺl)
        }
        console.log(full, true);
    }
    return result*/
// Misalkan file ekspor nilai disimpan di dalam direktori "utils" dengan nama file "helper.js"
const filePath = __filename; // Mengambil jalur file saat ini
const directoryPath = path.dirname(filePath); // Mendapatkan direktori file

console.log(directoryPath);
}

module.exports = { require_all }