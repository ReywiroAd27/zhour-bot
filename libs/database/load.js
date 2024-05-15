const Func = require('@func/index')

module.exports = function loadDatabase(m, config) {
  if (m.sender === undefined) return
    const isNumber = x => typeof x === "number" && !isNaN(x)
    const isBoolean = x => typeof x === "boolean" && Boolean(x)
    const Status = config.options.status
    let user = global.db.users[m.sender]
    if (typeof user !== "object") global.db.users[m.sender] = {}
    if (user) {
        if (!isNumber(user.limit)) user.limit = m.isOwner ? config.limit.owner : user.limit
        if (!("lastChat" in user)) user.lastChat = new Date() * 1
        if (!("name" in user)) user.name = m.pushName
        if (!isBoolean(user.banned)) user.banned = false
        if (!isNumber(user.age)) user.age = undefined
    } else {
      let data = {
        limit: m.isOwner ? config.limit.owner : config.limit.guest,
        lastChat: new Date() * 1,
        name: m.pushName,
        banned: false,
        age: undefined
      }
      data["status"] = m.isOwner ? "owner" : "guest"
      global.db.users[m.sender] = data
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