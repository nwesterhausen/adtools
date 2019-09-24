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
const pscmd = require('./powershell-commander');
const $ = require('jquery');
const logger = require('electron-log');

// Static HTML for Inclusion
const primeBadge =
  ' <span class="badge badge-secondary">Primary Address</span>';

// EDIT USER FUNCTIONS
function loadUserDetailsEnter(event) {
  // check if key was enterkey
  if (event.which === 13) loadUserDetails();
}

async function loadUserDetails() {
  resetPage();
  let user = $('#userName').val() || 'nwesterhausen';

  $('#loadingBar').show();
  $('#detailsTabs').hide();
  let data = await pscmd.loadAdUser(user);

  // It's possible that the data returned is a list instead of a single
  // account. So we should check if we got a list back or not.
  if (Array.isArray(data)) {
    updateResultsChoiceModal(data);
    $('#multipleResultsModal').modal();
  } else {
    updatePageWithUserInfo(data);
  }
  $('#loadingBar').hide();
  $('#detailsTabs').show();
  $('#userHeader').show();
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

async function loadGroupMembership(user) {
  let data = await pscmd.loadUserGroupMembership(user);
  data.forEach(value => {
    $('#grouplist').append(`<li class='list-group-item'>${value.name}</li>`);
  });

  $('#grouptabtoggle').prop('disabled', false);
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
  pscmd.saveUserProxyAddresses(userid, newValue);
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
