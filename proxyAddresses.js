// This file is required by the users.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// Require Dependencies
const $ = require('jquery');
const bs = require('bootstrap');
const powershell = require('node-powershell');

const ps = new powershell({
  executionPolicy: 'Bypass',
  noProfile: true
});

const primeBadge =
  ' <span class="badge badge-secondary">Primary Address</span>';

function getProxyAddressValue() {
  let proxyAddresses = [];
  for (let row of $('#proxyTable tbody tr')) {
    proxyAddresses.push(row.getAttribute('data-value'));
  }
  return proxyAddresses;
}

function commitProxyAddressChange() {
  let newValue = getProxyAddressValue();
  let userid = $('#userDisplayname').attr('data-guid');
  let commitChange = new powershell.PSCommand(
    './Update-User-ProxyAddresses.ps1'
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
  for (let row of $('#proxyTable tbody tr')) {
    let aval = row.getAttribute('data-value');
    if (aval.startsWith('SMTP:') && aval.indexOf(newPA) === -1) {
      row.setAttribute('data-value', `smtp:${aval.split(':')[1]}`);
      row.innerHTML = `<td>${aval.split(':')[1]}</td>`;
      row.classList.remove('table-primary');
    } else if (aval.indexOf(newPA) !== -1) {
      row.setAttribute('data-value', `SMTP:${newPA}`);
      row.innerHTML = `<td>${newPA} ${primeBadge}</td>`;
      row.classList.add('table-primary');
    }
  }

  $('#primaryAddressModal').modal('hide');
}

$('#commitPrimary').click(commitProxyAddressChange);
$('#changePrimary').click(() => {
  $('#primaryAddressModal').modal();
});
$('#mdlbtnSetPrimary').click(updateProxyAddressList);
