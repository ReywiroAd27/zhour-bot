const Command = require('../../command.js')
const { Serialize } = require("../../../Lib/serialize.js")
module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config
  ) {
    super("Show Quoted The Message")
    this.commands = ['quoted', 'q']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = async () => {
      if (!m.isQuoted) m.reply("quoted")
        try {
          const message = await Serialize(sock, (await sock.loadMessage(m.from, m.quoted.id)), config)
          if (!message.isQuoted) return m.reply("Quoted Not Found 🙄")
          sock.sendMessage(m.from, { forward: message.quoted })
        } catch {
          m.reply("Quoted Not Handling")
        }
    }
  }
} 


