const handbrakeFunctions = require('../../handbrakeFunctions');

module.exports = (app) => {
  app.get('/presets', (req,res) => {
    handbrakeFunctions.getPresets()
      .then(presets => {
        res.json({ data: presets });
      }, err => {
        res.status(500).json({ error: err });
      });
  });
};