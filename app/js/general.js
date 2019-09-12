// General AD Information
// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');
const Constants = require('./js/constants');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

const getInfo = new powershell.PSCommand(
  path.join(remote.getGlobal('scripts').path, 'Get-AD-Info')
);

updateDomainInfoFromStorage();

function updateADDomainInfo() {
  ps.addCommand(getInfo);

  // Pull the Trigger
  ps.invoke()
    .then(output => {
      let data = JSON.parse(output);

      console.debug(data);
    })
    .catch(err => {
      console.error(err);
      ps.dispose();
    });
}

function updateDomainInfoFromStorage() {
  $('#adName').text(localStorage.getItem(Constants.DOMAIN.NAME));
  $('#adDNSRoot').text(localStorage.getItem(Constants.DOMAIN.DNS_ROOT));
  $('#adForest').text(localStorage.getItem(Constants.DOMAIN.FOREST));
  $('#adDomainControllers').html(
    JSON.parse(
      localStorage.getItem(Constants.DOMAIN.REPLICA_DIRECTORY_SERVERS)
    ).join('<br>')
  );
  $('#adDomainMode').text(localStorage.getItem(Constants.DOMAIN.DOMAIN_MODE));
  let cds = JSON.parse(localStorage.getItem(Constants.DOMAIN.CHILD_DOMAINS));
  $('#adChildDomains').html(cds.length === 0 ? 'None' : cds.join('<br>'));
}
