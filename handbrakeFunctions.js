'use strict';
const runHandbrake = require('./runHandbrake');
let cachedPresets = null;

/**
 * Scan the disc in the specified drive to get back a bunch of title information
 * @param {string} drive - the drive identifier
 * 
 */
function scanDisc(drive){
  return runHandbrake(['-t', '0', '--scan', '-i', drive])
    .then(outputLines => {
      let titleLineLocator = /^\+ title (\d+):/;
      let durationPattern = /^\s{2}\+ duration: (\d+):(\d+):(\d+)/;
      let autocropPattern = /^\s{2}\+ autocrop: (\d+)\/(\d+)\/(\d+)\/(\d+)/;
      let chaptersPattern = /^\s{4}\+ (\d+): cells \d+->\d+, \d+ blocks, duration (\d+):(\d+):(\d+)/;
      let titles = {};
      let currentTitleNumber = null;
      outputLines.forEach(line => {
        let dvdTitle = titleLineLocator.exec(line);
        if(dvdTitle){
          currentTitleNumber = dvdTitle[1];
          titles[currentTitleNumber] = { chapters: []};
        }
        if(currentTitleNumber){
          if(!titles[currentTitleNumber].duration){
            let result = durationPattern.exec(line);
            if(result){
              titles[currentTitleNumber].duration = {
                hours: parseInt(result[1], 10),
                minutes: parseInt(result[2], 10),
                seconds: parseInt(result[3], 10)
              };
            }
          } else if(!titles[currentTitleNumber].autocrop){
            let result = autocropPattern.exec(line);
            if(result){
              titles[currentTitleNumber].autocrop = {
                top: parseInt(result[1], 10),
                bottom: parseInt(result[2], 10),
                left: parseInt(result[3], 10),
                right: parseInt(result[4], 10),
              }
            }
          } else {
            let result = chaptersPattern.exec(line);
            if(result){
              titles[currentTitleNumber].chapters.push({
                label: parseInt(result[1], 10),
                hours: parseInt(result[2], 10),
                minutes: parseInt(result[3], 10),
                seconds: parseInt(result[4], 10)
              });
            }
          }
        }
      });
      return titles;
    }, errorCode => {
      console.error(`Handbrake exited with error code ${errorCode}`);
    });
}

function getPresets(){
  if(cachedPresets){
    return Promise.resolve(cachedPresets);
  }
  return runHandbrake(['--preset-import-gui', '-z'])
    .then(lines => {
      let presetNameFinder = /^\s{4}(?=\S)(.*)$/;
      let presets = lines.map(line => {
        let result = presetNameFinder.exec(line);
        if(result){
          return `"${result[1].trim()}"`;
        }
        return null;
      }).filter(x=>!!x);
      cachedPresets = presets;
      return presets;
    });
}

exports.scanDisc = scanDisc;
exports.getPresets = getPresets;