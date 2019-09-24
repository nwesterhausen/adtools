/**
 * This file contains all the powershell activities neatly rolled into one.
 * That way we can use a single powershell instance.
 */
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');
const logger = require('electron-log');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

module.exports = {
  loadAdUser,
  loadUserGroupMembership,
  saveUserProxyAddresses
};

async function loadAdUser(user) {
  // Build loadUser command by adding the parameter we need
  let loadUser = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-User')
  ).addParameter({
    username: user
  });
  logger.info(`Invoked PS Command: loadAdUser(${user})`);
  ps.addCommand(loadUser);

  // Invoke the command
  let output = await ps.invoke();

  let data = JSON.parse(output);
  console.log(data);
  return data;
}

async function loadUserGroupMembership(user) {
  let loadGroups = new powershell.PSCommand(
    path.join(remote.getGlobal('scripts').path, 'Load-AD-UserGroupMembership')
  ).addParameter({
    username: user
  });

  ps.addCommand(loadGroups);
  let output = await ps.invoke();
  let data = JSON.parse(output);
  console.log(data);
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

  ps.invoke().then(output => {
    logger.info(`Saved new proxy addresses for user. ${output}`);
  });
}
