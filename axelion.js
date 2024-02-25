const { default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason,
  makeInMemoryStore,
  getContentType, 
  delay, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore, 
  jidNormalizedUser 
} = require('@whiskeysockets/baileys')
const chalk = require('chalk')
const Pino = require('pino')
const readline = require('readline')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const NodeCache = require('node-cache')
const moment = require('moment-timezone')
const cfonts = require("cfonts")
const _ = require("lodash")

//My Lib module
const Func = require('./Lib/function.js')
const Client = require('./Lib/client.js')
const Serialize = require('./Lib/serialize.js')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const Database = require('./Lib/database.js')
const userDB = new Database({ type: 'db/json', path: './Database/user.json'})
const groupDB = new Database({ type: 'db/json', path: './Database/group.json'})
const config = new Database({ type:'db/json', path: "./Database/config.json"}).read()

const question = text => new Promise((resolve) => rl.question(text, resolve))

const banner = cfonts.render("Axelion-MD", {
  font: "tiny",
  align: "center",
  colors: _.shuffle(["candy", "blue", "white", "cyan", "yellow", "green"]),
  background: "transparent",
  letterSpacing: 2,
  lineHeight: 2,
  space: true,
  maxLength: "0",
  gradient: false,
  independentGradient: false,
  transitionGradient: false,
  env: "node",
});

console.log(banner.string);

// logger
const logger = Pino().child({
    level: "silent",
    stream: "store"
});
const store = makeInMemoryStore({
    logger
});

async function startSocket() {
    //process.on('unhandledRejection', (err) => console.error(chalk.bgWhite(chalk.red(err))));
    try {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState("AuthState");
        const {
            version
        } = await fetchLatestBaileysVersion();
        
        //Database initialize
        const content = {
          users: await userDB.read(),
          groups: await groupDB.read()
        }
         if (content.user && Object.keys(content.users).length === 0 || content.groups && Object.keys(content.groups) === 0) {
            global.db = {
              users: {
                ...(content.users || {})
              },
              groups: {
                ...(content.groups || {})
              }
            };
            await userDB.write(global.db.users);
            await groupDB.write(global.db.groups);
         } else {
            global.db = content
         }
         
        //Bot initialize
        const sock = makeWASocket({
            version,
            printQRInTerminal: true,
            generateHighQualityLinkPreview: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, Pino({
                    level: "silent"
                })),
            },
            logger: Pino({
                level: "silent"
            }),
            browser: ["Windows", "Chrome", "10.0.1"]
        });
        
        // store
        store.bind(sock.ev);
        setInterval(async () => {
            await store.writeToFile("./store.json");
        }, 10000);
        
        await Client({sock, store, config})

        sock.ev.process(async (events) => {
            
            // connection 
            if (events["connection.update"]) {
                const update = events["connection.update"];
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = update;
                global.stopped = connection;
                const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                if (qr) {
                    console.log(chalk.yellow("Scan this QR code to run the bot, max 60 seconds"));
                }
                else if (connection == "close") {
                    if (reason !== DisconnectReason.loggedOut) {
                        startSocket();
                    }
                    else {
                        console.log(chalk.yellow("Connection closed. You are logged out"));
                        process.send("reset");
                    }
                }
                if (connection === "connecting") {
                    console.log(chalk.green("Connecting..."));
                }
                else if (connection == "open") {
                    console.log(chalk.green("Connected"));
                }
            }
            if (events["creds.update"]) {
                await saveCreds();
            }
            
            // reject call
            if (events["call"]) {
                const m = events["call"][0];
                if (m.status == "offer") {
                    sock.rejectCall(m.id, m.from);
                }
            }
            
            // message
            if (events["messages.upsert"]) {
                let message = events["messages.upsert"];
                if (message.type == "notify") {
                    if (!message) return;
                    console.log(message.messages[0]);
                    const m = await Serialize(sock, message.messages[0], config)
                    await (require("./Events/handle.js"))(sock, m, config)
                }
            }
        });

        if (sock.user && sock.user?.id) {
            sock.user.jid = jidNormalizedUser(sock.user?.id);
        }

        return sock;
    }
    catch (er) {
        console.error(er);
    }
    setInterval(async () => {
      if (global.db.users) await userDB.write(global.db.users)
      if (global.db.users) await groupDB.write(global.db.groups)
   }, 30000)
}

startSocket();
