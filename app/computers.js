// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');

const dt = require('datatables.net')();
const dtbs = require('datatables.net-bs4')(window, $);

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

ps.addCommand(
  path.join(remote.getGlobal('scripts').path, 'Load-Computers.ps1')
);

ps.invoke().then(output => {
  console.log(output);
  let data = JSON.parse(output);
  console.log(data);

  // generate DataTables columns dynamically
  let columns = [];
  Object.keys(data[0]).forEach(key => columns.push({ title: key, data: key }));

  // Create DataTable
  $('#output').DataTable({
    data: data,
    columns: columns
  });
});
