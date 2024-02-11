const { spawn } = require("child_process");
const path = require("path");
const { fileURLToPath } = require("url");
const { platform } = require("os");
const { watchFile, unwatchFile, readFileSync } = require("fs");
const express = require('express');
const fetchs = require('node-fetch');
const chalk = require('chalk')

const port = process.env.PORT || 5000;

const app = express();

app.get('/', (req, res) => {
  res.type('text/plain');
  res.send('Bot Is Activated');
});

function keepAlive() {
  const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  if(/(\/\/|\.)undefined\./.test(url)) return;
  setInterval(() => {
   fetchs(url).catch(console.error);
  }, 5 * 1000 * 60);
}

app.listen(port, () => {
  console.log(`${chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ')}App listened on port`, port);
  keepAlive();
});

var isRunning = false;

function start(file) {
  if(isRunning) return;
  isRunning = true;
  console.log(`${chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')('] ')}Starting bot...`);
  let args = [path.join(__dirname, file), ...process.argv.slice(2)];
  let p = spawn(process.argv[0], args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"] 
  });
  p.on("message", (data) => {
    switch (data) {
      case "reset": {
        platform() === "win32" ? p.kill("SIGINT") : p.kill();
        isRunning = false;
        start.apply(this, arguments);
        console.log(`${chalk.hex('#61dafb')('[') + chalk.hex('#ff8c00')(' Sys ') + chalk.hex('#61dafb')(']')} Restarting bot...`);
      }
      break;
      case "uptime": {
        p.send(process.uptime());
      }
      break;
    }
  });
  p.on("exit", (code) => {
    isRunning = false;
    console.error("Exited with code:", code);
    if(code === 0) return;
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });
}
start("axelion.js");