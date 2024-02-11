const Command = require('../../command.js')
const moment = require('moment-timezone')
module.exports = class Run extends Command {
  constructor (
    axel, 
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
    this.execute = () => {
      const calculatePing = function (timestamp, now) {
        return moment.duration(now - moment(timestamp * 1000)).asSeconds();
      }
      setTimeOut(() => {
        m.reply(`*Ping :* *_${calculatePing(m.timestamp, Date.now())} second(s)_*`)
      }, 3000)
    }
  }
} 


