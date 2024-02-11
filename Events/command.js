const fs = require('fs')
const path = require('path')

module.exports = class Command {
  constructor (category, options = {}) {
    this.category = category
    this.options = options 
  }
}