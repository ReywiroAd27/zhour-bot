const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    axel, 
    m,
    db,
    config
  ) {
    super("To Change The Bot Mode")
    this.commands = ['public', 'self', 'pub']
    this.setup = {
      permission: 1,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = () => {
      if (config.options.mode === 'public') {
        config.options.mode = 'self'
        m.reply('Switch Bot To Self Mode')
      } else if (config.options.mode === 'develop') {
        m.reply('The Bot Is In Develope Mode')
      } else {
        config.options.mode = 'public'
        m.reply('Switch Bot To Public Mode')
      }
    }
  }
} 


