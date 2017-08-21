const handbrakeFunctions = require('../../handbrakeFunctions');
const settings = require('../../settings');

module.exports = (app) => {
  app.post('/scan-disc', (req, res) => {
    handbrakeFunctions.scanDisc(settings.selectedDrive)
      .then(
        result => res.json(result),
        err => res.status(500).json({error: err})
      );
  });
};