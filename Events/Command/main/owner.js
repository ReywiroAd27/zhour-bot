const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    axel, 
    m,
    db,
    config
  ) {
    super("Show The Creator Bot")
    this.commands = ['owner', 'creator', 'pembuat', 'pemilik']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = () => {
      axel.sendContact(m.from, config.options.owner, m)
    }
  }
} 


