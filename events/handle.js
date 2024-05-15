const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const delay = require("delay");
//const Func = require('@func/index')
const commands = [];
const special = [];
const category = [];
const only = ["group", "private", "all"];
const format = config.core?.arrayCmdFormat || ["name", "category", "perm", "only", "exec"]; //config.core.arrayCmdFormat
let firts = false;

//helper function for command handle
function perm(m, cmd) {
    switch (config.options.status[cmd.perm]) {
        case "all":
            return 1;
            break;
        case "owner":
            if (!m.isOwner)
                return m.sendText(
                    "You cannot access this command, as it can only be accessed by the owner!"
                );
            return 1;
            break;
        case "admin":
            if (!m.isAdmin)
                return m.sendText(
                    "You cannot access this command, as it can only be accessed by group admins!"
                );
            return 1;
            break;

        default:
            const status = config.options.status;
            for (let i = 0; i < status.length - 1; i++) {
                if (status[i] === status[cmd.perm]) {
                    if (!(db.users[m.sender].status >= cmd.perm)) {
                        return m.sendText(
                            `You cannot access this command, as it can only be accessed by ${
                                status[cmd.perm]
                            } users${
                                i === status.length - 1 ? "!" : " and above!"
                            }`
                        );
                    }
                    return 1;
                } else {
                    throw new ReferenceError(
                        `status with id '${cmd.perm}' is not defined`
                    );
                }
            }
    }
}

function loadPlugins(dir) {
    let dirs = dir || (config && config.options.pluginsDir) || "./plugins";
    console.log(__dirname, dirs);
    dirs = dirs.replace(/^\./, __dirname);
    const folders = fs.readdirSync(dirs);
    for (const folder of folders) {
        const fullDir = dirs + "/" + folder;
        const stat = fs.statSync(fullDir);
        if (stat.isDirectory()) {
            loadPlugins(fullDir);
        } else {
            if (!/(\.js|\.mjs|\.cjs)$/.test(folder)) continue;
            require(fullDir);
        }
    }
}

function prefix(p, t) {
    if (typeof p === "string") return t.startsWith(p);
    else if (Array.isArray(p)) return new RegExp("^"+p.join("|^"),i).test(t)
    else return p.test(t);
}

function regex(p) {
    if (Array.isArray(p)) return new RegExp("^"+p.join("|^"),i)
    if (p instanceof RegExp) return p
    if (typeof p === "string") return new RegExp(p,i)
}

// function to handle incoming messages
async function handle(sock, m) {
    if (!firts) {
        loadPlugins();
        firts = true;
    }
    if (RegExp("^[" + config.options.prefix + "^]", "i").test(m.body)) {
        for (const cmd in commands) {
            if (cmd === m.command) {
                if (cmd.only === "group" && !m.isGroup)
                    return m.sendStatus(
                        "The system cannot access the command. Commands can only be executed in group chats.",
                        "denied"
                    );
                if (cmd.only === "private" && m.isGroup)
                    return m.sendStatus(
                        "The system cannot access the command. Commands can only be executed in private chats.",
                        "denied"
                    );
                if (cmd.admin) {
                    if (!m.isBotAdmin)
                        return m.sendText(
                            "Sorry, I can't execute this command because I'm not an admin in this group."
                        );
                }
                if (perm(m, cmd) !== 1) return;
                return await cmd.exec({ m, sock });
            }
        }
        return m.sendText(
            `Sorry, but the command '${
                m.command
            }' is not found in the available command list.${Func.similarityCmd(
                commands,
                m.command,
                m.prefix
            )}`
        );
    } else {
        for (const item of special) {
            if (!item.prefix) continue;
            if (prefix(item.prefix, m.body)) {
                const prefix = regex(item.prefix)
                m.args = m.body
                    .replace(prefix, "")
                    .trim()
                    .split(/ +/);
                m.text = m.args.join(" ");

                for (const cmd of commands) {
                    if (cmd.name === item.task) {
                        i = commands.indexOf(cmd);
                        if (commands[i].only === "group" && !m.isGroup)
                            return m.sendStatus(
                                "The system cannot access the command. Commands can only be executed in group chats.",
                                "denied"
                            );
                        if (commands[i].only === "private" && m.isGroup)
                            return m.sendStatus(
                                "The system cannot access the command. Commands can only be executed in private chats.",
                                "denied"
                            );
                        if (commands[i].admin) {
                            if (!m.isBotAdmin)
                                return m.sendText(
                                    "Sorry, I can't execute this command because I'm not an admin in this group."
                                );
                        }
                        if (perm(m, commands[i]) !== 1) return;
                        return await commands[i].exec({ m, sock });
                    } else if (typeof item.task === "function") {
                        function conf(c = { perm: 0, only: "all", admin: false }) {
                          const {perm, only: o, admin: a} = c
                            if (o === "group" && !m.isGroup)
                                return m.sendStatus(
                                    "The system cannot access the command. Commands can only be executed in group chats.",
                                    "denied"
                                );
                            if (o === "private" && m.isGroup)
                                return m.sendStatus(
                                    "The system cannot access the command. Commands can only be executed in private chats.",
                                    "denied"
                                );
                            if (a) {
                                if (!m.isBotAdmin)
                                    return m.sendText(
                                        "Sorry, I can't execute this command because I'm not an admin in this group."
                                    );
                            }
                            if (perm(m, { perm }) !== 1) return;
                        }
                        return await item.task({ m, sock, conf});
                    } else {
                        continue;
                    }
                }
            }
        }
    }
}

//for created the command

function check(i) {
    if (
        !(typeof i.name === "string" || Array.isArray(i.name)) ||
        typeof i.category !== "string"
    )
        throw new TypeError(
            `the type of ${
                !(typeof i.name === "string" || Array.isArray(i.name))
                    ? "name must only be string or array"
                    : "category must only be string"
            }`
        );
        const cmds = commands.filter(o => o.name);
    if (Array.isArray(o.name)) {
      for (const name of o.name) {
        if (cmds.includes(name)) {
          throw new ReferenceError(`The name contains a duplicate name`)
          break;
        }
      }
    } else if (typeof i.name === "string" && !cmds.includes(i.name)) throw new ReferenceError(`The command "${i.name}" has already been declared`) 
    if (!category.hasOwnProperty(i.category))
        /*config.core.*/ category /*List*/
            .push(i.category);
    if (isNaN(i.perm)) throw new Error('unexpected "perm" value');
    if (typeof i.only !== "string")
        throw new TypeError("the type of 'only' must only be string");
    if (!only.includes(i.only.toLowerCase().replace(/\s+/g, "")))
        throw new Error('unexpected "only" value');
    if (typeof i.exec !== "function")
        throw new TypeError("the type of exec must only be function");
    return true;
}

function command(i) {
    if (!(this instanceof command))
        throw new TypeError("Cannot call a class as a function");
    this.i = i;
    this.type = Array.isArray(i) ? "array" : typeof i;
    switch (this.type) {
        case "array":
            if (i.length !== 5)
                throw new TypeError(
                    i.length < 5
                        ? "The command array is less than the correct array format."
                        : "The command creation array is more than the correct array format."
                );
            const obj = {};
            for (var j = 0; j < 5; j++) {
                obj[format[j]] = i[j];
            }
            console.log(obj);
            if (!check(obj)) return false;

            commands.push(obj);
            break;

        case "object":
            if (!i.name && !i.category && !i.perm && !i.only && !i.exec) {
                let text = "( ";
                for (const it in i) {
                    if (it !== undefined) continue;
                    text += it + ", ";
                }
                throw new Error(
                    "Command: " + it.replace(/, $/, "") + " not defined in code"
                );
            }
            if (!check(i)) return false;
            commands.push(i);
            break;

        default:
            throw new ReferenceError("Command: The input type is not on list");
    }
    this.clone = (OTC = {} /*Object To Change*/) => {
        const nObj = {};
        nObj.name = OTC.name;
        nObj.category = OTC.category || this.i.category;
        nObj.perm = OTC.perm || this.i.perm;
        nObj.only = OTC.only || this.i.only;
        if (!OTC.exec || OTC.exec === undefined)
            throw new ReferenceError(
                "exec must be filled (use the keyword 'true' in exec to use the same exec or create a new exec for different exec)."
            );
        nObj.exec = OTC.exec === true ? this.i.exec : OTC.exec;
        if (!check(nObj)) return;
        commands.push(nObj);
        return nObj;
    };
}

command.add = function (i) {
    const type = Array.isArray(i) ? "array" : typeof i;
    switch (type) {
        case "object":
            if (!i.name && !i.category && !i.perm && !i.only && !i.exec) {
                let text = "( ";
                for (const it in i) {
                    if (it !== undefined) continue;
                    text += it + ", ";
                }
                throw new Error(
                    "Command: " +
                        it.replace(/, $/, "") +
                        " ) not defined in code"
                );
            }
            if (!check(i)) return;
            commands.push(i);
            break;

        case "array":
            if (i.length !== 5)
                throw new TypeError(
                    i.length < 5
                        ? "The command array is less than the correct array format."
                        : "The command creation array is more than the correct array format."
                );
            const obj = {};
            for (var j = 0; j < 5; j++) {
                obj[format[j]] = i[j];
            }
            if (!check(obj)) return;
            commands.push(obj);
            break;

        default:
            throw new ReferenceError("Command: The input type is not on list");
    }
    return i;
};

command.temp = function (t, o) {
    const nObj = {};
    nObj.name = o.name;
    nObj.category = o.category || t.category;
    nObj.perm = o.perm || t.perm;
    nObj.only = o.only || t.only;
    if (!o.exec || o.exec === undefined)
        throw new ReferenceError(
            "exec must be filled (use the keyword 'true' in exec to use the same exec or create a new exec for different exec)."
        );
    nObj.exec = o.exec === true ? t.exec : o.exec;
    if (!check(t)) commands.push(nObj);
    return nObj;
};

command.on = function (p, t) {
    if (!(p instanceof RegExp || Array.isArray(p) || typeof p === "string"))
        throw new SyntaxError("unexpected type of 'prefix'");
    if (typeof c !== "string")
        throw new SyntaxError("type of 'command' must be only string");
    const cmds = commands.filter(o => o.name);
    if (
        !(
            (typeof t === "string" && cmds.includes(t)) ||
            typeof t === "function"
        )
    )
        throw new TypeError(
            t === string && !cmds.includes(t)
                ? "The command name entered is not registered in the system"
                : "unexpected type of 'task' value"
        );
    special.push({ prefix: p, task: t });
};

 /*command.run = function(...args) {
   let m, sock, t
   for (const arg of args) {
     if (arg.ev) sock = arg
     if (arg.isSerialize) m = arg
     if (typeof arg === 'string') t = arg
     if (m && sock && t) break
   }
   if (!sock) throw new ReferenceError("sock is not defined")
   if (!m) throw new ReferenceError("m is not defined")
   if (!t) return
   let cmds = commands.filter(i => [i.name, ])
   cmds = getCmdName(cmds, t)
 }*/

module.exports = handle;
module.exports.command = command;
