let tvdb = require('../../tvdb');

let handleError = (res, err) => res.status(500).json({error: err});

module.exports = (app) => {
  app.post('/tvdb/init', (req, res) => {
    let apikey = null;
    if(req.body && req.body.apikey){
      apikey = req.body.apikey;
    }
    tvdb.login(apikey)
      .then(isLoggedIn => {
        if(isLoggedIn){
          res.status(200).json({ status: 'OK' });
        } else {
          handleError(res, 'Login failed: Unknown reason');
        }
      }, err => handleError(res, err));
  });
  app.post('/tvdb/search', (req, res) => {
    let name = null;
    if(req.body && req.body.name){
      name = req.body.name.trim();
    }
    if(!name){
      res.status(400).json({ error: '"name" is required'});
    } else {
      tvdb.searchSeries(name)
        .then(results => {
          res.json({ data: results });
        }, err => handleError(res, err));
    }
  });
  app.post('/tvdb/:series/seasons', (req, res) => {
    let series = (req.params.series || '').trim();
    if(!series){
      res.status(400).json({ error: '"series" is required'});
    } else {
      tvdb.getSeasons(series)
        .then(seasons => {
          let result = seasons.map(s => typeof s === 'string' ? parseInt(s, 10) : s);
          res.json({ data: result });
        }, err => handleError(res, err));
    }
  });
  app.post('/tvdb/:series/episodes/all', (req, res) => {
    let series = (req.params.series || '').trim();
    if(!series){
      res.status(400).json({ error: '"series" is required'});
    } else {
      tvdb.getAllEpisodes(series)
        .then(episodes => {
          res.json({ data: episodes });
        }, err => handleError(res, err));
    }
  });
  app.post('/tvdb/:series/episodes/:season', (req, res) => {
    let series = (req.params.series || '').trim();
    let season = (req.params.season || '').trim();
    if(!series){
      res.status(400).json({ error: '"series" is required'});
    } else if(!season) {
      res.status(400).json({ error: '"season" is required'});      
    } else {
      tvdb.getSeasonEpisodes(series, season)
        .then(episodes => {
          res.json({ data: episodes });
        }, err => handleError(res, err));
    }
  });
};