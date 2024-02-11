const Command = require('../../command.js')

module.exports = class Run extends Command {
  constructor (
    axel, 
    m,
    db,
    config
  ) {
    super("Show The Speed of Server")
    this.commands = ['speed', 'spd', 'kecepatan']
    this.setup = {
      permission: 0,
      mode: {
        groups: true,
        privates: true
      }
    }
    this.execute = async () => {
      const util = require("util");
      const cp = require('child_process')
      const execute = util.promisify(cp.exec);
      try {
        const { stdout, stderr } = await execute("speedtest-cli"); // Install speedtest-cli
        const result = stdout || stderr || "No output";
          return m.reply(result);
      } catch (e) {
        return m.reply(e.message);
      }
    }
  }
} 


