const fs = require('fs')
    const admin = require("firebase-admin");

module.exports = class Database{
  constructor(option){
    this.type = option.type ? option.type : option
    switch (this.type) {
      case 'db/json':
        this.path = option.path
        break;
      case 'db/firebase':
        this.url = option.url
        this.cred = option.cred
        break;
    }
  }
  
  read() {
    switch (this.type) {
      case 'db/json':
        try {
          const data = `${fs.readFileSync(this.path, 'utf8')}`
          JSON.parse(data);
        } catch (e) {
          return {}
        }
        break;
      case 'db/firebase':
        admin.initializeApp({
          credential: admin.credential.cert(this.cred),
          databaseURL: this.url
        });
        const database = admin.database()
        
        return database.ref(this.path).once('value').then(snapshot => snapshot.val())
        break;
      
      default:
        try {
          const data = fs.readFileSync(this.path, 'utf8')
          return JSON.parse(data);
        } catch (e) {
          return {}
        }
    }
  }
  
  write(data) {
    switch (this.type) {
      case 'db/json':
        try {
          const jsonData = JSON.stringify(data, null, 2);
          fs.writeFileSync(this.path, jsonData, 'utf8')
          return true
        } catch (e) {
          return false
        }
        break;
      case 'db/firebase':
        admin.initializeApp({
          credential: admin.credential.cert(this.config),
          databaseURL: this.url
        });
        const database = admin.database()
  
        database.ref(this.path).set(data)
        break;
      
      default:
        try {
          const jsonData = JSON.stringify(data, null, 2);
          fs.writeFileSync(this.path, jsonData, 'utf8')
          return true
        } catch (e) {
          return false
        }
    }
  }
}