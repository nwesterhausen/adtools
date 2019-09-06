// Modules to control application life and create native browser window
const { app, Menu, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Test for scripts file location:
let scriptsPath = path.join(__dirname, '../scripts');
if (!fs.existsSync(scriptsPath)) {
  scriptsPath = path.join(__dirname, '..', '..', 'scripts');
}

global.scripts = {
  path: scriptsPath
};

// Set Const Variables
const appID = 'me.westerhausen.adtools';
const aboutMessage = `Active Directory Tools
Version ${process.version}

A set of tools to make doing simple but repetitive tasks in Active Directory much easier.

Utilizing the following open source libraries:

node 
electron 
chrome 
jquery
bootstrap 
popper.js
node-powershell 
material design icons 
bootswatch 
datatables.net 


AppID: ${appID}


Copyright © 2019 Nicholas Westerhausen`;

// Set Application User Model ID
app.setAppUserModelId(appID);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Add menu
  createMenu();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 860,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    // Tool Selector
    {
      label: 'Jump to..',
      submenu: [
        {
          label: 'Modify User',
          click() {
            mainWindow.loadFile(path.join(__dirname, 'users.html'));
          }
        },
        {
          label: 'New User',
          click() {
            mainWindow.loadFile(path.join(__dirname, 'newuser.html'));
          }
        },
        {
          label: 'List Computers',
          click() {
            mainWindow.loadFile(path.join(__dirname, 'computers.html'));
          }
        }
      ]
    },
    // Help section
    {
      label: 'Help',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        {
          label: 'About',
          click() {
            dialog.showMessageBoxSync({
              title: 'About',
              message: aboutMessage
            });
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
