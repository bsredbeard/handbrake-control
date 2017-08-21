'use strict';
const fs = require('fs');
const path = require('path');

module.exports = (router) => {
  let omit = ['.', '..', 'index.js'];
  fs.readdirSync(__dirname)
    .filter(x => omit.indexOf(x) < 0)
    .forEach(file => require(path.join(__dirname, file))(router));
};