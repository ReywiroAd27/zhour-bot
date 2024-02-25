const Func = require('./function.js')

module.exports = function loadDatabase(m, config) {
  if (m.sender === undefined) return
    const isNumber = x => typeof x === "number" && !isNaN(x)
    const isBoolean = x => typeof x === "boolean" && Boolean(x)
    const Status = config.options.status
    let user = global.db.users[m.sender]
    if (typeof user !== "object") global.db.users[m.sender] = {}
    if (user) {
        if (!isNumber(user.limit)) user.limit = m.isOwner ? config.limit.owner : config.limit.guest
        if (!("lastChat" in user)) user.lastChat = new Date() * 1
        if (!("name" in user)) user.name = m.pushName
        if (!isBoolean(user.banned)) user.banned = false
        for (let i = 4; i <= Status.length - 1; i++) {
          if (!isBoolean(user.status[Status[i]])) user.status[Status[i]] = m.isOwner ? true : false
        }
    } else {
      let status = {}
      for (let i = 4; i <= Status.length - 1; i++) {
        status[Status[i]] = m.isOwner ? true : false
      }
        global.db.users[m.sender] = {
            limit: m.isOwner ? config.limit.owner : config.limit.guest,
            lastChat: new Date() * 1,
            name: m.pushName,
            banned: false,
            status: status
        }
    }


    if (m.isGroup) {
        let group = global.db.groups[m.from]
        if (typeof group !== "object") global.db.groups[m.from] = {}
        if (group) {
            if (!isBoolean(group.mute)) group.mute = false
            if (!isNumber(group.lastChat)) group.lastChat = new Date() * 1
            if (!isBoolean(group.welcome)) group.welcome = true
            if (!isBoolean(group.leave)) group.leave = true
            if (!isBoolean(group.auto)) group.auto = false
            if (!isBoolean(group.filter)) group.filter = false
        } else {
            global.db.groups[m.from] = {
                lastChat: new Date() * 1,
                mute: false,
                welcome: true,
                leave: true,
                auto: false,
                filter: false,
            }
        }
    }
}