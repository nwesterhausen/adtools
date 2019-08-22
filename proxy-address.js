// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const dt = require('datatables.net');
const dtbs = require('datatables.net-bs4')(window, $);

$('#primaryLabel').hide();
$('#addresslistLabel').hide();

$('#getProxyAddresses').click(() => {
  // Create the PS Instance
  let ps = new powershell({
    executionPolicy: 'Bypass',
    noProfile: true
  });

  // Load the gun
  let user = $('#userName').val() || 'nwesterhausen';
  ps.addCommand('./Load-AD-User', [{ username: user }]);

  // Pull the Trigger
  ps.invoke()
    .then(output => {
      let data = JSON.parse(output);
      console.log(data);

      $('#userDisplayname').text(data.DisplayName);
      $('#primaryLabel').show();
      $('#addresslistLabel').show();

      let proxyAddresses = data.proxyAddresses;

      // generate DataTables columns dynamically
      let columns = [
        { title: 'Primary Address', data: 'isprimary' },
        { title: 'Address', data: 'address' },
        {
          title: 'Actions',
          data: null,
          defaultContent:
            '<button id="edit" class="btn btn-primary">Edit</button> <button id="remove" class="btn btn-danger">Delete</button>'
        }
      ];

      let cleanedData = [];
      proxyAddresses.forEach(value => {
        cleanedData.push({
          isprimary: value.split(':')[0] === 'SMTP',
          address: value.split(':')[1]
        });
        if (value.split(':')[0] === 'SMTP')
          $('#primaryAddress').text(value.split(':')[1]);
      });

      // Create DataTable
      $('#outputTable').DataTable({
        data: cleanedData,
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
