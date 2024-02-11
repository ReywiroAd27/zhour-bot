const tr = require('googletrans')

module.exports = class Translate{
  constructor(text, options){
    if (text) {
      this.go(text, options)
    }
  }
  go(text,option) {
    let dest = typeof option === Object && option.to ? option.to : option
    tr(text, dest)
      .then(() => {
        
      })
      .catch(() => {
        
      })
  }
}