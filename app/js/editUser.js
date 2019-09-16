// Exports
module.exports = {
  loadUserDetails,
  loadUserDetailsEnter,
  chooseResult,
  enabledBasicInfoEditing,
  cancelBasicInfoEditing,
  commitProxyAddressChange,
  updateProxyAddressList
};
// Imports
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');
const $ = require('jquery');
const logger = require('electron-log');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

// Static HTML for Inclusion
const primeBadge =
  ' <span class="badge badge-secondary">Primary Address</span>';

// EDIT USER FUNCTIONS
function loadUserDetailsEnter(event) {
  // check if key was enterkey
  if (event.which === 13) loadUserDetails();
}

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
  $('#uTitle').val(data.Title);

  $('#uSamAccountName').text(data.SamAccountName);

  $('#userDisplayname').text(data.DisplayName);
  $('#userDisplayname').attr('data-guid', data.ObjectGUID);
  $('#primaryLabel').show();
  $('#addresslistLabel').show();

  if (data.proxyAddresses) {
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
  $('#basicinfoform input').prop('disabled', false);
  $('#basicinfoform select').prop('disabled', false);
  $('#enableEditBtn').prop('disabled', true);
  $('#saveEditBtn').prop('disabled', false);
  $('#cancelEditBtn').prop('disabled', false);
}

function saveData(jsonData) {
  sessionStorage.setItem('userData', JSON.stringify(jsonData));
}

function cancelBasicInfoEditing() {
  let data = JSON.parse(sessionStorage.getItem('userData'));

  $('#uGivenName').val(data.GivenName);
  $('#uDepartment').val(data.Department);
  $('#uSurname').val(data.Surname);
  $('#uDescription').val(data.Description);
  $('#uCompany').val(data.Company);
  $('#uTitle').val(data.Title);

  $('#basicinfoform input').prop('disabled', true);
  $('#basicinfoform select').prop('disabled', true);
  $('#enableEditBtn').prop('disabled', false);
  $('#saveEditBtn').prop('disabled', true);
  $('#cancelEditBtn').prop('disabled', true);
}
function getProxyAddressValue() {
  let proxyAddresses = [];
  for (let row of $('#proxyTable li')) {
    proxyAddresses.push(row.getAttribute('data-value'));
  }
  return proxyAddresses;
}

function commitProxyAddressChange() {
  let newValue = getProxyAddressValue();
  let userid = $('#userDisplayname').attr('data-guid');
  let commitChange = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Update-User-ProxyAddresses')
  )
    .addParameter({
      userid: userid
    })
    .addParameter({
      proxyAddresses: newValue
    });

  ps.addCommand(commitChange);

  ps.invoke().then(output => {
    console.log(output);
  });
}

function updateProxyAddressList() {
  let newPA = $('#selectNewPrimaryAddress').val();
  for (let row of $('#proxyTable li')) {
    let aval = row.getAttribute('data-value');
    if (aval.startsWith('SMTP:') && aval.indexOf(newPA) === -1) {
      $(row).removeProp('active');
      row.setAttribute('data-value', `smtp:${aval.split(':')[1]}`);
      row.innerHTML = `${aval.split(':')[1]}`;
    } else if (aval.indexOf(newPA) !== -1) {
      $(row).prop('active');
      row.setAttribute('data-value', `SMTP:${newPA}`);
      row.innerHTML = `${newPA} ${primeBadge}`;
    }
  }

  $('#primaryAddressModal').modal('hide');
}
