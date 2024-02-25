const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config
  ) {
    super("Mute/Unmute The Group")
    this.commands = ['mute', 'senyapkan', 'mt']
    this.setup = {
      permission: 1,
      mode: {
        groups: true,
        privates: false
      }
    }
    this.execute = () => {
      let db = global.db.groups[m.from]
      if (db.mute) {
        db.mute = false
        return m.reply("Succes Unmute This Group")
      } else if (!db.mute) {
        db.mute = true
        return m.reply("Succes Mute This Group")
      }
    }
  }
} 