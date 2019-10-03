// Require Dependencies
const path = require('path');
const { ipcRenderer } = require('electron');
const { waterfall } = require('async');
const $ = require('jquery');

const Constants = require('./constants');
const StorageUtil = require('./js/storage-util');
const edituser = require('./js/editUser');
const settings = require('./js/settings');
const pscmd = require('./js/powershell-commander');
// Helper for sending log messages:
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

// Disable navigation
$('#navPills a').addClass('disabled');

// Using waterfall to chain-add templates (basically so we know that they all
// get added before we continue further.)
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
        settings.populateSettingsPage();
        callback(null);
      });
    }
  ],
  function(err, result) {
    if (err) logger.error(err);
    else logger.info('Loaded template files');
    // Now we can register the handlers for clicks etc.
    registerHandlers();

    establishConnectionAndStart(); // continue loading info
  }
);

/**
 * HTMLstring:getTemplate
 *
 * Function which performs a fetch on an HTML file and returns the HTML
 *
 * @param {path} filepath
 */
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

/**
 * void: establishConnectionAndStart
 *
 * This function checks for existing session storage and if there is none, it
 * creates empty values for the fields we use, then goes through and calls
 * powershell commander to run the basic info gathering scripts, filling them
 * into session storage.progressbar
 *
 * If there already exisits session storage when this function runs, it simply
 * loads values from the session storage instead of getting them again.
 *
 * This function interacts with the progressbar to update it's detail with the
 * current status and to complete it when the process is done.
 *
 * @param {electron-progressbar.ProgressBar} progressbar
 */
function establishConnectionAndStart(forced) {
  const $pbar = $('#connectionProgress');
  $('div', $pbar).show();
  $('div', $pbar).removeClass('bg-success');
  $('div', $pbar).removeClass('bg-warning');
  $('div', $pbar).removeClass('bg-danger');
  $('div', $pbar).addClass('progress-bar-animated');
  $('div', $pbar).addClass('progress-bar-striped');

  $('#adconnectionStatus span').html('');
  // If session storage doesn't have the domain name key, then we assume there
  // is no session storage.
  if (forced || !sessionStorage.getItem(Constants.DOMAIN.NAME)) {
    StorageUtil.populateStorage();

    // Synchronously and in order go through the commands.
    waterfall(
      [
        function(callback) {
          $('div', $pbar).text('Loading basic Domain information');
          $('div', $pbar).css('width', '33%');
          // Check for basic domain info
          pscmd.getBasicDomainInfo().then(data => {
            if (data.hasOwnProperty('errorOccured')) {
              logger.error(data.msg);
              $('div', $pbar).addClass('bg-danger');
              $('div', $pbar).removeClass('progress-bar-animated');
              $('div', $pbar).text(data.msg);
              callback(null, false);
            } else {
              // Save basic domain info to session storage
              StorageUtil.setDomainInfo(data);
              callback(null, true);
            }
          });
        },
        function(adConnection, callback) {
          if (adConnection) {
            $('div', $pbar).text('Loading basic AD-User details.');
            $('div', $pbar).css('width', '67%');
            // Get list of AD-Users
            pscmd.getBasicUserInfo().then(data => {
              // Save list to session storage
              StorageUtil.setUserlistInfo(data);
              callback(null, true);
            });
          } else {
            callback(null, false);
          }
        }
      ],
      function(err, adConnection) {
        if (err) logger.error(err);
        if (adConnection) {
          // Finally, "complete" the progressbar
          $('div', $pbar).text('Succeeded in connecting to Active Directory.');
          // Log when we are done.
          logger.info('Series of AD Connections Done');
          // Update the page with the data we stored in session storage.
          updateDomainInfoFromStorage();
          updateUserListTableFromsessionStorage();
          $('#adconnectionStatus').html(
            '<span class="badge badge-success p-1">Connected</span>'
          );
          $('#refreshAdConnection span').text('Refresh');
          $('div', $pbar).addClass('bg-success');
          finishLoading();
        } else {
          $('#adconnectionStatus').html(
            `<span class="badge badge-danger p-1">Unable to Connect</span>`
          );

          $('#refreshAdConnection span').text('Retry Connection');
          $('#refreshAdConnection i').addClass('mdi-reload');
          $('#refreshAdConnection i').removeClass('mdi-loading');
          $('#refreshAdConnection i').removeClass('mdi-spin');
        }
      }
    );
  } else {
    logger.info('Using cached store of data.');
    logger.info('Domain Name', sessionStorage.getItem(Constants.DOMAIN.NAME));
    $('div', $pbar).text('Using the local cache of AD data');
    updateDomainInfoFromStorage();
    updateUserListTableFromsessionStorage();
    $('#adconnectionStatus').html(
      '<span class="badge badge-warning p-1">Cached</span>'
    );
    $('#refreshAdConnection span').text('Refresh');
    $('div', $pbar).addClass('bg-warning');
    finishLoading();
  }
}

function finishLoading() {
  const $pbar = $('#connectionProgress');

  $('div', $pbar).removeClass('progress-bar-animated');
  $('div', $pbar).removeClass('progress-bar-striped');
  $('div', $pbar).css('width', '100%');

  $('#navPills a').removeClass('disabled');

  $('#domainInfoCards').removeClass('d-none');
  $('#domainInfoCards').addClass('d-flex');

  $('#refreshAdConnection i').addClass('mdi-reload');
  $('#refreshAdConnection i').removeClass('mdi-loading');
  $('#refreshAdConnection i').removeClass('mdi-spin');
  setTimeout(() => {
    $('div', $pbar).fadeOut(250, () => {
      $('div', $pbar).css('width', '0%');
      $('div', $pbar).text('');
    });
  }, 4000);
}

/**
 * void: registerHandlers
 *
 * This function interacts with the page, setting the default visibility state
 * of some items as well as registering onKeypress, onClick, and onChange
 * event handlers for page interactivity.
 */
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
  // Proxy Address Items
  $('#commitPrimary').click(edituser.commitProxyAddressChange);
  $('#changePrimary').click(() => {
    $('#primaryAddressModal').modal();
  });
  $('#mdlbtnSetPrimary').click(edituser.updateProxyAddressList);
  // NEW USER PAGE
  $('#uGivenName').change(updateDirectoryName);
  $('#uSurname').change(updateDirectoryName);
  // SETTINGS PAGE
  $('.addNewItemBtn').click(settings.addListItem);
  // MAIN PAGE
  $('#refreshAdConnection').click(e => {
    $('#refreshAdConnection span').text('Connecting..');
    $('#refreshAdConnection i').removeClass('mdi-reload');
    $('#refreshAdConnection i').addClass('mdi-loading');
    $('#refreshAdConnection i').addClass('mdi-spin');
    establishConnectionAndStart(true);
  });
}

/**
 * void: updateDomainInfoFromStorage
 *
 * This function sets the value of the various basic domain info into the
 * informational cards on the Overview page.
 */
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
  $('#adUserTotal').text(sessionStorage.getItem(Constants.DOMAIN.USER_TOTAL));
  $('#adDisabledUserTotal').text(
    sessionStorage.getItem(Constants.DOMAIN.DISABLED_USER_TOTAL)
  );
  $('#adComputerTotal').text(
    sessionStorage.getItem(Constants.DOMAIN.COMPUTER_TOTAL)
  );
  $('#adDisabledComputerTotal').text(
    sessionStorage.getItem(Constants.DOMAIN.DISABLED_COMPUTER_TOTAL)
  );
  logger.info('Updated general domain info from session storage.');
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
