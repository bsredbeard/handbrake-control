const settings = require('../../settings');

module.exports = (app) => {
  app.get('/drives', (req, res) => {
    res.json({ data: settings.driveList});
  });
  
  app.get('/drives/selected', (req, res) => {
    res.json({ data: settings.selectedDrive });
  });
}