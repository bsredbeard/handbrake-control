'use strict';
const opn = require('opn');
const app = require('./app');
require('./routes');

app.listen(3000, () => {
  console.log('app listening on port 3000');
  opn('http://localhost:3000/');
});

// let presets = [];
// let waitingInterval = null;

// process.stdout.write('Disc scanning');
// waitingInterval = setInterval(() => process.stdout.write('.'), 5000);

// handbrakeFunctions.getPresets()
//   .then(output => presets = output);
// handbrakeFunctions.scanDisc('F:\\')
//   .then(output => {
//     clearInterval(waitingInterval);
//     console.log('');
//     console.log(output);
//     console.log('goodbye');
//     process.exit();
//   });