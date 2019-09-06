// Require Dependencies
const path = require('path');
const { remote } = require('electron');

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
  console.log(val);
  $('#main').html(val);
});
// Load New User Page
getTemplate(path.join(__dirname, 'templates/newUser.html')).then(val => {
  console.log(val);
  $('#newuser').html(val);
});
// Load User List Page
getTemplate(path.join(__dirname, 'templates/userList.html')).then(val => {
  console.log(val);
  $('#userlist').html(val);
});
// Load edit User Page
getTemplate(path.join(__dirname, 'templates/userDetails.html')).then(val => {
  console.log(val);
  $('#user').html(val);
});
