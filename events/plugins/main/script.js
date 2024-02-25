const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config
  ) {
    super("Show The Script Info")
    this.commands = ['script', 'sc', 'skrip']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = () => {
      m.reply("The script is private, not for public. Because this bot script is beta version")
    }
  }
} 


