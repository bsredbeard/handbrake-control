'use strict';
const express = require('express');
const bodyparser = require('body-parser');

const app = express();
// use pug
app.set('view engine', 'pug');

// serve up static files
app.use('/content', express.static('content'));

// parse POST / PUT request bodies
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

module.exports = app;