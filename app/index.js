// Require Dependencies
const path = require('path');
const { remote, ipcRenderer } = require('electron');
const ProgressBar = require('electron-progressbar');
const Constants = require('./constants');
const StorageUtil = require('./js/storage');
const { waterfall } = require('async');
const $ = require('jquery');
const edituser = require('./js/editUser');
const pscmd = require('./js/powershell-commander');
const logger = {
  info: function(msg) {
    ipcRenderer.sendSync('log', { sev: 'info', msg: msg });
  },
  warning: function(msg) {
    ipcRenderer.sendSync('log', { sev: 'warning', msg: msg });
  },
  error: function(msg) {
    ipcRenderer.sendSync('log', { sev: 'error', msg: msg });
  },
  debug: function(msg) {
    ipcRenderer.sendSync('log', { sev: 'debug', msg: msg });
  }
};
logger.info('test');

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
    StorageUtil.populateStorage();

    // Synchronously and in order go through the commands.
    waterfall(
      [
        function(callback) {
          pbar.detail = 'Loading basic Domain information';
          // Check for basic domain info
          pscmd.getBasicDomainInfo().then(data => {
            StorageUtil.setDomainInfo(data);
            callback(null);
          });
        },
        function(callback) {
          pbar.detail = 'Loading basic AD-User details.';
          // Get list of AD-Users
          pscmd.getBasicUserInfo().then(data => {
            sessionStorage.setItem(Constants.USERSLIST, JSON.stringify(data));
            callback(null);
          });
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

function registerHandlers() {
  // EDIT USER PAGE
  $('#loadingBar').hide();
  $('#detailsTabs').hide();
  $('#userHeader').hide();
  $('#grouptabtoggle').prop('disabled', true);
  $('#basicinfoform input').prop('disabled', true);
  $('#basicinfoform select').prop('disabled', true);

  $('#userName').keypress(edituser.loadUserDetailsEnter);
  $('#userLookup').click(edituser.loadUserDetails);
  $('#enableEditBtn').click(edituser.enabledBasicInfoEditing);
  $('#cancelEditBtn').click(edituser.cancelBasicInfoEditing);
  $('#mldbtnSelectResult').click(edituser.chooseResult);
  //
  $('#commitPrimary').click(edituser.commitProxyAddressChange);
  $('#changePrimary').click(() => {
    $('#primaryAddressModal').modal();
  });
  $('#mdlbtnSetPrimary').click(edituser.updateProxyAddressList);
  // NEW USER PAGE
  $('#uGivenName').change(updateDirectoryName);
  $('#uSurname').change(updateDirectoryName);
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

// NEW USER FUNCTIONS

function updateDirectoryName() {
  $('#uDirectoryName').val(
    ($('#uGivenName').val()[0] + $('#uSurname').val()).toLowerCase() +
      '@ntsupply.com'
  );
}
