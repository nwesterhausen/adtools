// This file is required by the users.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');
const dt = require('datatables.net');
const dtbs = require('datatables.net-bs4')(window, $);

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

$('#loadingBar').hide();
$('#detailsTabs').hide();

$('#userLookup').click(loadUserDetails);

const redEx = 'No';
const greenCheck = 'Yes';

function loadUserDetails() {
  let user = $('#userName').val() || 'nwesterhausen';

  let loadUser = new powershell.PSCommand('./Load-AD-User').addParameter({
    username: user
  });

  ps.addCommand(loadUser);

  // Pull the Trigger
  ps.invoke()
    .then(output => {
      $('#loadingBar').hide();
      $('#detailsTabs').show();
      console.log('Response from Powershell command.');
      let data = JSON.parse(output);
      console.log(data);

      $('#uGivenName').val(data.GivenName);
      $('#uDepartment').val(data.Department);
      $('#uSurname').val(data.Surname);
      $('#uDescription').val(data.Description);
      $('#uCompany').val(data.Company);
      $('#uSamAccountName').val(data.SamAccountName);

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
  $('#detailsTabs').hide();
}
