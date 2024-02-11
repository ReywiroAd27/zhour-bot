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
  
  function accessMessage(perm, config, cmd) {
    if (perm === 1) {
      return Func.combineMessage(config.msg[perm],cmd)
    } else if (perm === 2) {
      return Func.combineMessage(config.msg[perm],cmd)
    } else if (perm === 3) {
      return Func.combineMessage(config.msg[perm],cmd)
    } else {
      let data = config.options.status
      let msg = config.msg
      for (let Status of data) {
        for (let m of msg) {
          if (m.includes(Status)) {
            return Func.combineMessage(m, cmd)
          }
        }
      }
    }
  }
// Sample function to handle incoming pessages
module.exports = async function Serialize(axel, m, config) {
  if (!m) return
  if (config.options.mode !== 'public' && !m.isOwner) return
  if (m.from && global.db.groups[m.sender]?.mute && !m.isOwner)
  if (m.isBaileys) return
  (await require('../Lib/loadDatabase.js'))(m, config)
  console.log("success")
  const bad = await (require('../Lib/filter.js'))(axel, m, config)
  if (bad) return
  
  const isCommand = m.body.startsWith(m.prefix)
  const command = isCommand ? m.command.toLowerCase() : ""
  const isGroup = m.from.endsWith('@g.us')
  
  if (m.message && !m.isBaileys) {
    console.log(chalk.black(chalk.black(chalk.bgWhite("-> FROM   : ")), chalk.black(chalk.bgGreen(m.pushName)), chalk.black(chalk.yellow(m.sender)) + "\n" + chalk.black(chalk.bgWhite("-> IN     : ")), chalk.black(chalk.bgGreen(m.isGroup ? m.metadata.subject : "Private Chat", m.from)) + "\n" + chalk.black(chalk.bgWhite("-> MESSAGE: ")), chalk.black(chalk.bgGreen(m.body || m.type)))
    )
  }
  
  if(isCommand) {
    const { listCommand: commands, listMenu: Menu } =  getFolderValue()
    let current = 0
        for (const name of commands) {
            var index = 0
            var fullPath = path.join(__dirname, `/Command/${Menu[index]}/${name}.js`)
            if (!fs.existsSync(fullPath)) {
              index++
            fullPath = path.join(__dirname, `/Command/${Menu[index]}/${name}.js`)
            }
            
            const Run = require(fullPath)
            const Exec = new Run(axel, m, global.db, config)
            if (Exec.commands.includes(command)) {
              current = 0
              if (Func.modeFor(Exec.setup.mode, m, config)) {
                if (Func.permissionLevel(Exec.setup.permission, m, global.db.users, config)) {
                  try {
                    return await Exec.execute()
                  } catch (e) {
                    return m.sendStatus(`*Error execute command* "_${command}_"\n\n*Message Error:*\n${e.message}\n${e.stack}`, 'failed')
                  }
                } else {
                  return m.sendStatus(Func.accessMessage(Exec.setup.permission, config, command), 'denied');
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
//      }
  }
}