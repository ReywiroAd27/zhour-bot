const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore, getContentType, delay, fetchLatestBaileysVersion, PHONENUMBER_MCC, jidNormalizedUser } = require('@whiskeysockets/baileys')
const chalk = require('chalk')
const Pino = require('pino')
const readline = require('readline')
const { Boom } = require('@hapi/boom')
const { parsePhoneNumber } = require('libphonenumber-js')
const fs = require('fs')
const path = require('path')
const NodeCache = require('node-cache')
const moment = require('moment-timezone')
const cfonts = require("cfonts")
const ld = require("lodash")

//other module
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
  colors: ld.shuffle(["red", "cyan", "yellow", "green"]),
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
const pairingCode = process.argv.includes('--pairing')
const qrCode = process.argv.includes('--qr')

const store = makeInMemoryStore({})
store.readFromFile('./Database/store.json')
setInterval(() => {
    store.writeToFile('./Database/store.json')
}, 10000)

async function start() {
  process.on('unhandledRejection', (err) => console.error(chalk.bgRed(chalk.gray(err))));
  
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

   let select
   if (!fs.existsSync('./AuthState/creds.json') && !qrCode && !pairingCode) {
     select = question('Welcome To "Axelion".\n To continue, you must select this options for login to whatsapp:\n1. Login with QR-Code\n2. Login with Phone-number\n#')
   }

   const { state, saveCreds } = await useMultiFileAuthState("./AuthState")
    const { version, isLatest } = await fetchLatestBaileysVersion()
    const nodeCache = new NodeCache()

    const connectionUpdate = {
        version,
        keepAliveInternalMs: 30000,
        printQRInTerminal: select === "1"|| qrCode,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: nodeCache,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: undefined,
        logger: Pino({ level: "silent" }),
        auth: state,
        browser: ["Google Chrome (Linux)", "", ""]
    }

    const axel = makeWASocket(connectionUpdate)
    store.bind(axel.ev)
    
    axel.ev.on("contacts.update", (update) => {
      for (let contact of update) {
         let id = jidNormalizedUser(contact.id)
         if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
      }
   })
   
   await Client({ axel, store })
   
   axel.ev.on("connection.update", ({ connection }) => {
      if (connection === "open") {
        console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.gray('[') + chalk.white(' Status ') + chalk.gray('] ') + "Connect To (" + chalk.keyword("orange")(axel.user?.["id"]["split"](":")[0]) + ")")
      }
      if (connection === "close") {
        console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.gray('[') + chalk.white(' Status ') + chalk.gray('] ') + "Connection close")
        start()
      }
      if (connection === "connecting") {
        if (axel.user) {
          console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.gray('[') + chalk.white(' Status ') + chalk.gray('] ') + "Reconnect To (" + chalk.keyword("orange")(axel.user?.["id"]["split"](":")[0]) + ")")
        }
      }
    })
   if (select === "2" || pairingCode) {
     if(!axel.authState.creds.registered) {
    		const phoneNumber = await question(chalk.green(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + "Input your Number, Example ") + '('  + chalk.gray('62xxxx') + ') ' + chalk.keyword("orange")(': '));
    		const code = await axel.requestPairingCode(phoneNumber.trim())
        rl.close()
        setTimeout(async () => {
             let code = await axel.requestPairingCode(phoneNumber)
             code = code?.match(/.{1,4}/g)?.join("-") || code
             console.log(chalk.black(chalk.bgGreen(`axel Pairing Code : `)), chalk.black(chalk.white(code)))
          }, 2000)
    	} 
   }
	
	axel.ev.on("connection.update", async (update) => {
      const { lastDisconnect, connection, qr } = update
      if (connection) {
         console.info(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.gray('[') + chalk.white(' Status ') + chalk.gray('] ') + connection)
      }
      if (connection === "close") {
         let reason = new Boom(lastDisconnect?.error)?.output.statusCode
         if (reason === DisconnectReason.badSession) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + `Bad Session File, Please Delete Session and Scan Again`)
            process.send('reset')
         } else if (reason === DisconnectReason.connectionClosed) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Connection closed, reconnecting....")
            await start()
         } else if (reason === DisconnectReason.connectionLost) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Connection Lost from Server, reconnecting...")
            await start()
         } else if (reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Connection Replaced, Another New Session Opened, Please Close Current Session First")
            process.exit(1)
         } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + `Device Logged Out, Please Scan Again And Run.`)
            process.exit(1)
         } else if (reason === DisconnectReason.restartRequired) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Restart Required, Restarting...")
            await start()
         } else if (reason === DisconnectReason.timedOut) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Connection TimedOut, Reconnecting...")
            process.send('reset')
         } else if (reason === DisconnectReason.multideviceMismatch) {
            console.log(chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ') + chalk.redBright('[') + chalk.bold.red(' Failed ') + chalk.redBright('] ') + "Multi device mismatch, please scan again")
            process.exit(0)
         } else {
            console.log(reason)
            process.send('reset')
         }
      }

      if (connection === "open") {
         axel.sendMessage(config.options.owner[0] + "@s.whatsapp.net", {
            text: `${axel?.user?.name || "Axelion"} has Connected...`,
         })
      }
   })
   
   axel.ev.on("creds.update", saveCreds)
   
   axel.ev.on("messages.upsert", async ( message ) => {
     if (!message.messages) return
     const m = await Serialize(axel, message.messages[0], config)
     await (require('./Events/handle.js'))(axel, m, config)
   })
   
   //Group Participants Update
   axel.ev.on("group-participants.update", async (message) => {
      await (require('./Events/GPU.js'))(axel, message)
   })

   // group update
   axel.ev.on("groups.update", async (update) => {
      await (require('./Events/GU.js'))(axel, update)
   })

   // auto reject call when user call
   axel.ev.on("call", async (json) => {
      if (config.options.antiCall) {
         for (const id of json) {
            if (id.status === "offer") {
              if (!m.isGroup) {
                 let msg = await axel.sendMessage(id.from, {
                    text: `Maaf Saya Merupakan Sebuah bot. Jadi Saya tidak bisa menerima panggilan dari anda. Jika anda ingin bertanya atau request fitur, kamu bisa hubungi Owner saya`,
                    mentions: [id.from],
                })
                axel.sendContact(id.from, config.options.owner, msg)
                await axel.rejectCall(id.id, id.from)
              }
          }
        }
      }
   })

    /*setInterval(async () => {
      await (require('./Automate/index.js'))
    }, 1000)*/
   // rewrite database every 30 seconds
   setInterval(async () => {
      if (global.db.users) await userDB.write(global.db.users)
      if (global.db.users) await groupDB.write(global.db.groups)
   }, 30000)
}

start();