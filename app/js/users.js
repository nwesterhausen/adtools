// This file is required by the users.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');

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
$('#mldbtnSelectResult').click(chooseResult);

function loadUserDetails() {
  resetPage();
  let user = $('#userName').val() || 'nwesterhausen';

  let loadUser = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-User')
  ).addParameter({
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

      // It's possible that the data returned is a list instead of a single
      // account. So we should check if we got a list back or not.
      if (Array.isArray(data)) {
        updateResultsChoiceModal(data);
        $('#multipleResultsModal').modal();
      } else {
        updatePageWithUserInfo(data);
      }
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });

  console.log('Invoked Powershell Command.');
  $('#loadingBar').show();
  $('#detailsTabs').hide();
}

function chooseResult() {
  updatePageWithUserInfo(JSON.parse($('#selectResultForm').val()));
  $('#multipleResultsModal').modal('hide');
}

function updateResultsChoiceModal(resultList) {
  for (let i = 0; i < resultList.length; i++) {
    let r = resultList[i];
    console.log(r.Name, r.SamAccountName);
    $('#selectResultForm').append(
      `<option value='${JSON.stringify(r)}'>${r.Name} (${
        r.SamAccountName
      })</select>`
    );
  }
}

function resetPage() {
  $('#grouplist').html('');
  $('#selectResultForm').html('');
  $('#proxyTable').html('');
  $('#selectNewPrimaryAddress').html('');
}

function updatePageWithUserInfo(data) {
  loadGroupMembership(data.SamAccountName);

  saveData(data);

  $('#uGivenName').val(data.GivenName);
  $('#uDepartment').val(data.Department);
  $('#uSurname').val(data.Surname);
  $('#uDescription').val(data.Description);
  $('#uCompany').val(data.Company);

  $('#uSamAccountName').text(data.SamAccountName);

  $('#userDisplayname').text(data.DisplayName);
  $('#userDisplayname').attr('data-guid', data.ObjectGUID);
  $('#primaryLabel').show();
  $('#addresslistLabel').show();

  data.proxyAddresses.forEach(value => {
    let address = value.split(':')[1];
    let isprime = value.split(':')[0] === 'SMTP';

    $('#proxyTable').append(
      `<li class="list-group-item" data-value="${value}" ${
        isprime ? 'active' : ''
      }>${address}${isprime ? primeBadge : ''}</li>`
    );
    if (isprime) {
      $('#modalCurrPrim').text(address);
    }
    $('#selectNewPrimaryAddress').append(
      `<option ${isprime ? 'selected' : ''}>${address}</option>`
    );
  });
}

function loadGroupMembership(user) {
  let loadGroups = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-UserGroupMembership')
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
        $('#grouplist').append(
          `<li class='list-group-item'>${value.name}</li>`
        );
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
