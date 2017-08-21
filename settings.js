require('dotenv').config();

const trueBool = ['TRUE', 'True', 'true', '1', 'yes', 'YES', 'Yes'];

const handbrakeLocation = process.env.HANDBRAKE_LOCATION;
const handbrakeDebug = trueBool.indexOf(process.env.HANDBRAKE_OUTPUT_TEXT) >= 0;
const drives = (process.env.DRIVES || '').split(',').filter(x=>!!x);
if(!drives.length){
  drives.push('F:\\');
}

const tvDbBaseUrl = process.env.TV_DB_BASE_URL || 'https://api.thetvdb.com/';
const tvDbApiKey = process.env.TV_DB_API_KEY || '';

module.exports = {
  handbrakeLocation: handbrakeLocation,
  handbrakeDebug: handbrakeDebug,
  driveList: drives,
  selectedDrive: drives[0],
  tvDbBaseUrl: tvDbBaseUrl,
  tvDbApiKey: tvDbApiKey
};