const fs = require('fs');
const chalk = require('chalk')
const path = require('path');

const Func = require('../Lib/function.js')

function getFolderValue() {
    const items = fs.readdirSync(path.join(__dirname,'/Command/'))
    const listMenu = []
    const listCommand = []
    
    items.forEach(folder => {
      const fullPath = path.join(__dirname, `/Command/${folder}/`)
      const stats = fs.statSync(fullPath)
            listMenu.push(folder)
      
      if (stats) {
        const files = fs.readdirSync(fullPath)
        files.forEach(file => {
          const filePath = `${fullPath}/${file}`
          const result = fs.statSync(filePath)
          if (!result.isDirectory()) {
            listCommand.push(file.replace('.js', ''))
          }
        })
      }
    })
    return {listCommand, listMenu}
  }
  
function getCommandDirectory(sock, m, config) {
    const { listCommand: files, listMenu: folders } =  getFolderValue()
    let j = 0;
    let i = 0;
    let directory = []
    let commands = []
    for (let i2 = 0; i2 <= 1 + files.length; i2++) {
      if (fs.existsSync(path.join(__dirname, `/Command/${folders[j]}/${files[i]}.js`))) {
        directory.push({
          url: path.join(__dirname, `/Command/${folders[j]}/${files[i]}.js`),
          onFolder: folders[j],
          file: files[i],
        })
        i++
      } else {
        j++
      }
    }
    try {
      for (let url of directory) {
        let Exec = require(url.url)
        Exec = new Exec(sock, m, global.db, config)
        commands = commands.concat(Exec.command)
      }
    } catch {}
    return { directory, commands }
  }
  
  function accessMessage(perm, config, cmd) {
    if (perm === 1) {
      return Func.combineMessage(config.msg['owner'],cmd)
    } else if (perm === 2) {
      return Func.combineMessage(config.msg['admin'],cmd)
    } else if (perm === 3) {
      return Func.combineMessage(config.msg['botAdmin'],cmd)
    } else {
      let data = config.options.status
      let msg = config.msg
      return Func.combineMessage(config.msg[data[perm]],cmd)
    }
  }
// Sample function to handle incoming messages
module.exports = async function handler(sock, m, config) {
  if (!m) return
  console.log(m)
  if (config.options.mode !== 'public' && !m.isOwner) return
  if (m.from && global.db.groups[m.sender]?.mute && !m.isOwner)
  if (m.isBaileys) return
  (await require('../Lib/loadDatabase.js'))(m, config)
  const bad = await (require('../Lib/filter.js'))(sock, m, config)
  if (bad) return
  
  const isCommand = m.body.startsWith(m.prefix)
  const command = isCommand ? m.command.toLowerCase() : ""
  const isGroup = m.from.endsWith('@g.us')
  const { directory, commands } = getCommandDirectory(sock, m, config)
  
  if (m.message && !m.isBaileys) {
    console.log(chalk.white(`╭─────────────────────────────────╮\n│          New Message            │\n├─────────────────────────────────┤\n│ ${chalk.yellow("📩 From:")} ${m.pushName} ${m.sender}\n│ ${chalk.yellow("📍 In:")} ${m.isGroup ? m.metadata.subject : "Private Chat"}  ${m.from}\n├─────────────────────────────────┤\n│ 📜 Message [${chalk.yellow(m.type)|| Text}]:\n│${m.body.match(/.{1,30}/g).map(line => chalk.green(line.padEnd(30))).join('\n│') || ''}\n╰─────────────────────────────────╯`));
  }
  
  if(isCommand) {
    let current = 0
        for (const dir of directory) {
            const Run = require(dir.url)
            const Exec = new Run(sock, m, global.db, config)
            if (Exec.commands.includes(command)) {
              current = 0
              if (Func.modeFor(Exec.setup.mode, m, config)) {
                if (Func.permissionLevel(Exec.setup.permission, m, global.db.users, config)) {
                  if (Func.limitCheck(Exec?.limit, global.db.users[m.sender].limit) === 2) {
                    try {
                      return await Exec.execute()
                    } catch (e) {
                      return m.sendStatus(`*Error execute command* "_${command}_"\n\n*Message Error:*\n${e.message}\n${e.stack}`, 'failed')
                    }
                  } else {
                    let msg = Func.limitCheck(Exec?.limit, global.db.users[m.sender].limit) === 0 ? "limitReset" : "limit"
                    sendStatus(config.msg[msg], 'denied')
                  }
                } else {
                  return m.sendStatus(accessMessage(Exec.setup.permission, config, command), 'denied');
                }
              } else {
                let p = m.isGroup ? 'Private Chat' : 'Group Chat'
                return m.sendStatus(Func.combineMessage(config.msg[4], ), 'denied')
              }
           } else if (current === commands.length - 1) {
               return m.sendStatus(`The '${command}' command is not available! ${Func.similarityCmd(commands, command, m)}`, 'failed')
          } else {
            current++
          }
      }
  }
}