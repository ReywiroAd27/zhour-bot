const { spawn } = require("child_process");
const path = require("path");
const { fileURLToPath } = require("url");
const { platform } = require("os");
const { watchFile, unwatchFile, readFileSync } = require("fs");

var isRunning = false;

function start(file) {
  if(isRunning) return;
  isRunning = true;
  console.log(`Starting bot...`);
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
        console.log(`Restarting bot...`);
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