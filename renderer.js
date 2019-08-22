// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const dt = require('datatables.net');
const dtbs = require('datatables.net-bs4')(window, $);

// Test jquery
$(document).ready(() => console.log('Page is loaded'));

// Test powershell
$('#getDisk').click(() => {
  // Create the PS Instance
  let ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true
  });

  // Load the gun
  let computer = $('#computerName').val() || 'localhost';
  ps.addCommand('./Get-Drives', [{ ComputerName: computer }]);

  // Pull the Trigger
  ps.invoke()
    .then(output => {
      console.log(output);
      let data = JSON.parse(output);
      console.log(data);

      // generate DataTables columns dynamically
      let columns = [];
      Object.keys(data[0]).forEach(key =>
        columns.push({ title: key, data: key })
      );

      // Create DataTable
      $('#output').DataTable({
        data: data,
        columns: columns,
        paging: false,
        searching: false,
        info: false,
        destroy: true
      });
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });
});
