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

const primeBadge =
  ' <span class="badge badge-secondary">Primary Address</span>';

$('#loadingBar').hide();
$('#detailsTabs').hide();
$('#userHeader').hide();
$('#grouptabtoggle').prop('disabled', true);

$('#userLookup').click(loadUserDetails);
$('#enableEditBtn').click(enabledBasicInfoEditing);
$('#cancelEditBtn').click(cancelBasicInfoEditing);

function loadUserDetails() {
  $('#proxyTable tbody').html('');
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
      $('#userHeader').show();
      console.log(output);
      let data = JSON.parse(output);
      console.log(data);

      loadGroupMembership(data.SamAccountName);

      saveData(data);

      $('#uGivenName').val(data.GivenName);
      $('#uDepartment').val(data.Department);
      $('#uSurname').val(data.Surname);
      $('#uDescription').val(data.Description);
      $('#uCompany').val(data.Company);

      $('#uSamAccountName').text(data.SamAccountName);

      $('#userDisplayname').text(data.DisplayName);
      $('#primaryLabel').show();
      $('#addresslistLabel').show();

      data.proxyAddresses.forEach(value => {
        let address = value.split(':')[1];
        let isprime = value.split(':')[0] === 'SMTP';
        $('#proxyTable tbody').append(
          `<tr ${isprime ? 'class="table-primary"' : ''}><td>${address}${
            isprime ? primeBadge : ''
          }</td></tr>`
        );
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

function loadGroupMembership(user) {
  let loadGroups = new powershell.PSCommand(
    './Load-AD-UserGroupMembership'
  ).addParameter({
    username: user
  });

  ps.addCommand(loadGroups);

  ps.invoke()
    .then(output => {
      console.log(output);
      let data = JSON.parse(output);
      console.log(data);

      data.forEach(value => {
        $('#grouplist').append(`<tr><td>${value.name}</td></tr>`);
      });

      $('#grouptabtoggle').prop('disabled', false);
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });
}

function enabledBasicInfoEditing() {
  $('#basicinfoform').prop('disabled', false);
  $('#enableEditBtn').prop('disabled', true);
  $('#saveEditBtn').prop('disabled', false);
  $('#cancelEditBtn').prop('disabled', false);
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

  $('#basicinfoform').prop('disabled', true);
  $('#enableEditBtn').prop('disabled', false);
  $('#saveEditBtn').prop('disabled', true);
  $('#cancelEditBtn').prop('disabled', true);
}
