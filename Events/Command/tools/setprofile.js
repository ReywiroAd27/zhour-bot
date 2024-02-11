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
    this.commands = ['setpp','setprofile','seticon']
    this.setup = {
      permission: m.arg(2).toLowerCase() === '-b'? 1 : 3,
      mode: {
        groups: m.arg(2).toLowerCase() === '-b' ? false : true,
        privates: m.arg(2).toLowerCase() === '-g' ? false : true
      }
    }
    this.execute = async() => {
      const media = await quoted.download()
      if (m.arg(2).toLowerCase() === '-g') {
        return await this.group(media)
      } else if (m.arg(2).toLowerCase() === '-b') {
        return await this.bot(media)
      }
    }
  }
  async bot(media) {
    if (m.arg(1).toLowerCase() === '-f') await axel.setProfilePicture(axel?.user?.id, media, "full")
    else if (m.arg(1).toLowerCase() === '-r' || m.arg(1).toLowerCase() === '-d') await axel.removeProfilePicture(axel.decodeJid(axel?.user?.id))
    else await axel.setProfilePicture(axel?.user?.id, media, "normal")
  }
  async group(media) {
    if (m.arg(1).toLowerCase() === '-f') await axel.setProfilePicture(m.from, media, "full")
    else if (m.arg(1).toLowerCase() === '-r' || m.arg(1).toLowerCase() === '-d') await axel.removeProfilePicture(m.from)
    else await axel.setProfilePicture(m.from, media, "normal")
  }
} 