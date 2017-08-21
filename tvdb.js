'use strict';
const path = require('path');
const querystring = require('querystring');
const request = require('request');
const settings = require('./settings');
const moment = require('moment');

/**
 * @typedef EpisodeInfo
 * @prop {number} absoluteNumber - the 1-based index of the episode within the series
 * @prop {number} airedEpisodeNumber - the 1-based index of when the episode was aired within the series
 * @prop {number} airedSeason - the season that contained this episode
 * @prop {number} dvdEpisodeNumber - the number of this episode on the DVDs
 * @prop {number} dvdSeason - the DVD season that contained this episode
 * @prop {string} episodeName - the name of the episode
 * @prop {string} firstAired - when the episode first aired
 * @prop {number} id - the id of this episode
 * @prop {number} lastUpdated - the Date this episode was last updated
 * @prop {string} overview - the episode summary
 */


/**
 * Perform a request
 * @param {object} options - the request options, 'url' is required
 * @param {string} [bearer] - the bearer authorization token
 * @param {number} [expectedStatus] - the expected status code, defaults to 200
 */
function doRequest(options, bearer, expectedStatus){
  if(!expectedStatus){
    expectedStatus = 200;
  }
  if(!options || !options.url){
    return Promise.reject('You must supply an options object with URL.');
  }
  let requestSettings = {
    method: 'GET',
    followAllRedirects: true,
    json: true
  };
  for(var key in options){
    requestSettings[key] = options[key];
  }
  if(bearer){
    requestSettings.auth = { bearer: bearer};
  }
  return new Promise((resolve, reject) => {
    request(requestSettings, (err, resp, body) => {
      if(err){
        reject(err);
      } else {
        if(resp.statusCode === expectedStatus){
          resolve(body);
        } else {
          reject(body);
        }
      }
    });
  });
}

/**
 * Perform a GET request against the given url.
 * @param {string} url - the url to request
 * @param {string} [bearer] - the bearer authorization token
 * @param {object} [urlParams] - the url parameters hash to add to the url
 */
function get(url, bearer, urlParams){
  if(urlParams){
    let separator = url.indexOf('?') < 0 ? '?' : '&';
    if(typeof urlParams === 'string')
    {
      url = url + separator + urlParams;
    } else {
      url = url + separator + querystring.stringify(urlParams);
    }
  }
  return doRequest({
    url: url
  }, bearer);
}

/**
 * Perform a POST request against the given url.
 * @param {string} url - the url to request
 * @param {string} bearer - the bearer authorization token
 * @param {object} body - the body to serialize to JSON
 */
function post(url, bearer, body){
  return doRequest({
    url: url,
    method: 'POST',
    body: body
  }, bearer);
}

/**
 * Create a new client to access the TvDB
 * @class
 */
function TvDbClient(){
  let currentKey = null;
  let token = null;
  let refreshAfter = moment().add(-1, 'hours');
  let loginAfter = moment(refreshAfter);

  /**
   * Login to the TVDB API and obtain a bearer authorization token
   * @param {string} [alternativeApiKey] - an alternative API key to login with
   * @returns {Promise<boolean>} - true if the login was successful
   */
  let login = (alternativeApiKey) => {
    let loginPath = path.join(settings.tvDbBaseUrl, 'login');
    currentKey = alternativeApiKey || currentKey || settings.tvDbApiKey;
    return post(loginPath, null, { apikey: currentKey })
      .then(response => {
        token = response.token;
        refreshAfter = moment().add(20, 'hours');
        loginAfter = moment().add(24, 'hours');
        return true;
      });
  };

  /**
   * Refreshes the TVDB API bearer authorization token
   * @returns {Promise<boolean>} - returns true if client is currently authorized
   */
  let refreshKey = () => {
    if(token && moment() < loginAfter){
      let refreshTokenUrl = path.join(settings.tvDbBaseUrl, 'refresh_token');
      return get(refreshTokenUrl, token)
        .then(response => {
          token = response.token;
          refreshAfter = moment().add(20, 'hours');
          loginAfter = moment().add(24, 'hours');
          return true;
        }).catch(err => {
          console.error('[tvdb] Error refreshing token:',err);
          return login();
        });
    } else {
      return login();
    }
  };

  /**
   * Determine if the client needs to refresh its TvDB token
   * @returns {boolean} - true if the client needs to be refreshed
   */
  let needsRefresh = () => {
    return !token || moment() > refreshAfter;
  }

  /**
   * Ensure that the client is logged in
   * @returns {Promise}
   */
  let ensureLogin = () => {
    let loggedIn = needsRefresh() ? refreshKey() : Promise.resolve(true);
    return loggedIn.then(isLoggedIn => {
      if(!isLoggedIn){
        return Promise.reject('[tvdb] Not logged in');
      }
    });        
  }

  /**
   * Search for a tv series
   * @param {string} name - the name of the series to search
   */
  let searchSeries = (name) => {
    if(!name || name.trim()===''){
      return Promise.reject('name is required');
    }
    return ensureLogin().then(() => {
      let searchUrl = path.join(settings.tvDbBaseUrl, 'search/series');
      return get(searchUrl, token, {
        name: name
      })
    });
  };

  /**
   * Get the list of seasons in a tv series
   * @param {number} seriesId - the series ID to retrieve
   * @returns {Promise<string[]>} - the seasons in this series
   */
  let getSeasons = (seriesId) => {
    if(!seriesId){
      return Promise.reject('seriesId is required');
    }
    return ensureLogin().then(() => {
      let summaryUrl = path.join(settings.tvDbBaseUrl, `series/${seriesId}/episodes/summary`);
      return get(summaryUrl, token)
        .then(summaryData => summaryData.airedSeasons || []);
    });
  };

  /**
   * Retrieve all the paginated results for the given URL and return the array
   * @param {string} baseUrl - the base page URL
   * @returns {Promise<Array>} - the result dataset
   */
  let fetchAllPages = (baseUrl) => {
    let results = [];
    let fetchPage = (pageNo) => {
      let queryParams = { page: pageNo };
      return get(baseUrl, token, queryParams)
        .then(response => {
          Array.prototype.push.apply(results, response.data);
          if(response.links && response.links.next) {
            return fetchPage(response.links.next);
          }
        });
    };

    return fetchPage(1).then(() => results);
  };

  /**
   * Retrieve all the episodes in a series
   * @param {number} seriesId - the series id
   * @returns {Promise<EpisodeInfo[]>} - the episodes
   */
  let getAllEpisodes = (seriesId) => {
    if(!seriesId){
      return Promise.reject('seriesId is required');
    }
    return ensureLogin().then(() => {
      let seriesUrl = path.join(settings.tvDbBaseUrl, `series/${seriesId}/episodes`);
      return fetchAllPages(seriesUrl);
    });
  };

  /**
   * Retrieve all the episodes in a season for a series
   * @param {(number|string)} seriesId - the series id
   * @param {(number|string)} seasonNumber - the season number
   * @returns {Promise<EpisodeInfo[]>} - the episodes
   */
  let getSeasonEpisdes = (seriesId, seasonNumber) => {
    if(!seriesId){
      return Promise.reject('seriesId is required');
    }
    if(!seasonNumber){
      return Promise.reject('seasonNumber is required');
    }
    return ensureLogin().then(() => {
      let seasonUrl = path.join(settings.tvDbBaseUrl, `series/${seriesId}/episodes/query?airedSeason=${seasonNumber}`);
      return fetchAllPages(seasonUrl);
    });
  };

  this.login = login;
  this.searchSeries = searchSeries;
  this.getSeasons = getSeasons;
  this.getSeasonEpisodes = getSeasonEpisdes;
  this.getAllEpisodes = getAllEpisodes;
}

module.exports = new TvDbClient();