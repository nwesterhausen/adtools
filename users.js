// This file is required by the users.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

const greenCheckmark =
  '<div class="d-flex justify-content-center"><span class="mdi mdi-checkbox-marked-circle-outline text-success "></span></div>';
const redEx =
  '<div class="d-flex justify-content-center"><span class="mdi mdi-checkbox-blank-circle-outline"></span></div>';

$('#loadingBar').hide();
$('#detailsTabs').hide();

$('#userLookup').click(loadUserDetails);
$('#enableEditBtn').click(enabledBasicInfoEditing);
$('#cancelEditBtn').click(cancelBasicInfoEditing);

function loadUserDetails() {
  $('#outputTable tbody').html('');
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

      saveData(data);

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
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });

  console.log('Invoked Powershell Command.');
  $('#loadingBar').show();
  $('#detailsTabs').hide();
}

function enabledBasicInfoEditing() {
  $('#basicinfotbl tbody td input').removeAttr('readonly');
  $('#enableEditBtn').addClass('disabled');
  $('#enableEditBtn').attr('disabled');
  $('#saveEditBtn').removeClass('disabled');
  $('#saveEditBtn').removeAttr('disabled');
  $('#cancelEditBtn').removeClass('disabled');
  $('#cancelEditBtn').removeAttr('disabled');
}

function saveData(jsonData) {
  localStorage.setItem('userData', JSON.stringify(jsonData));
}

function cancelBasicInfoEditing() {
  let data = JSON.parse(localStorage.getItem('userData'));

  $('#uGivenName').val(data.GivenName);
  $('#uDepartment').val(data.Department);
  $('#uSurname').val(data.Surname);
  $('#uDescription').val(data.Description);
  $('#uCompany').val(data.Company);
  $('#uSamAccountName').val(data.SamAccountName);

  $('#basicinfotbl tbody td input').attr('readonly');
  $('#enableEditBtn').removeClass('disabled');
  $('#enableEditBtn').removeAttr('disabled');
  $('#saveEditBtn').addClass('disabled');
  $('#saveEditBtn').attr('disabled');
  $('#cancelEditBtn').addClass('disabled');
  $('#cancelEditBtn').attr('disabled');
}
