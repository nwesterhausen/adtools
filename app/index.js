// Require Dependencies
const path = require('path');
const { remote } = require('electron');
const ProgressBar = require('electron-progressbar');
const Constants = require('./js/constants');
const powershell = require('node-powershell');
const { waterfall } = require('async');
const $ = require('jquery');
const bs = require('bootstrap');
const logger = require('electron-log');

// Set log details
logger.transports.file.level = 'info';
logger.transports.console.level = false;
logger.transports.mainConsole.level = false;

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

// Load Domain Info Page
getTemplate(path.join(__dirname, 'templates/domainInfo.html')).then(val => {
  $('#main').html(val);
});
// Load New User Page
getTemplate(path.join(__dirname, 'templates/newUser.html')).then(val => {
  $('#newuser').html(val);
});
// Load User List Page
getTemplate(path.join(__dirname, 'templates/userList.html')).then(val => {
  $('#userlist').html(val);
});
// Load edit User Page
getTemplate(path.join(__dirname, 'templates/userDetails.html')).then(val => {
  $('#user').html(val);
});

var pbar = new ProgressBar({
  title: 'Connecting to Active Directory',
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

establishConnectionAndStart(pbar);

function establishConnectionAndStart(progressbar) {
  // check for existing local storage
  if (!localStorage.getItem(Constants.DOMAIN.NAME)) {
    populateStorage();
  }

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
          localStorage.setItem(Constants.USERSLIST, JSON.stringify(data));
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
      logger.info('waterfall result', result);
      $.getScript('./js/general.js');
      $.getScript('./js/userlist.js');
      $.getScript('./js/newuser.js');
      $.getScript('./js/users.js');
      $.getScript('./js/proxyAddresses.js');
    }
  );
}

function populateStorage() {
  // Populate Get-ADDomain Values
  localStorage.setItem(Constants.DOMAIN.ALLOWED_DNS_SUFFIXES, '[]');
  localStorage.setItem(Constants.DOMAIN.CHILD_DOMAINS, '[]');
  localStorage.setItem(Constants.DOMAIN.COMPUTERS_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.DNS_ROOT, '');
  localStorage.setItem(Constants.DOMAIN.DELETED_OBJECTS_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.DISTINGUISHED_NAME, '');
  localStorage.setItem(Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.DOMAIN_MODE, '');
  localStorage.setItem(Constants.DOMAIN.DOMAIN_SID, '{}');
  localStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    ''
  );
  localStorage.setItem(Constants.DOMAIN.FOREST, '');
  localStorage.setItem(Constants.DOMAIN.INFRASTRUCTURE_MASTER, '');
  localStorage.setItem(Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL, '');
  localStorage.setItem(Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS, '[]');
  localStorage.setItem(Constants.DOMAIN.LOST_AND_FOUND_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.MANAGED_BY, '');
  localStorage.setItem(Constants.DOMAIN.NAME, '');
  localStorage.setItem(Constants.DOMAIN.NET_BIOS_NAME, '');
  localStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, '');
  localStorage.setItem(Constants.DOMAIN.OBJECT_GUID, '');
  localStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, '');
  localStorage.setItem(Constants.DOMAIN.PARENT_DOMAIN, '');
  localStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    ''
  );
  localStorage.setItem(Constants.DOMAIN.QUOTAS_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.RID_MASTER, '');
  localStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    '[]'
  );
  localStorage.setItem(Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS, '[]');
  localStorage.setItem(Constants.DOMAIN.SUBORDINATE_REFERENCES, '[]');
  localStorage.setItem(Constants.DOMAIN.SYSTEMS_CONTAINER, '');
  localStorage.setItem(Constants.DOMAIN.USERS_CONTAINER, '');
  // Set other big values
  localStorage.setItem(Constants.USERSLIST, '[]');
  localStorage.setItem(Constants.COMPUTERSLIST, '[]');
}

function setDomainInfo(domainJSON) {
  localStorage.setItem(
    Constants.DOMAIN.ALLOWED_DNS_SUFFIXES,
    JSON.stringify(domainJSON.AllowedDNSSuffixes)
  );
  localStorage.setItem(
    Constants.DOMAIN.CHILD_DOMAINS,
    JSON.stringify(domainJSON.ChildDomains)
  );
  localStorage.setItem(
    Constants.DOMAIN.COMPUTERS_CONTAINER,
    domainJSON.ComputersContainer
  );
  localStorage.setItem(Constants.DOMAIN.DNS_ROOT, domainJSON.DNSRoot);
  localStorage.setItem(
    Constants.DOMAIN.DELETED_OBJECTS_CONTAINER,
    domainJSON.DeletedObjectsContainer
  );
  localStorage.setItem(
    Constants.DOMAIN.DISTINGUISHED_NAME,
    domainJSON.DistinguishedName
  );
  localStorage.setItem(
    Constants.DOMAIN.DOMAIN_CONTROLLERS_CONTAINER,
    domainJSON.DomainControllersContainer
  );
  localStorage.setItem(
    Constants.DOMAIN.DOMAIN_MODE,
    Constants.DOMAIN_MODE_ENUM[domainJSON.DomainMode]
  );
  localStorage.setItem(
    Constants.DOMAIN.DOMAIN_SID,
    JSON.stringify(domainJSON.DomainSID)
  );
  localStorage.setItem(
    Constants.DOMAIN.FOREIGN_SECURITY_PRINCIPALS_CONTAINER,
    domainJSON.ForeignSecurityPrincipalsContainer
  );
  localStorage.setItem(Constants.DOMAIN.FOREST, domainJSON.Forest);
  localStorage.setItem(
    Constants.DOMAIN.INFRASTRUCTURE_MASTER,
    domainJSON.InfrastructureMaster
  );
  localStorage.setItem(
    Constants.DOMAIN.LAST_LOGON_REPLICATION_INTERVAL,
    domainJSON.LastLogonReplicationInterval
  );
  localStorage.setItem(
    Constants.DOMAIN.LINKED_GROUP_POLICY_OBJECTS,
    JSON.stringify(domainJSON.LinkedGroupPolicyObjects)
  );
  localStorage.setItem(
    Constants.DOMAIN.LOST_AND_FOUND_CONTAINER,
    domainJSON.LostAndFoundContainer
  );
  localStorage.setItem(Constants.DOMAIN.MANAGED_BY, domainJSON.ManagedBy);
  localStorage.setItem(Constants.DOMAIN.NAME, domainJSON.Name);
  localStorage.setItem(Constants.DOMAIN.NET_BIOS_NAME, domainJSON.NetBIOSName);
  localStorage.setItem(Constants.DOMAIN.OBJECT_CLASS, domainJSON.ObjectClass);
  localStorage.setItem(Constants.DOMAIN.OBJECT_GUID, domainJSON.objectGUID);
  localStorage.setItem(Constants.DOMAIN.PDC_EMULATOR, domainJSON.PDCEmulator);
  localStorage.setItem(Constants.DOMAIN.PARENT_DOMAIN, domainJSON.ParentDomain);
  localStorage.setItem(
    Constants.DOMAIN.PUBLIC_KEY_REQUIRED_PASSWORD_ROLLING,
    domainJSON.PublicKeyRequiredPasswordRolling
  );
  localStorage.setItem(
    Constants.DOMAIN.QUOTAS_CONTAINER,
    domainJSON.QuotasContainer
  );
  localStorage.setItem(Constants.DOMAIN.RID_MASTER, domainJSON.RIDMaster);
  localStorage.setItem(
    Constants.DOMAIN.READ_ONLY_REPLICAT_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReadOnlyReplicaDirectoryServers)
  );
  localStorage.setItem(
    Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS,
    JSON.stringify(domainJSON.ReplicaDirectoryServers)
  );
  localStorage.setItem(
    Constants.DOMAIN.SUBORDINATE_REFERENCES,
    JSON.stringify(domainJSON.SubordinateReferences)
  );
  localStorage.setItem(
    Constants.DOMAIN.SYSTEMS_CONTAINER,
    domainJSON.SystemsContainer
  );
  localStorage.setItem(
    Constants.DOMAIN.USERS_CONTAINER,
    domainJSON.UsersContainer
  );
}
