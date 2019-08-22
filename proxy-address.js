// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const dt = require('datatables.net');
const dtbs = require('datatables.net-bs4')(window, $);

const greenCheckmark =
  '<span class="mdi mdi-checkbox-marked-circle-outline text-success"></span>';
const redEx = '<span class="mdi mdi-checkbox-blank-circle-outline"></span>';

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

$('#primaryLabel').hide();
$('#addresslistLabel').hide();
$('#loadingBar').hide();
$('#fullOutput').hide();

$('#getProxyAddresses').click(() => {
  // Load the gun
  let user = $('#userName').val() || 'nwesterhausen';

  let loadUser = new powershell.PSCommand('./Load-AD-User').addParameter({
    username: user
  });

  ps.addCommand(loadUser);

  // Pull the Trigger
  ps.invoke()
    .then(output => {
      $('#loadingBar').hide();
      $('#fullOutput').show();
      console.log('Response from Powershell command.');
      let data = JSON.parse(output);
      console.log(data);

      $('#userDisplayname').text(data.DisplayName);
      $('#primaryLabel').show();
      $('#addresslistLabel').show();

      let proxyAddresses = data.proxyAddresses;

      // generate DataTables columns dynamically
      let columnDefs = [
        {
          targets: 0,
          title: 'Primary Address',
          data: null,
          defaultContent: redEx
        },
        {
          targets: 1,
          title: 'Address',
          data: 'address'
        },
        {
          targets: 2,
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
        columnDefs: columnDefs,
        paging: false,
        searching: false,
        info: false,
        destroy: true
      });
      return false;
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    })
    .finally(() => {
      return false;
    });

  console.log('Invoked Powershell Command.');
  $('#loadingBar').show();
  $('#fullOutput').hide();
});
