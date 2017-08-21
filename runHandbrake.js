'use strict';
require('dotenv').config();
const cp = require('child_process');
const os = require('os');
const StringDecoder = require('string_decoder').StringDecoder;
const settings = require('./settings');

const queue = [];
let running = null;

function runHandbrake(args){
  console.log(`Running ${settings.handbrakeLocation} ${args.join(' ')}`)
  return new Promise((resolve, reject) =>{
    
    let hb = cp.spawn(settings.handbrakeLocation, args);
    let data = [];
    hb.stdout.on('data', chunk => {
      data.push(chunk);
    });
    hb.stderr.on('data', chunk => {
      data.push(chunk);
    });

    hb.on('exit', code => {
      if(code) {
        reject(code);
      } else {
        let utf8 = new StringDecoder('utf8');
        resolve(
          data.map(d => d instanceof Buffer ? utf8.write(d) : d)
          .join('')
          .split(os.EOL)
          .filter(x=> x.trim())
          .map(line => {
            if(settings.handbrakeDebug){
              console.log(line);
            }
            return line;
          })
        );
      }
    });
  });
}

/**
 * Attempts to run the next command against handbrake
 */
function next(){
  if(running == null){
    if(queue.length){
      let item = queue.shift();
      running = runHandbrake(item.args)
        .then(item.resolve, item.reject)
        .then(() => {
          running = null;
          next();
        });
    }
  }
}

/**
 * Queue a handbrake command and return the results
 * @param {string[]} args - the arguments to send to handbrake
 * @returns {Promise<string[]>} - the command's results
 */
function queueCommand(args){
  return new Promise((resolve, reject) => {
    queue.push({
      args: args,
      resolve: resolve,
      reject: reject
    });
    next();
  });
}

module.exports = queueCommand;