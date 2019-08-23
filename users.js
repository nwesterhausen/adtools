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

const greenCheckmark =
  '<span class="mdi mdi-checkbox-marked-circle-outline text-success"></span>';
const redEx = '<span class="mdi mdi-checkbox-blank-circle-outline"></span>';

$('#loadingBar').hide();
$('#detailsTabs').hide();

$('#userLookup').click(loadUserDetails);

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

      let proxyAddresses = [];
      data.proxyAddresses.forEach(value => {
        let address = value.split(':')[1];
        let isprime = value.split(':')[0] === 'SMTP';
        proxyAddresses.push({
          isprimary: isprime,
          address: address
        });
        $('#outputTable tbody').append(
          `<tr><td>${address}</td><td>${
            isprime ? greenCheckmark : redEx
          }</td></tr>`
        );
        if (value.split(':')[0] === 'SMTP')
          $('#primaryAddress').text(value.split(':')[1]);
      });
      $('#outputTable').data({ proxyAddresses: proxyAddresses });
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });

  console.log('Invoked Powershell Command.');
  $('#loadingBar').show();
  $('#detailsTabs').hide();
}
