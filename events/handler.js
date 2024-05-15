exports = function(sock,m){
  const qUser = global.db.users[m.quoted.sender]
  const user = global.db.users[m.sender]
  
  if(users.afk) {
    users.afk = false
    users.afkTime = 0
    m.sendText(`@${m.sender.split("@")[0]} has returned from afk\nwith reason: ${users.afkReason}`)
  }
  
  if (m.isQuoted && qUser.afk) {
    m.sendText(`*Hey @${m.sender.split`@`[0]}, for the meantime, please don't tag* \`\`\`${m.quoted.sender}\`\`\` *because he's currently afk!*`)
  }
}