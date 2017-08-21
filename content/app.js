function localServices($http){
  this.getDrives = () => {
    return $http.get('/api/drives')
      .then(response => response.data.data, err => Promise.reject(err.data));
  };
  this.getSelectedDrive = () => {
    return $http.get('/api/drives/selected')
      .then(response => response.data.data, err => Promise.reject(err.data));
  };
  this.selectDrive = (drive) => {
    return $http.post('/api/drives', {drive: drive})
      .catch(err => Promise.reject(err.data));
  };

  this.getPresets = () => {
    return $http.get('/api/presets')
      .then(response => response.data.data, err => Promise.reject(err.data));
  };

  this.startScan = () => {
    return $http.post('/api/scan-disc', {})
      .then(response => response.data, err => Promise.reject(err.data));
  };

  this.tv = {
    login: (key) => {
      let data = {};
      if(key) data.apikey = key;
      return $http.post('/api/tvdb/init', data)
        .then(response => response.data.status === 'OK', err => Promise.reject(err.data));
    },
    search: (name) => {
      return $http.post('/api/tvdb/search', { name: name })
        .then(response => response.data.data, err => Promise.reject(err.data));
    },
    seasons: (series) => {
      return $http.post(`/api/tvdb/${series}/seasons`)
        .then(response => response.data.data, err => Promise.reject(err.data));
    },
    allEpisodes: (series) => {
      return $http.post(`/api/tvdb/${series}/episodes/all`)
        .then(response => response.data.data, err => Promise.reject(err.data));
    },
    episodesForSeason: (series, season) => {
      return $http.post(`/api/tvdb/${series}/episodes/${season}`)
        .then(response => response.data.data, err => Promise.reject(err.data));
    }
  };
}
localServices.$inject = ['$http'];

function durationFilter(){
  return function(duration){
    return [
      duration.hours.toString(),
      duration.minutes.toString(),
      duration.seconds.toString()
    ].map(x => x.length < 2 ? '0' + x : x)
      .join(':');
  };
}
durationFilter.$inject = [];

function handbrakeController(localServices){
  this.selectedDrive = '';
  this.availableDrives = [];

  this.selectedPreset = '';
  this.availablePresets = [];

  this.scanningDisc = false;
  this.discInformation = null;
  this.error = null;

  this.metaMode = '';
  this.movieTitle = '';
  this.movieSearching = false;
  this.movieResults = null;
  this.tvTitle = '';
  this.tvSearching = false;
  this.tvResults = null;

  this.startScan = (drive) => {
    this.scanningDisc = true;
    localServices.selectDrive(drive)
      .then(() => {
        localServices.startScan()
          .then(result => {
            this.scanningDisc = false;
            this.discInformation = result;
          }, error => {
            this.scanningDisc = false;
            this.error = error;
          });
      });
  };

  this.searchMovies = (movieTitle) => {
    this.movieSearching = true;
    console.log('movie', movieTitle);
    window.setTimeout(() => {
      this.movieSearching = false;
      this.movieResults = [];
    }, 1500);
  };

  this.searchTV = (title) => {
    this.tvSearching = true;
    console.log('tv', title);
    window.setTimeout(() => {
      this.tvSearching = false;
      this.tvResults = [];
    }, 1500);
  };

  localServices.getDrives().then(drives => {
    this.availableDrives.splice(0, this.availableDrives.length, ...drives);
    return localServices.getSelectedDrive();
  }).then(selectedDrive => {
    this.selectedDrive = selectedDrive;
  });

  localServices.getPresets().then(presets => {
    this.availablePresets.splice(0, this.availablePresets.length, ...presets);
    this.selectedPreset = this.availablePresets.length ? this.availablePresets[this.availablePresets.length - 1] : '';
  });

  localServices.tv.login()
    .then(
      () => console.log('Successfully logged in'),
      err => console.error('tv.login error', err)
    );
}
handbrakeController.$inject = ['localServices'];

angular.module('disc-ripper', [])
  .service('localServices', localServices)
  .controller('handbrakeController', handbrakeController)
  .filter('duration', durationFilter);