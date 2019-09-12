// Modules to control application life and create native browser window
const { app, Menu, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const logger = require('electron-log');

// Set log details
logger.transports.file.level = 'info';
logger.transports.console.level = false;
logger.transports.rendererConsole.level = false;

// Move existing log to previous.log
if (fs.existsSync(logger.transports.file.findLogPath())) {
  let baselogpath = path.dirname(logger.transports.file.findLogPath());
  fs.renameSync(
    path.join(baselogpath, 'log.log'),
    path.join(baselogpath, 'previous.log')
  );
}

// Test for scripts file location:
let scriptsPath = path.join(__dirname, '../scripts');
if (!fs.existsSync(scriptsPath)) {
  scriptsPath = path.join(__dirname, '..', '..', 'scripts');
}

global.scripts = {
  path: scriptsPath
};

// Set a global regarding AD connection

global.connection = {
  status: false
};

// Set Const Variables
const appID = 'me.westerhausen.adtools';
const aboutMessage = `A set of tools to make doing simple but repetitive tasks in Active Directory much easier.

AppID: ${appID}
Copyright © 2019 Nicholas Westerhausen`;

// Set Application User Model ID
app.setAppUserModelId(appID);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createMenu() {
  const template = [
    // Help section
    {
      label: 'File',
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
app.on('ready', function() {
  // Add menu
  createMenu();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 860,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true
    },
    title: `Active Directory Tools ${app.getVersion()}`
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  autoUpdater.checkForUpdatesAndNotify();

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
});

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

autoUpdater.on('checking-for-update', () => {
  logger.info('Checking for update...');
});
autoUpdater.on('update-available', info => {
  logger.info('Update available.');
});
autoUpdater.on('update-not-available', info => {
  logger.info('Update not available.');
});
autoUpdater.on('error', err => {
  logger.info('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', progressObj => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message =
    log_message +
    ' (' +
    progressObj.transferred +
    '/' +
    progressObj.total +
    ')';
  logger.info(log_message);
});
autoUpdater.on('update-downloaded', info => {
  logger.info('Update downloaded');
});
