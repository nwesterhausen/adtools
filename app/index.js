// Require Dependencies
const path = require('path');
const { remote } = require('electron');
const ProgressBar = require('electron-progressbar');
const Constants = require('./constants');
const powershell = require('node-powershell');
const { waterfall } = require('async');
const $ = require('jquery');
const logger = require('electron-log');

// Static HTML for Inclusion
const primeBadge =
  ' <span class="badge badge-secondary">Primary Address</span>';

// Set log details
logger.transports.file.level = 'info';
logger.transports.console.level = false;
logger.transports.mainConsole.level = false;

// Establish powershell instance
const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});
// Set up PS commands to use
const getInfo = new powershell.PSCommand(
  path.join(remote.getGlobal('scripts').path, 'Get-AD-Info')
);
const getUsers = new powershell.PSCommand(
  path.join(remote.getGlobal('scripts').path, 'Load-User-List')
);

var pbar = new ProgressBar({
  title: 'Establishing Connection to Active Directory',
  text: 'Connecting...',
  detail: '',
  browserWindow: {
    webPreferences: {
      nodeIntegration: true
    }
  },
  remoteWindow: remote.BrowserWindow
});
pbar
  .on('completed', function() {
    logger.info(`ProgressBar finished.`);
    pbar.text = 'Connected';
    pbar.detail = 'Active Directory connection established.';
  })
  .on('aborted', function(value) {
    process.quit();
  });
// Waterfall through the template loads because we can't populate the page until
// the pages all exist!
waterfall(
  [
    function(callback) {
      // Load Domain Info Page
      getTemplate(path.join(__dirname, 'templates/domainInfo.html')).then(
        val => {
          $('#main').html(val);
          callback(null);
        }
      );
    },
    function(callback) {
      // Load New User Page
      getTemplate(path.join(__dirname, 'templates/newUser.html')).then(val => {
        $('#newuser').html(val);
        callback(null);
      });
    },
    function(callback) {
      // Load User List Page
      getTemplate(path.join(__dirname, 'templates/userList.html')).then(val => {
        $('#userlist').html(val);
        callback(null);
      });
    },
    function(callback) {
      // Load edit User Page
      getTemplate(path.join(__dirname, 'templates/userDetails.html')).then(
        val => {
          $('#user').html(val);
          callback(null);
        }
      );
    },
    function(callback) {
      // Load settings Page
      getTemplate(path.join(__dirname, 'templates/settings.html')).then(val => {
        $('#settings').html(val);
        callback(null);
      });
    }
  ],
  function(err, result) {
    if (err) logger.error(err);
    else logger.info('Loaded template files');
    registerHandlers(); // establish interactivity now that page is loaded
    establishConnectionAndStart(pbar); // continue loading info
  }
);

function getTemplate(filepath) {
  return fetch(filepath)
    .then(response => {
      return response.text();
    })
    .then(txt => {
      let html = new DOMParser().parseFromString(txt, 'text/html');
      return html.querySelector('template').content;
    });
}

function establishConnectionAndStart(progressbar) {
  // check for existing local storage
  if (!sessionStorage.getItem(Constants.DOMAIN.NAME)) {
    populateStorage();

    // Synchronously and in order go through the commands.
    waterfall(
      [
        function(callback) {
          // Check for basic domain info
          ps.addCommand(getInfo);
          ps.invoke().then(output => {
            let data = JSON.parse(output);
            logger.debug('getInfo', output);
            setDomainInfo(data);
            callback(null);
          });
          pbar.detail = 'Loading basic Domain information';
        },
        function(callback) {
          // Get list of AD-Users
          ps.addCommand(getUsers);
          ps.invoke().then(output => {
            let data = JSON.parse(output);
            sessionStorage.setItem(Constants.USERSLIST, JSON.stringify(data));
            logger.debug('getUsers', output);
            callback(null);
          });
          pbar.detail = 'Loading basic AD-User details.';
        },
        function(callback) {
          progressbar.setCompleted();
          callback(null, 'done');
        }
      ],
      function(err, result) {
        if (err) logger.error(err);
        logger.info('Series of AD Connections Done', result);
        updateDomainInfoFromStorage();
        updateUserListTableFromsessionStorage();
      }
    );
  } else {
    logger.info('Using cached store of data.');
    logger.info('Domain Name', sessionStorage.getItem(Constants.DOMAIN.NAME));
    pbar.detail = 'Using the local cache of AD data';
    pbar.text = 'Local Cache Available';
    pbar.setCompleted();
    updateDomainInfoFromStorage();
    updateUserListTableFromsessionStorage();
  }
}

function populateStorage() {
  // Populate Get-ADDomain Values
  sessionStorage.setItem(Constants.DOMAIN.ALLOWED_DNS_SUFFIXES, '[]');
  sessionStorage.setItem(Constants.DOMAIN.CHILD_DOMAINS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.COMPUTERS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DNS_ROOT, '');
  sessionStorage.setItem(Constants.DOMAIN.DELETED_OBJECTS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DISTINGUISHED_NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_MODE, '');
  sessionStorage.setItem(Constants.DOMAIN.DOMAIN_SID, '{}');
  sessionStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    ''
  );
  sessionStorage.setItem(Constants.DOMAIN.FOREST, '');
  sessionStorage.setItem(Constants.DOMAIN.INFRASTRUCTURE_MASTER, '');
  sessionStorage.setItem(Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL, '');
  sessionStorage.setItem(Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.LOST_AND_FOUND_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.MANAGED_BY, '');
  sessionStorage.setItem(Constants.DOMAIN.NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.NET_BIOS_NAME, '');
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, '');
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_GUID, '');
  sessionStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, '');
  sessionStorage.setItem(Constants.DOMAIN.PARENT_DOMAIN, '');
  sessionStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    ''
  );
  sessionStorage.setItem(Constants.DOMAIN.QUOTAS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.RID_MASTER, '');
  sessionStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    '[]'
  );
  sessionStorage.setItem(Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS, '[]');
  sessionStorage.setItem(Constants.DOMAIN.SUBORDINATE_REFERENCES, '[]');
  sessionStorage.setItem(Constants.DOMAIN.SYSTEMS_CONTAINER, '');
  sessionStorage.setItem(Constants.DOMAIN.USERS_CONTAINER, '');
  // Set other big values
  sessionStorage.setItem(Constants.USERSLIST, '[]');
  sessionStorage.setItem(Constants.COMPUTERSLIST, '[]');
}

function registerHandlers() {
  // EDIT USER PAGE
  $('#loadingBar').hide();
  $('#detailsTabs').hide();
  $('#userHeader').hide();
  $('#grouptabtoggle').prop('disabled', true);

  $('#userLookup').click(loadUserDetails);
  $('#enableEditBtn').click(enabledBasicInfoEditing);
  $('#cancelEditBtn').click(cancelBasicInfoEditing);
  $('#mldbtnSelectResult').click(chooseResult);
  //
  $('#commitPrimary').click(commitProxyAddressChange);
  $('#changePrimary').click(() => {
    $('#primaryAddressModal').modal();
  });
  $('#mdlbtnSetPrimary').click(updateProxyAddressList);
  // NEW USER PAGE
  $('#uGivenName').change(updateDirectoryName);
  $('#uSurname').change(updateDirectoryName);
}

function setDomainInfo(domainJSON) {
  sessionStorage.setItem(
    Constants.DOMAIN.ALLOWED_DNS_SUFFIXES,
    JSON.stringify(domainJSON.AllowedDNSSuffixes)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.CHILD_DOMAINS,
    JSON.stringify(domainJSON.ChildDomains)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.COMPUTERS_CONTAINER,
    domainJSON.ComputersContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.DNS_ROOT, domainJSON.DNSRoot);
  sessionStorage.setItem(
    Constants.DOMAIN.DELETED_OBJECTS_CONTAINER,
    domainJSON.DeletedObjectsContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DISTINGUISHED_NAME,
    domainJSON.DistinguishedName
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER,
    domainJSON.DomainControllersContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_MODE,
    Constants.DOMAIN_MODE_ENUM[domainJSON.DomainMode]
  );
  sessionStorage.setItem(
    Constants.DOMAIN.DOMAIN_SID,
    JSON.stringify(domainJSON.DomainSID)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    domainJSON.ForeignSecurityPrincipalsContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.FOREST, domainJSON.Forest);
  sessionStorage.setItem(
    Constants.DOMAIN.INFRASTRUCTURE_MASTER,
    domainJSON.InfrastructureMaster
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL,
    domainJSON.LastLogonReplicationInterval
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS,
    JSON.stringify(domainJSON.LinkedGroupPolicyObjects)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.LOST_AND_FOUND_CONTAINER,
    domainJSON.LostAndFoundContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.MANAGED_BY, domainJSON.ManagedBy);
  sessionStorage.setItem(Constants.DOMAIN.NAME, domainJSON.Name);
  sessionStorage.setItem(
    Constants.DOMAIN.NET_BIOS_NAME,
    domainJSON.NetBIOSName
  );
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, domainJSON.ObjectClass);
  sessionStorage.setItem(Constants.DOMAIN.OBJECT_GUID, domainJSON.objectGUID);
  sessionStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, domainJSON.PDCEmulator);
  sessionStorage.setItem(
    Constants.DOMAIN.PARENT_DOMAIN,
    domainJSON.ParentDomain
  );
  sessionStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    domainJSON.PublicKeyRequiredPasswordRolling
  );
  sessionStorage.setItem(
    Constants.DOMAIN.QUOTAS_CONTAINER,
    domainJSON.QuotasContainer
  );
  sessionStorage.setItem(Constants.DOMAIN.RID_MASTER, domainJSON.RIDMaster);
  sessionStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReadOnlyReplicaDirectoryServers)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReplicaDirectoryServers)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.SUBORDINATE_REFERENCES,
    JSON.stringify(domainJSON.SubordinateReferences)
  );
  sessionStorage.setItem(
    Constants.DOMAIN.SYSTEMS_CONTAINER,
    domainJSON.SystemsContainer
  );
  sessionStorage.setItem(
    Constants.DOMAIN.USERS_CONTAINER,
    domainJSON.UsersContainer
  );
}

function updateDomainInfoFromStorage() {
  $('#adName').text(sessionStorage.getItem(Constants.DOMAIN.NAME));
  $('#adDNSRoot').text(sessionStorage.getItem(Constants.DOMAIN.DNS_ROOT));
  $('#adForest').text(sessionStorage.getItem(Constants.DOMAIN.FOREST));
  $('#adDomainControllers').html(
    JSON.parse(
      sessionStorage.getItem(Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS)
    ).join('<br>')
  );
  $('#adDomainMode').text(sessionStorage.getItem(Constants.DOMAIN.DOMAIN_MODE));
  let cds = JSON.parse(sessionStorage.getItem(Constants.DOMAIN.CHILD_DOMAINS));
  $('#adChildDomains').html(cds.length === 0 ? 'None' : cds.join('<br>'));
  logger.info('updating general domain info from storage.');
}

function updateUserListTableFromsessionStorage() {
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
  let data = JSON.parse(sessionStorage.getItem(Constants.USERSLIST));
  $('#userListTable').html(buildTable(columns, data));
}
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
    // if (gotnull) console.log(`Discarded ${datum.SamAccountName}`, datum);
  }
  tb += '</tbody>';
  return tb;
}

// EDIT USER FUNCTIONS

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

  $('#basicinfoform').prop('disabled', true);
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

// NEW USER FUNCTIONS

function updateDirectoryName() {
  $('#uDirectoryName').val(
    ($('#uGivenName').val()[0] + $('#uSurname').val()).toLowerCase() +
      '@ntsupply.com'
  );
}
