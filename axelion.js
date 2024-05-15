/**
 *
 * Thanks for using Axelion-MD
 *
 * Please take a moment to review our
 * documentation before using/developing this
 * bot!!
 *
 * Creator Name: Aditya MM
 * Follow Creator On:
 *   Github: https://github.com/ReywiroAd27
 *
 * You can contact me on whatsapp
 * ( wa.me/6281455086449 )
 *
 *
 * If you want to buy the latest unencrypted
 * script, please contact me via WhatsApp.
 **/

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    getContentType,
    delay,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const chalk = require("chalk");
const Pino = require("pino");
const readline = require("readline");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const NodeCache = require("node-cache");
const moment = require("moment-timezone");
const cfonts = require("cfonts");
const _ = require("lodash");

//special global variable
global.onMsgProcess = false;

// Activate the bot Library
require("module-alias/register");

//My Library
const Func = require("@func/index");
const Client = require("@utils/client");
const Serialize = require("@utils/serialize");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const usePairingCode = process.argv.includes("--pairing");
const useMobile = process.argv.includes("--mobile");

const Database = require("@db/index");
const userDB = new Database({
    type: "db/json",
    path: "./assets/database/user.json"
});
const groupDB = new Database({
    type: "db/json",
    path: "./assets/database/group.json"
});
const roomDB = new Database({
    type: "db/json",
    path: "./assets/database/room.json"
});
const gameDB = new Database({
    type: "db/json",
    path: "./assets/database/game.json"
});
global.config = new Database({
    type: "db/json",
    path: "./assets/database/config.json"
}).read();

const question = text => new Promise(resolve => rl.question(text, resolve));

const banner = cfonts.render("Axelion-MD", {
    font: "tiny",
    align: "center",
    colors: _.shuffle(["candy", "blue", "white", "green"]),
    background: "transparent",
    letterSpacing: 2,
    lineHeight: 1,
    space: true,
    maxLength: "0",
    gradient: true,
    independentGradient: false,
    transitionGradient: true,
    env: "node"
});

console.log(banner.string);

// logger
const logger = Pino().child({
    level: "silent",
    stream: "store"
});
const store = makeInMemoryStore({});

async function startSocket() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("sesion");
        const { version } = await fetchLatestBaileysVersion();

        //Database initialize
        const content = {
            users: await userDB.read(),
            groups: await groupDB.read(),
            games: await gameDB.read(),
            rooms: await roomDB.read()
        };
        if (
            (content.user && Object.keys(content.users).length === 0) ||
            (content.groups && Object.keys(content.groups) === 0)
        ) {
            global.db = {
                users: content.users || {},
                groups: content.groups || {},
                games: content.games || {},
                rooms: content.rooms || {}
            };
            await userDB.write(db.users);
            await groupDB.write(db.groups);
            await gameDB.write(db.games);
            await rooms.write(db.rooms);
        } else {
            db = content;
        }

        //Bot initialize
        const sock = makeWASocket({
            version,
            printQRInTerminal: !usePairingCode,
            generateHighQualityLinkPreview: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(
                    state.keys,
                    Pino({ level: "silent" })
                )
            },
            logger: Pino({ level: "silent" }),
            browser: ["windows", "chrome", version.join(".")]
        });

        // store
        store.readFromFile("./store.json");
        setInterval(async () => {
            await store.writeToFile("./store.json");
        }, 10000);
        store.bind(sock.ev);

        await Client({ sock, store });

        if (usePairingCode && !sock.authState.creds.registered) {
            if (useMobile)
                throw new ReferenceError(
                    "Cannot use pairing code with mobile api"
                );

            const phoneNumber = await question(
                "Please enter your whatsapp number: "
            );
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`Your pairing code: ${code}`);
        }

        if (useMobile && !sock.authState.creds.registered) {
            const { registration } = sock.authState.creds || {
                registration: {}
            };

            if (!registration.phoneNumber) {
                registration.phoneNumber = await question(
                    "Please enter your mobile phone number:\n"
                );
            }

            const libPhonenumber = await require("libphonenumber-js");
            const phoneNumber = libPhonenumber.parsePhoneNumber(
                registration.phoneNumber
            );
            if (!phoneNumber?.isValid())
                throw new ReferenceError(
                    "Invalid phone number: " + registration.phoneNumber
                );

            registration.phoneNumber = phoneNumber.format("E.164");
            registration.phoneNumberCountryCode =
                phoneNumber.countryCallingCode;
            registration.phoneNumberNationalNumber = phoneNumber.nationalNumber;
            const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode];
            if (!mcc) {
                throw new Error(
                    "Could not find MCC for phone number: " +
                        registration.phoneNumber +
                        "\nPlease specify the MCC manually."
                );
            }

            registration.phoneNumberMobileCountryCode = mcc;

            async function enterCode() {
                try {
                    const code = await question(
                        "Please enter the one time code:\n"
                    );
                    const response = await sock.register(
                        code.replace(/["']/g, "").trim().toLowerCase()
                    );
                    console.log("Successfully registered your phone number.");
                    console.log(response);
                    rl.close();
                } catch (error) {
                    console.error(
                        "Failed to register your phone number. Please try again.\n",
                        error
                    );
                    await askForOTP();
                }
            }

            async function enterCaptcha() {
                const response = await sock.requestRegistrationCode({
                    ...registration,
                    method: "captcha"
                });
                const path = __dirname + "/captcha.png";
                fs.writeFileSync(
                    path,
                    Buffer.from(response.image_blob, "base64")
                );

                open(path);
                const code = await question("Please enter the captcha code:\n");
                fs.unlinkSync(path);
                registration.captcha = code
                    .replace(/["']/g, "")
                    .trim()
                    .toLowerCase();
            }

            async function askForOTP() {
                if (!registration.method) {
                    let code = await question(
                        'How would you like to receive the one time code for registration? "sms" or "voice"\n'
                    );
                    code = code.replace(/["']/g, "").trim().toLowerCase();
                    if (code !== "sms" && code !== "voice")
                        return await askForOTP();

                    registration.method = code;
                }

                try {
                    await sock.requestRegistrationCode(registration);
                    await enterCode();
                } catch (error) {
                    console.error(
                        "Failed to request registration code. Please try again.\n",
                        error
                    );
                    if (error?.reason === "code_checkpoint")
                        await enterCaptcha();
                    await askForOTP();
                }
            }
            askForOTP();
        }

        //connection
        sock.ev.on("connection.update", async function (conn) {
            const { connection, lastDisconnect, qr } = conn;
            global.stopped = connection;
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (qr && !usePairingCode) {
                console.log(
                    chalk.yellow(
                        "Scan this QR code to run the bot, expired on 60 seconds"
                    )
                );
            }
            if (connection) {
                if (connection === "connecting")
                    console.log("Connecting to WhatsApp");
                if (connection === "open") console.log("Connection is open");
                if (connection === "close") {
                    if (reason === DisconnectReason.loggedOut) {
                        console.error(
                            "Connection closed and you're logged out"
                        );
                        process.send("reset");
                    } else {
                        console.log(reason);
                        startSocket();
                    }
                }
            }
        });
        sock.ev.on("creds.update", async function () {
            await saveCreds();
        });
        sock.ev.on("call", async function (s) {
            const cp = s;
            console.log(cp);
        });
        sock.ev.on("messages.upsert", async function ({messages}) {
            //
            console.log(messages);
            const msg = messages;
            const m = await Serialize(sock, msg[0]);
            if (!m) return
            if (config.options.mode !== "public" && !m.isOwner) return;
            if (m.from && db.groups[m.from].mute && !m.isOwner) return;
            if (m.sender && db.users[m.sender].banned) return;
            console.log();
            if (!m.isBaileys) {
                (await require("@db/load"))(m, config);
                const bad = await require("@filters/words")(sock, m, config);
                if (bad) return;
            }
            await require("@events/handler")(sock, m);
            await require("@events/handle")(sock, m);
            return /*(global.onMsgProcess = false)*/;
        });

        if (sock.user && sock.user?.id) {
            sock.user.jid = jidNormalizedUser(sock.user?.id);
        }

        setInterval(async () => {
            if (global.db.users) await userDB.write(global.db.users);
            if (global.db.groups) await groupDB.write(global.db.groups);
            if (global.db.rooms) await roomDB.write(global.db.rooms);
            if (global.db.games) await gameDB.write(global.db.games);
        }, 5000);

        return sock;
    } catch (er) {
        console.error(er);
    }
}

startSocket();
