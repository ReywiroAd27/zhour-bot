const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config
  ) {
    super("Check The bot")
    this.commands = ['command','cmd', 'perintah']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = () => {
      console.log("on")
      return m.sendAdMessage('Masih ON kak🥰')
    }
  }
} 


