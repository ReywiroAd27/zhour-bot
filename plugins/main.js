const { command: cmd, library } = require("@events/handle");
const {getCommands: getCmd} = library
const { default: cp, exec } = require("child_process");
const { promisify } = require("util");
const F = require("@func/index");

//eval
cmd.add({
    name: "eval",
    category: "owner",
    perm: 1,
    only: "all",
    logic: ({ m, sock }) => {
        try {
            const result = /(await)/g.test(m.text)
                ? eval(`(async()=>{${m.text}})()`)
                : eval(m.text);
            return m.sendText(result);
        } catch (e) {
            return m.sendText(F.format(e));
        }
    }
});
cmd.on(/^>|^=>/i, "eval");

//exec
cmd.add({
    name: ["exec", "sh"],
    category: "owner",
    perm: 1,
    only: "all",
    exec: function ({ m }) {
        try {
          exec(m.text, (err,stdout) => {
            if (err) return m.reply(err)
            if (stdout) return m.reply(stdout)
          })
        } catch (e) {
          return m.reply(e)
        }
    }
});
cmd.on(/$/i, "exec")

cmd.add({
  name: ["bot", "test"],
  category: "main",
  perm: 1,
  only: "all",
  exec: ({m}) => {
    return m.reply("Don't worry, I'm still active, my lord")
  }
})
cmd.on("bot", "bot")

/**
 * Default Main Menu
 */
cmd.add({
  name: "menu",
  category: "main",
  perm: 0,
  only: "all",
  exec: async function({ m, sock }) {
    const cmds = getCmd(),
          length = cmds.length
          category = cmds.category()
    let text = `Hello @${m.sender.split`@`}, My name is Axelion. I am a virtual assistant created to help you complete tasks and provided the information you need. Feel free to give me commands to get started

➤\`\`\`You Information\`\`\`
  ➩ _*Name :*_  _${user.name ? user.name : m.pushName}_
  ➩ _*Device :*_  _${m.device ? m.device : "undefined"}_
  ➩ _*UserTag :*_  @${m.sender.split`@`[0]}
  ➩ _*Status :*_  _${config.options.status[user.status] || "Not Registered"}_
  ➩ _*Limit :*_   _${user.limit || "Not Registered"}_

➤ \`\`\`System Information\`\`\`
  ➩ _*Bot Name :*_ _${config.options.bot[1]}_
  ➩ _*Version :*_ _${library.getProjectVersion()}_
  ➩ _*Runtime :*_ _${F.runtime(process.uptime())}_
  ➩ _*Prefix :*_ _${config.options.prefix.length > 4 ? 'multi' : "(" + config.options.prefix + ")" }_
  ➩ _*Features :*_ _${length}_

➤ \`\`\`Time Information\`\`\`
  ➩ _*Date & Time :*_
     • *WIT :* _${moment().tz("Asia/Jayapura").format("DDDD, dd MMMM YYYY || HH:mm")}_
     • *WITA :* _${moment().tz("Asia/Makassar").format("DDDD, dd MMMM YYYY || HH:mm")}_
     • *WIB :* _${moment().tz("Asia/Jakarta").format("DDDD, dd MMMM YYYY || HH:mm")}_

===================✦
     Command List
===================✦
`
    if (length < 50) {
        text += `𖣘 \`\`\`List Menu\`\`\``
        text = `  ➤ ${category.map(a => m.prefix + a).join("\n  ➤ ")}menu`
    } else {
      const cmdc = cmds.setCategory()
      Object.entries(cmdc).map(([ct, cm]) => {
        text += `𖣘 \`\`\`${ct.toProperCase()} Menu\`\`\`\n`
        text += `  ➤ ${cm.map(a => `${m.prefix + a.name} ${a.help}`).join("\n  ➤ ")}`
      })
    }
  }
})