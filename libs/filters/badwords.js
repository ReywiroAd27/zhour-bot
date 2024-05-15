const badwordsnext = require('bad-words-next')
const en = require('bad-words-next/data/en.json')
const ch = require('bad-words-next/data/ch.json')
const de = require('bad-words-next/data/de.json')
const es = require('bad-words-next/data/es.json')
const fr = require('bad-words-next/data/fr.json')
const pl = require('bad-words-next/data/pl.json')
const ru = require('bad-words-next/data/ru.json')
const ru_lat = require('bad-words-next/data/ru_lat.json')
const ua = require('bad-words-next/data/ua.json')
//const id = require("./badwords/id.json")

const badwords = new badwordsnext()
badwords.add(en)
badwords.add(ch)
badwords.add(es)
badwords.add(de)
badwords.add(fr)
badwords.add(pl)
badwords.add(ru)
badwords.add(ru_lat)
badwords.add(ua)

module.exports = async function filter(sock, m, config) {
  try {
    if (badwords.check(m.body)) {
      console.log(`${m.sender} telah berbicara kotor!`)
      if (m.isGroup) {
        if (global.db.groups[m.from].filter === true) {
          if (m.isAdmin) return false
          if (m.isBotAdmin) {
            try {
              sock.sendMessage(m.from, { delete: m.key })
              m.sendAdMessageV2(`Halo kak @${m.sender.split('@')[0]} mohon jangan berbicara kotor! kalau tidak mau di kick dari grup!`, { title: "Bad Words Detected", showAd: true })
              return true
            } catch (e) {
              console.log('Filter System Error', e)
              m.sendStatus(`-- *Bad Words System Error* --\n\n${e}`, 'failed', { from: config.options.owner})
              return true
            }
          } else {
            m.sendAdMessage('Kata-kata kotor terdeteksi!!\n\nTidak dapat menghapus pesan karena tidak memiliki izin. Jika "Group Chat" ini tidak membolehkan berbicara kotor, saya mohon agar admin menghapus pesan ini!', {title: "Bad Words Detected", showAd: true})
            return true
          }
        }
      } else {
        m.reply("*_Tolong Jangan Berbicara Kotor_* 🗿")
        return true
      }
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
  }
}