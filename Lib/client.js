const Func = require("./function.js")
const { writeExif } = require("./sticker.js")

const { prepareWAMessageMedia, jidNormalizedUser, proto, areJidsSameUser, generateWAMessageFromContent, downloadContentFromMessage, toBuffer } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const { parsePhoneNumber } = require("libphonenumber-js")
const Crypto = require("crypto")

module.exports = function ({ axel, store }) {
   delete store.groupMetadata

   // Combining Store to Client
   for (let v in store) {
      axel[v] = store[v]
   }

   const client = Object.defineProperties(axel, {
      getContentType: {
         value(content) {
            if (content) {
               const keys = Object.keys(content);
               const key = keys.find(k => (k === 'conversation' || k.endsWith('Message') || k.endsWith('V2') || k.endsWith('V3')) && k !== 'senderKeyDistributionMessage');
               return key
            }
         },
         enumerable: true
      },

      decodeJid: {
         value(jid) {
            if (/:\d+@/gi.test(jid)) {
               const decode = jidNormalizedUser(jid);
               return decode
            } else return jid;
         }
      },

      generateMessageID: {
         value(id = "3EB0", length = 18) {
            return id + Crypto.randomBytes(length).toString('hex').toUpperCase()
         }
      },

      getName: {
         value(jid) {
            let id = axel.decodeJid(jid)
            let v
            if (id?.endsWith("@g.us")) return new Promise(async (resolve) => {
               v = axel.contacts[id] || axel.messages["status@broadcast"]?.array?.find(a => a?.key?.participant === id)
               if (!(v.name || v.subject)) v = axel.groupMetadata[id] || {}
               resolve(v?.name || v?.subject || v?.pushName || (parsePhoneNumber('+' + id.replace("@g.us", "")).format("INTERNATIONAL")))
            })
            else v = id === "0@s.whatsapp.net" ? {
               id,
               name: "WhatsApp"
            } : id === axel.decodeJid(axel?.user?.id) ?
               axel.user : (axel.contacts[id] || {})
            return (v?.name || v?.subject || v?.pushName || v?.verifiedName || (parsePhoneNumber('+' + id.replace("@s.whatsapp.net", "")).format("INTERNATIONAL")))
         }
      },

      sendContact: {
         async value(jid, number, quoted, options = {}) {
            let list = []
            for (let v of number) {
               list.push({
                  displayName: await axel.getName(v),
                  vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await axel.getName(v + "@s.whatsapp.net")}\nFN:${await axel.getName(v + "@s.whatsapp.net")}\nitem1.TEL;waid=${v}:${v}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:${config.Exif.packEmail}\nitem2.X-ABLabel:Email\nitem3.URL:${config.Exif.packWebsite}\nitem3.X-ABLabel:Instagram\nitem4.ADR:;;Indonesia;;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
               })
            }
            return axel.sendMessage(jid, {
               contacts: {
                  displayName: `${list.length} Contact`,
                  contacts: list
               },
               mentions: quoted?.participant ? [axel.decodeJid(quoted?.participant)] : [axel.decodeJid(axel?.user?.id)],
               ...options
            }, { quoted, ...options })
         },
         enumerable: true
      },

      parseMention: {
         value(text) {
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net') || []
         }
      },

      downloadMediaMessage: {
         async value(message, filename) {
            let mime = {
               imageMessage: "image",
               videoMessage: "video",
               stickerMessage: "sticker",
               documentMessage: "document",
               audioMessage: "audio",
               ptvMessage: "video"
            }[message.type]

            if ('thumbnailDirectPath' in message.msg && !('url' in message.msg)) {
               message = {
                  directPath: message.msg.thumbnailDirectPath,
                  mediaKey: message.msg.mediaKey
               };
               mime = 'thumbnail-link'
            } else {
               message = message.msg
            }

            return await toBuffer(await downloadContentFromMessage(message, mime))
         },
         enumerable: true
      },

      sendMedia: {
         async value(jid, url, quoted = "", options = {}) {
            let { mime, data: buffer, ext, size } = await Func.getFile(url)
            mime = options?.mimetype ? options.mimetype : mime
            let data = { text: "" }, mimetype = /audio/i.test(mime) ? "audio/mpeg" : mime
            if (size > 45000000) data = { document: buffer, mimetype: mime, fileName: options?.fileName ? options.fileName : `${axel.user?.name} (${new Date()}).${ext}`, ...options }
            else if (options.asDocument) data = { document: buffer, mimetype: mime, fileName: options?.fileName ? options.fileName : `${axel.user?.name} (${new Date()}).${ext}`, ...options }
            else if (options.asSticker || /webp/.test(mime)) {
               let pathFile = await writeExif({ mimetype, data: buffer }, { ...options })
               data = { sticker: fs.readFileSync(pathFile), mimetype: "image/webp", ...options }
               fs.existsSync(pathFile) ? await fs.promises.unlink(pathFile) : ""
            }
            else if (/image/.test(mime)) data = { image: buffer, mimetype: options?.mimetype ? options.mimetype : 'image/png', ...options }
            else if (/video/.test(mime)) data = { video: buffer, mimetype: options?.mimetype ? options.mimetype : 'video/mp4', ...options }
            else if (/audio/.test(mime)) data = { audio: buffer, mimetype: options?.mimetype ? options.mimetype : 'audio/mpeg', ...options }
            else data = { document: buffer, mimetype: mime, ...options }
            let msg = await axel.sendMessage(jid, data, { quoted, ...options })
            return msg
         },
         enumerable: true
      },

      cMod: {
         value(jid, copy, text = '', sender = axel.user.id, options = {}) {
            let mtype = axel.getContentType(copy.message)
            let content = copy.message[mtype]
            if (typeof content === "string") copy.message[mtype] = text || content
            else if (content.caption) content.caption = text || content.text
            else if (content.text) content.text = text || content.text
            if (typeof content !== "string") {
               copy.message[mtype] = { ...content, ...options }
               copy.message[mtype].contextInfo = {
                  ...(content.contextInfo || {}),
                  mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
               }
            }
            if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
            if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid
            else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid
            copy.key.remoteJid = jid
            copy.key.fromMe = areJidsSameUser(sender, axel.user.id)
            return proto.WebMessageInfo.fromObject(copy)
         }
      },

      sendPoll: {
         async value(chatId, name, values, options = {}) {
            let selectableCount = options?.selectableCount ? options.selectableCount : 1
            return await axel.sendMessage(chatId, {
               poll: {
                  name,
                  values,
                  selectableCount
               },
               ...options
            }, { ...options })
         },
         enumerable: true
      },

      setProfilePicture: {
         async value(jid, media, type = "full") {
            let { data } = await Func.getFile(media)
            if (/full/i.test(type)) {
               data = await Func.resizeImage(media, 720)
               await axel.query({
                  tag: 'iq',
                  attrs: {
                     to: await axel.decodeJid(jid),
                     type: 'set',
                     xmlns: 'w:profile:picture'
                  },
                  content: [{
                     tag: 'picture',
                     attrs: { type: 'image' },
                     content: data
                  }]
               })
            } else {
               data = await Func.resizeImage(media, 640)
               await axel.query({
                  tag: 'iq',
                  attrs: {
                     to: await axel.decodeJid(jid),
                     type: 'set',
                     xmlns: 'w:profile:picture'
                  },
                  content: [{
                     tag: 'picture',
                     attrs: { type: 'image' },
                     content: data
                  }]
               })
            }
         },
         enumerable: true
      },

      sendGroupV4Invite: {
         async value(jid, groupJid, inviteCode, inviteExpiration, groupName, jpegThumbnail, caption = "Invitation to join my WhatsApp Group", options = {}) {
            const media = await prepareWAMessageMedia({ image: (await Func.getFile(jpegThumbnail)).data }, { upload: axel.waUploadToServer })
            const message = proto.Message.fromObject({
               groupJid,
               inviteCode,
               inviteExpiration: inviteExpiration ? parseInt(inviteExpiration) : +new Date(new Date() + (3 * 86400000)),
               groupName,
               jpegThumbnail: media.imageMessage?.jpegThumbnail || jpegThumbnail,
               caption
            })

            const m = generateWAMessageFromContent(jid, message, { userJid: axel.user?.id })
            await axel.relayMessage(jid, m.message, { messageId: m.key.id })

            return m
         },
         enumerable: true
      }
   })

   return axel
}