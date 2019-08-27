// This file is required by the newusers.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');

$('#uGivenName').change(updateDirectoryName);
$('#uSurname').change(updateDirectoryName);

function updateDirectoryName() {
  $('#uDirectoryName').val(
    ($('#uGivenName').val()[0] + $('#uSurname').val()).toLowerCase() +
      '@ntsupply.com'
  );
}
