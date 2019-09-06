// General AD Information
// Require Dependencies
const $ = require('jquery');
const powershell = require('node-powershell');
const path = require('path');
const { remote } = require('electron');

const DOMAIN_MODE = [
  'Windows2000Domain',
  'Windows2003InterimDomain',
  'Windows2003Domain',
  'Windows2008Domain',
  'Windows2008R2Domain',
  'Windows2012Domain',
  'Windows2012R2Domain',
  'WinThreshold'
];

$('#domaininfo').hide();

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

let getInfo = new powershell.PSCommand(
  path.join(remote.getGlobal('scripts').path, 'Get-AD-Info')
);

ps.addCommand(getInfo);

// Pull the Trigger
ps.invoke()
  .then(output => {
    let data = JSON.parse(output);
    $('#connecting-msg').hide();
    $('#domaininfo').show();

    $('#adName').text(data.Name);
    $('#adDNSRoot').text(data.DNSRoot);
    $('#adForest').text(data.Forest);
    $('#adDomainControllers').html(data.ReplicaDirectoryServers.join('<br>'));
    $('#adDomainMode').text(DOMAIN_MODE[data.DomainMode]);
    $('#adChildDomains').html(
      data.ChildDomains.length === 0 ? 'None' : data.ChildDomains.join('<br>')
    );

    console.debug(data);
  })
  .catch(err => {
    console.error(err);
    ps.dispose();
  });
