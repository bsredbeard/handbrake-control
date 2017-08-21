const settings = require('../../settings');

module.exports = (app) => {
  app.post('/drives', (req, res) => {
    if(req.body && req.body.drive){
      if(settings.driveList.indexOf(req.body.drive) >= 0){
        settings.selectedDrive = req.body.drive;
        res.json({ok: 'OK'});
      } else {
        res.status(400).json({ error: 'The requested drive does not exist. See GET /api/drives'});
      }
    } else {
      res.status(400).json({ error: 'You must send a POST with a parameter: drive'});
    }
  });
}