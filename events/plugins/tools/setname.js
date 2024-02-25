const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config,
    quoted
  ) {
    super("Change the display picture of bot/a group's")
    this.commands = ['setname','setsubject']
    this.setup = {
      permission: m.args[0].toLowerCase() === '-b'? 1 : 3,
      mode: {
        groups: m.args[0].toLowerCase() === '-b' ? false : true,
        privates: m.args[0].toLowerCase() === '-g' ? false : true
      }
    }
    this.execute = async() => {
      if (m.args[0].toLowerCase() === '-g') {
        return await this.group()
      } else if (m.args[0].toLowerCase() === '-b') {
        return await this.bot()
      }
    }
  }
  async bot() {
      await sock.updateProfileName(m.isQuoted ? quoted.body : quoted.text)
  }
  async group() {
    await sock.groupUpdateSubject(m.from, m.isQuoted ? quoted.body : quoted.text)
  }
} 