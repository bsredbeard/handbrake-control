'use strict'
const express = require('express');
const app = require('../app');

app.get('/', (req, res) => {
  res.render('index');
});

const apiRouter = new express.Router();
require('./api')(apiRouter);
app.use('/api', apiRouter);