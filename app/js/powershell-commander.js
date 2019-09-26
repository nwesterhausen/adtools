/**
 * This file contains all the powershell activities neatly rolled into one.
 * That way we can use a single powershell instance.
 */
const powershell = require('node-powershell');
const path = require('path');
const { remote, ipcRenderer } = require('electron');

// Helper function for IPC logging
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
// Single Powershell instance
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

module.exports = {
  loadAdUser,
  loadUserGroupMembership,
  saveUserProxyAddresses,
  getBasicDomainInfo,
  getBasicUserInfo
};

/**
 * Load details on a single active directory user. Will return an object if
 * we matched a single user, otherwise returns a list.
 * @param {String} user
 */
async function loadAdUser(user) {
  // Build loadUser command by adding the parameter we need
  let loadUser = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-User')
  ).addParameter({
    username: user
  });

  ps.addCommand(loadUser);

  // Invoke the command
  logger.info(`Invoked PS Command: loadAdUser(${user})`);
  let output = await ps.invoke();
  logger.debug(`${user}:: ${output}`);
  let data = JSON.parse(output);
  return data;
}

/**
 * Loads a list of groups a user belongs to.
 * @param {String} user GUID of the user to load groups for
 */
async function loadUserGroupMembership(user) {
  let loadGroups = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-UserGroupMembership')
  ).addParameter({
    username: user
  });

  ps.addCommand(loadGroups);
  logger.info(`Invoked PS Command: loadUserGroupMembership(${user})`);
  let output = await ps.invoke();
  logger.debug(`${user}:: ${output}`);
  let data = JSON.parse(output);
  return data;
}

async function saveUserProxyAddresses(userGuid, proxyList) {
  let commitChange = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Update-User-ProxyAddresses')
  )
    .addParameter({
      userid: userGuid
    })
    .addParameter({
      proxyAddresses: proxyList
    });

  ps.addCommand(commitChange);

  logger.info(
    `Invoked PS Command: saveUserProxyAddresses(${user}): ${JSON.stringify(
      proxyList
    )}`
  );
  ps.invoke().then(output => {
    logger.info(`Saved new proxy addresses for user. ${output}`);
  });
}

async function getBasicDomainInfo() {
  ps.addCommand(getInfo);
  logger.info(`Invoked PS Command: getBasicDomainInfo()`);
  let output = await ps.invoke();
  return JSON.parse(output);
}

async function getBasicUserInfo() {
  ps.addCommand(getUsers);
  logger.info(`Invoked PS Command: getBasicUserInfo()`);
  let output = await ps.invoke();
  return JSON.parse(output);
}
