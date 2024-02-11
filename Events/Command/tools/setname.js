const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    axel, 
    m,
    db,
    config,
    quoted
  ) {
    super("Change the display picture of bot/a group's")
    this.commands = ['setname','setsubject']
    this.setup = {
      permission: m.arg(1).toLowerCase() === '-b'? 1 : 3,
      mode: {
        groups: m.arg(1).toLowerCase() === '-b' ? false : true,
        privates: m.arg(1).toLowerCase() === '-g' ? false : true
      }
    }
    this.execute = async() => {
      if (m.arg(1).toLowerCase() === '-g') {
        return await this.group()
      } else if (m.arg(1).toLowerCase() === '-b') {
        return await this.bot()
      }
    }
  }
  async bot() {
      await axel.updateProfileName(m.isQuoted ? quoted.body : quoted.text)
  }
  async group() {
    await axel.groupUpdateSubject(m.from, m.isQuoted ? quoted.body : quoted.text)
  }
} 