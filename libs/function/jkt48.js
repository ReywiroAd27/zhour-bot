const axios = require("axios")
const cheerio = require("cheerio");
const Database = require("./database")
const path = require("path")
const db = new Database({type: "db/json", path: path.join(__dirname,"../Database/jkt48Live.json")})
const dbBack = new Database({type: "db/json", path: path.join(__dirname, "../Database/jkt48Live(backup).json")})


const Func = {
   checkIdnLive: async () => {
      const urls = [
          "https://www.idn.app/jkt48_freya",
          "https://www.idn.app/jkt48_gita",
          "https://www.idn.app/jkt48_lulu",
          "https://www.idn.app/jkt48_michie",
          "https://www.idn.app/jkt48_shani",
          "https://www.idn.app/jkt48_eli",
          "https://www.idn.app/jkt48_jessi",
          "https://www.idn.app/jkt48_gracia",
          "https://www.idn.app/jkt48_feni",
          "https://www.idn.app/jkt48_muthe",
          "https://www.idn.app/jkt48_ashel",
          "https://www.idn.app/jkt48_fiony",
          "https://www.idn.app/jkt48_amanda",
          "https://www.idn.app/jkt48_flora",
          "https://www.idn.app/jkt48_olla",
          "https://www.idn.app/jkt48_ella",
          "https://www.idn.app/jkt48_indah",
          "https://www.idn.app/jkt48_christy",
          "https://www.idn.app/jkt48_marsha",
          "https://www.idn.app/jkt48_kathrina",
          "https://www.idn.app/jkt48_indira",
          "https://www.idn.app/jkt48_adel",
          "https://www.idn.app/jkt48_raisha",
          "https://www.idn.app/jkt48_lia",
          "https://www.idn.app/jkt48_oniel",
          "https://www.idn.app/jkt48_callie",
          "https://www.idn.app/jkt48_chelsea",
          "https://www.idn.app/jkt48_gendis",
          "https://www.idn.app/jkt48_gracie",
          "https://www.idn.app/jkt48_daisy",
          "https://www.idn.app/jkt48_danella",
          "https://www.idn.app/jkt48_alya",
          "https://www.idn.app/jkt48_cathy",
          "https://www.idn.app/jkt48_anindya",
          "https://www.idn.app/jkt48_jeane",
          "https://www.idn.app/jkt48_cynthia",
          "https://www.idn.app/jkt48_greesel",
          "https://www.idn.app/jkt48_elin",
          "https://www.idn.app/jkt48_zee"
      ];
      const current = moment().tz('Asia/Jakarta')
      const time = current.format('dddd, DD/MM/YYYY HH:mm')
      let memberData = {}
      let i = 0
        for (const url of urls) {
          memberData[i] = {
                name: undefined,
                live: false,
                title: '-',
                url: {
                  idn_web: '-',
                  idn_app: '-'
                },
                time: time,
              }
          try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const memberName = $('h1.param-value').text();
            const liveElement = $('.livestream-card');
            const liveStream = liveElement.find('a');
            
            if (liveStream && liveStream.length > 0) {
              const title = liveElement.attr('data-title');
              const key = liveElement.attr('data-slug');
              const linkLive = liveStream.attr('href');
        
              memberData[i] = {
                name: memberName,
                live: true,
                title: title,
                url: {
                  idn_web: `https://www.idn.app${linkLive}`,
                  idn_app: `https://app.idn.media/?link=https://links.idn.media?type=live&url&slug=${key}`
                },
                time: time
              }
              
            } else {
              memberData[i] = {
                name: undefined,
                live: false,
                title: '-',
                url: {
                  idn_web: '-',
                  idn_app: '-'
                },
                time: time,
              }
            }
            i++
          } catch {
            //const formattedError = `Error: ${error.message}`;
            //console.log(formattedError)
          }
      }
      return memberData
    },
    idnLive: () => {
      db.write({ idn: Func.checkIdnLive()})
      if (dbBack.read() === undefined || dbBack.read().length < 1 || dbBack.read().name === undefined) {
        dbBack.write({ idn: Func.checkIdnLive()})
      }
      const datas = db.read()
      const backup = dbBack.read()
      console.log(db.read(), dbBack.read())
      let live = []
      let i = 0
      try {
        for (const data of datas) {
          if (backup[i].live !== (data.live)) {
            backup[i] = data
            live.push(data)
            i++
          } else {
            i++
          }
        }
        dbBack.write(backup)
        return live
      } catch (e) {
        const err = Error()
        const text = 'Failed to get data from server\n' + '   Please check Your internet\n\n' + e 
        return text
      }
    }
}

module.exports = jkt48