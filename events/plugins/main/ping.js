const Command = require('../../command.js')
const moment = require('moment-timezone')
module.exports = class Run extends Command {
  constructor (
    sock, 
    m,
    db,
    config
  ) {
    super("Show The Ping")
    this.commands = ['ping']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = async () => {
      const calculatePing = await moment.duration(Date.now() - moment(m.timestamp * 1000)).asSeconds();
      return m.reply(`*_Pong!!_*\n*The Ping Is :* *_${calculatePing} second(s)_*`)
    }
  }
} 


