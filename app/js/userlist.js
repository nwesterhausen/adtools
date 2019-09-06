const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

ps.addCommand(path.join(remote.getGlobal('scripts').path, 'Load-User-List'));

ps.invoke().then(output => {
  let data = JSON.parse(output);
  console.log(data);

  let columns = [
    { title: 'Company', data: 'Company' },
    { title: 'First', data: 'GivenName' },
    { title: 'Last', data: 'Surname' },
    { title: 'Description', data: 'Description' },
    { title: 'Title', data: 'Title' },
    { title: 'Department', data: 'Department' }
    // { title: 'Manager', data: 'Manager' },
    // { title: 'Username', data: 'SamAccountName' }
    // { title: 'GUID', data: 'ObjectGuid' }
  ];

  // Create DataTable
  $('#userListTable').html(buildTable(columns, data));
});

function buildTable(columns, data) {
  let tb = '<thead>';
  for (let col of columns) {
    tb += `<th>${col.title}</th>`;
  }
  tb += '</thead><tbody>';
  for (let datum of data) {
    let gotnull = !datum.Enabled;
    let tr = '<tr>';
    for (let col of columns) {
      gotnull = gotnull | (datum[col.data] === null);
      tr += `<td>${datum[col.data]}</td>`;
    }
    tr += '</tr>';
    if (!gotnull) tb += tr;
    if (gotnull) console.log(`Discarded ${datum.SamAccountName}`, datum);
  }
  tb += '</tbody>';
  return tb;
}
