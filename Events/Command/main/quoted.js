const Command = require('../../command.js')
const { Serialize } = require("../../../Lib/serialize.js")
module.exports = class Run extends Command {
  constructor (
    axel, 
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
          const message = await Serialize(axel, (await axel.loadMessage(m.from, m.quoted.id)), config)
          if (!message.isQuoted) return m.reply("Quoted Not Found 🙄")
          axel.sendMessage(m.from, { forward: message.quoted })
        } catch {
          m.reply("Quoted Not Found 🙄")
        }
    }
  }
} 


