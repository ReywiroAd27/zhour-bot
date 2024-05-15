const axios = require("axios");
const fs = require("fs");
const FileType = require("file-type");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");
const { platform } = require("os");
const moment = require("moment-timezone");
const cheerio = require("cheerio");
const { format } = require("util");
const FormData = require("form-data");
const mimes = require("mime-types");
const Jimp = require("jimp");
const similarity = require("similarity");
const { createHash } = require("crypto");
const baileys = require("@whiskeysockets/baileys");
String.prototype.divide = function (v) {
    if (v instanceof RegExp) {
        const result = this.split(v);
        if (result.length === 0 || (result.length === 1 && result[0] === ""))
            return;
        return result;
    }
    const r = [];
    let sr = "",
        s = 0;
    if (this === "" && v === "") return;
    for (let i = 0; i < this.length; i++) {
        if (v === "") r.push(this[i]);
        if (typeof v === "string" && this[i] === v) {
            r.push(sr);
            sr = "";
            s = i + 1;
            //} else if (v instanceof RegExp && v.test(this)) {
        } else {
            sr += this[i];
        }
        if (i === this.length - 1 && v !== "") r.push(sr);
    }
    if (r.length) return r;
    return;
};

Object.prototype.toArray = function() {
  const r = []
  for (const item in this) {
    if (item === "toArray") break
    r.push([item, this[item]])
  }
  return r
}

module.exports = new (class Function {
    constructor() {
        this.axios = axios;
        this.cheerio = cheerio;
        this.fs = fs;
        this.path = path;
        this.baileys = baileys;
        this.FormData = FormData;
    }

    similarityCmd(commands, cmd, prefix) {
        let empty = true;
        const cmds = commands.map(command => command.name);
        let text = "\n\n> *However, here are some equivalent options:*\n\n";
        cmds.forEach((command, i) => {
            const simil = similarity(command, cmd);
            if (simil >= 0.35) {
                if (empty) {
                    empty = false;
                }
                text += `> *${i + 1}. ${prefix}${command} ➭ ${(
                    simil * 100
                ).toFixed(2)}%*\n`;
            }
        });
        if (empty) return "";
        return text;
    }

    hash(et, di, ot = "hex") {
        return createHash(et).update(di).digest(ot);
    }

    getTime(l, td) {
        const datas = this.fs.readFileSync(
            path.join(__dirname, "/assets/database/time.json")
        );
        const spl = l.divide("|");
        const time = moment().tz("Asia/Jakarta").format("HH:mm:SS");
        if (!spl) {
            if (!l.divide("=")) {
                const data = datas[l].toArray();
                if (l === "sholat") {
                    const r = [];
                    for (let i = 0; i < data.length; i++) {
                      data[i]
                    }
                }
            } else {
            }
        }
    }

    timeDifference(i1, i2) {
        const data = i1.split(":").map(Number);
        const data2 = i2.split(":").map(Number);

        let jam =
            data2[0] < data[0] ? data2[0] + 24 - data[0] : data2[0] - data[0];
        let menit = Math.abs(data2[1] - data[1]);
        let detik = Math.abs(data2[2] - data[2]);

        jam = jam < 10 ? "0" + jam : jam;
        menit = menit < 10 ? "0" + menit : menit;
        detik = detik < 10 ? "0" + detik : detik;

        return `${jam}:${menit}:${detik}`;
    }

    TAOC(t, ms) {
        if (ms === undefined) {
            clearInterval(global.ta);
            console.log(t, "test");
        } else {
            clearInterval(global.ta);
            let d = "";
            let i = 0;
            global.ta = setInterval(function () {
                if (i === 0) {
                    d = "";
                } else {
                    d += ".";
                }
                process.stdout.write("\r" + t + d);
                i = (i + 1) % 4;
                console.log(i);
            }, 1000);
            if (!(ms === 0 || ms === false)) {
                setTimeout(() => {
                    clearInterval(global.ta);
                }, ms);
            }
        }
    }

    ucapanWaktu() {
        const waktu = moment().tz("Asia/Jakarta");
        const jam = waktu.format("HH:mm:ss");
        let text;
        if (jam > "22:30:00" || jam < "01:00:00") {
            text = "Selamat Tengah Malam🎑";
            return text;
        } else if (jam <= "04:00:00") {
            text = "Selamat Dini Hari🌠";
            return text;
        } else if (jam < "06:00:00") {
            text = "Selamat Subuh🌌";
            return text;
        } else if (jam <= "08:00:00") {
            text = "Selamat Pagi🌇";
            return text;
        } else if (jam <= "15:30:00") {
            text = "Selamat Siang🏙️️";
            return text;
        } else if (jam <= "18:00:00") {
            text = "Selamat Sore🌆";
            return text;
        } else if (jam <= "22:30:00") {
            text = "Selamat Malam🌃";
            return text;
        }
    }

    //Hisoka-baileys functions
    // source code https://github.com/BochilGaming/games-wabot/blob/e4151d33cded4cfa6f1ceabc8558e1678f2a0f53/lib/helper.js#L14
    __filename(
        pathURL = fileURLToPath(pathToFileURL("file://" + __filename)),
        rmPrefix = platform() !== "win32"
    ) {
        const filePath = pathURL;
        return rmPrefix
            ? filePath.replace(/^\/[a-z]:/i, "") // Remove leading slash on Windows
            : filePath;
    }

    __dirname(pathURL = fileURLToPath(pathToFileURL("file://" + __filename))) {
        return path.dirname(this.__filename(pathURL, true));
    }

    async dirSize(directory) {
        const files = await fs.readdirSync(directory);
        const stats = files.map(file =>
            fs.statSync(path.join(directory, file))
        );

        return (await Promise.all(stats)).reduce(
            (accumulator, { size }) => accumulator + size,
            0
        );
    }

    sleep(ms) {
        return new Promise(a => setTimeout(a, ms));
    }

    format(str) {
        return format(str);
    }

    Format(str) {
        return JSON.stringify(str, null, 2);
    }

    jam(numer, options = {}) {
        let format = options.format ? options.format : "HH:mm";
        let jam = options?.timeZone
            ? moment(numer).tz(options.timeZone).format(format)
            : moment(numer).format(format);

        return `${jam}`;
    }

    tanggal(numer, timeZone = "") {
        const myMonths = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember"
        ];
        const myDays = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jum’at",
            "Sabtu"
        ];
        var tgl = new Date(numer);
        timeZone ? tgl.toLocaleString("en", { timeZone }) : "";
        var day = tgl.getDate();
        var bulan = tgl.getMonth();
        var thisDay = tgl.getDay(),
            thisDay = myDays[thisDay];
        var yy = tgl.getYear();
        var year = yy < 1000 ? yy + 1900 : yy;
        let gmt = new Date(0).getTime() - new Date("1 January 1970").getTime();
        let weton = ["Pahing", "Pon", "Wage", "Kliwon", "Legi"][
            Math.floor((tgl * 1 + gmt) / 84600000) % 5
        ];

        return `${thisDay}, ${day} ${myMonths[bulan]} ${year}`;
    }

    async getFile(PATH, save) {
        try {
            let filename = null;
            let data = await this.fetchBuffer(PATH);

            if (data?.data && save) {
                filename = path.join(
                    process.cwd(),
                    "temp",
                    Date.now() + "." + data.ext
                );
                fs.promises.writeFile(filename, data?.data);
            }
            return {
                filename: data?.name ? data.name : filename,
                ...data
            };
        } catch (e) {
            throw e;
        }
    }

    async fetchJson(url, options = {}) {
        try {
            let data = await axios.get(url, {
                headers: {
                    ...(!!options.headers ? options.headers : {})
                },
                responseType: "json",
                ...options
            });

            return await data?.data;
        } catch (e) {
            throw e;
        }
    }

    async fetchText(url, options = {}) {
        try {
            let data = await axios.get(url, {
                headers: {
                    ...(!!options.headers ? options.headers : {})
                },
                responseType: "text",
                ...options
            });

            return await data?.data;
        } catch (e) {
            throw e;
        }
    }

    fetchBuffer(string, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (/^https?:\/\//i.test(string)) {
                    let data = await axios.get(string, {
                        headers: {
                            ...(!!options.headers ? options.headers : {})
                        },
                        responseType: "arraybuffer",
                        ...options
                    });
                    let buffer = await data?.data;
                    let name = /filename/i.test(
                        data.headers?.get("content-disposition")
                    )
                        ? data.headers
                              ?.get("content-disposition")
                              ?.match(/filename=(.*)/)?.[1]
                              ?.replace(/["';]/g, "")
                        : "";
                    let mime =
                        mimes.lookup(name) ||
                        data.headers.get("content-type") ||
                        (await FileType.fromBuffer(buffer))?.mime;
                    resolve({
                        data: buffer,
                        size: Buffer.byteLength(buffer),
                        sizeH: this.formatSize(Buffer.byteLength(buffer)),
                        name,
                        mime,
                        ext: mimes.extension(mime)
                    });
                } else if (/^data:.*?\/.*?;base64,/i.test(string)) {
                    let data = Buffer.from(string.split`,`[1], "base64");
                    let size = Buffer.byteLength(data);
                    resolve({
                        data,
                        size,
                        sizeH: this.formatSize(size),
                        ...((await FileType.fromBuffer(data)) || {
                            mime: "application/octet-stream",
                            ext: ".bin"
                        })
                    });
                } else if (
                    fs.existsSync(string) &&
                    fs.statSync(string).isFile()
                ) {
                    let data = fs.readFileSync(string);
                    let size = Buffer.byteLength(data);
                    resolve({
                        data,
                        size,
                        sizeH: this.formatSize(size),
                        ...((await FileType.fromBuffer(data)) || {
                            mime: "application/octet-stream",
                            ext: ".bin"
                        })
                    });
                } else if (Buffer.isBuffer(string)) {
                    let size = Buffer?.byteLength(string) || 0;
                    resolve({
                        data: string,
                        size,
                        sizeH: this.formatSize(size),
                        ...((await FileType.fromBuffer(string)) || {
                            mime: "application/octet-stream",
                            ext: ".bin"
                        })
                    });
                } else if (/^[a-zA-Z0-9+/]={0,2}$/i.test(string)) {
                    let data = Buffer.from(string, "base64");
                    let size = Buffer.byteLength(data);
                    resolve({
                        data,
                        size,
                        sizeH: this.formatSize(size),
                        ...((await FileType.fromBuffer(data)) || {
                            mime: "application/octet-stream",
                            ext: ".bin"
                        })
                    });
                } else {
                    let buffer = Buffer.alloc(20);
                    let size = Buffer.byteLength(buffer);
                    resolve({
                        data: buffer,
                        size,
                        sizeH: this.formatSize(size),
                        ...((await FileType.fromBuffer(buffer)) || {
                            mime: "application/octet-stream",
                            ext: ".bin"
                        })
                    });
                }
            } catch (e) {
                reject(new Error(e?.message || e));
            }
        });
    }

    mime(name) {
        let mimetype = mimes.lookup(name);
        if (!mimetype) return mimes.extension(name);
        return { mime: mimetype, ext: mimes.extension(mimetype) };
    }

    isUrl(url) {
        let regex = new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            "gi"
        );
        if (!regex.test(url)) return false;
        return url.match(regex);
    }

    escapeRegExp(string) {
        return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, "\\$&");
    }

    toProperCase(query) {
        const arr = query.split(" ");
        for (var i = 0; i < arr.length; i++) {
            arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
        }

        return arr.join(" ");
        //return query.replace(/^\w/, c => c.toUpperCase())
    }

    getRandom(ext = "", length = "10") {
        var result = "";
        var character =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        var characterLength = character.length;
        for (var i = 0; i < length; i++) {
            result += character.charAt(
                Math.floor(Math.random() * characterLength)
            );
        }

        return `${result}${ext ? `.${ext}` : ""}`;
    }

    formatSize(bytes, si = true, dp = 2) {
        const thresh = si ? 1000 : 1024;

        if (Math.abs(bytes) < thresh) {
            return `${bytes} B`;
        }

        const units = si
            ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
            : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
        let u = -1;
        const r = 10 ** dp;

        do {
            bytes /= thresh;
            ++u;
        } while (
            Math.round(Math.abs(bytes) * r) / r >= thresh &&
            u < units.length - 1
        );

        return `${bytes.toFixed(dp)} ${units[u]}`;
    }

    async resizeImage(buffer, height) {
        buffer = (await this.getFile(buffer)).data;

        return new Promise((resolve, reject) => {
            Jimp.read(buffer, (err, image) => {
                if (err) {
                    reject(err);
                    return;
                }

                image
                    .resize(Jimp.AUTO, height)
                    .getBuffer(Jimp.MIME_PNG, (err, resizedBuffer) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(resizedBuffer);
                    });
            });
        });
    }

    runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor((seconds % (3600 * 24)) / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
        var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
        return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    async correct(mainString, targetStrings) {
        function compareTwoStrings(first, second) {
            first = first.replace(/\s+/g, "");
            second = second.replace(/\s+/g, "");

            if (first === second) return 1; // identical or empty
            if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

            let firstBigrams = new Map();
            for (let i = 0; i < first.length - 1; i++) {
                const bigram = first.substring(i, i + 2);
                const count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram) + 1
                    : 1;

                firstBigrams.set(bigram, count);
            }

            let intersectionSize = 0;
            for (let i = 0; i < second.length - 1; i++) {
                const bigram = second.substring(i, i + 2);
                const count = firstBigrams.has(bigram)
                    ? firstBigrams.get(bigram)
                    : 0;

                if (count > 0) {
                    firstBigrams.set(bigram, count - 1);
                    intersectionSize++;
                }
            }

            return (
                (2.0 * intersectionSize) / (first.length + second.length - 2)
            );
        }

        targetStrings = Array.isArray(targetStrings) ? targetStrings : [];

        const ratings = [];
        let bestMatchIndex = 0;

        for (let i = 0; i < targetStrings.length; i++) {
            const currentTargetString = targetStrings[i];
            const currentRating = compareTwoStrings(
                mainString,
                currentTargetString
            );
            ratings.push({
                target: currentTargetString,
                rating: currentRating
            });
            if (currentRating > ratings[bestMatchIndex].rating) {
                bestMatchIndex = i;
            }
        }

        const bestMatch = ratings[bestMatchIndex];

        return {
            all: ratings,
            indexAll: bestMatchIndex,
            result: bestMatch.target,
            rating: bestMatch.rating
        };
    }
})();
