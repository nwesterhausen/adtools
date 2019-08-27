// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});
