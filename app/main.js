// Modules to control application life and create native browser window
const { app, Menu, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const logger = require('electron-log');
const storage = require('electron-json-storage');
const Constants = require('./constants');

// The app ID is used for notifications and consistent updates / uninstalls
const appID = 'me.westerhausen.adtools';

// Check for preferences setting file\
let preferences = {};
storage.has(Constants.SETTINGS.PREFERENCES, (err, hasKey) => {
  if (err) {
    logger.error(err.msg);
    throw err;
  }
  if (!hasKey) {
    storage.set(Constants.SETTINGS.PREFERENCES, Constants.DEFAULT_PREFERENCES, err => {
      if (err) {
        logger.error(err);
        throw err;
      }
      logger.debug(`Created new settings file for ${Constants.SETTINGS.PREFERENCES}`);
    });
  } else {
    logger.debug(`Existing settings file found for ${Constants.SETTINGS.PREFERENCES}`);
    storage.get(Constants.SETTINGS.PREFERENCES, (err, data) => {
      preferences = data;
      reloadPreferences();
    });
  }
});

// Set log details
if (process.defaultApp) {
  // If default app, running as 'electron .'
  logger.transports.file.level = 'debug'; // log level for the file
  logger.transports.console.level = 'debug'; // log level for the console (false is off)
} else {
  logger.transports.file.level = 'info'; // log level for the file
  logger.transports.console.level = false; // log level for the console (false is off)
}

// Make Logging Available To Other Windows via IPC
ipcMain.on('log', (event, args) => {
  if (!args.msg) logger.error(`Got bad logging request:\n${event}\n${args}`);
  else {
    switch (args.sev) {
      case 'error':
        logger.error(args.msg);
        break;
      case 'warning':
        logger.warning(args.msg);
        break;
      case 'debug':
        logger.debug(args.msg);
        break;
      case 'info':
      default:
        logger.info(args.msg);
        break;
    }
  }
  event.returnValue = true;
});

// Allow Renderers to Send a Quit Command
ipcMain.on('close-app', (evt, arg) => {
  app.quit();
});

// Move existing log to previous.log
if (fs.existsSync(logger.transports.file.getFile().path)) {
  let baselogpath = path.dirname(logger.transports.file.getFile().path);
  fs.renameSync(logger.transports.file.getFile().path, path.join(baselogpath, 'previous.log'));
}
logger.transports.file.getFile().clear();
logger.info(`Logging to ${logger.transports.file.getFile().path}`);

// Start log
logger.info(`Started adtools version ${app.getVersion()}`);
logger.info(`AppID: ${appID}`);
logger.info(`Settings will be stored in ${storage.getDataPath()}`);

// Test for scripts file location:
let scriptsPath = path.join(__dirname, '../scripts');
if (!fs.existsSync(scriptsPath)) {
  scriptsPath = path.join(__dirname, '..', '..', 'scripts');
}
// Then set global path for scripts
global.scripts = {
  path: scriptsPath
};

// Set a global regarding AD connection

global.connection = {
  status: false
};

// Set Const Variables
const aboutMessage = `A simple app to help the lay-admin make simple changes.

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
        {
          role: 'reload'
        },
        {
          role: 'forcereload'
        },
        {
          role: 'toggledevtools'
        },
        {
          label: 'About',
          click() {
            dialog.showMessageBoxSync({
              title: 'About',
              message: aboutMessage
            });
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
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
    icon: path.join(__dirname, '../build/icon.png'),
    height: 600,
    width: 1050,
    webPreferences: {
      nodeIntegration: true
    },
    title: `Active Directory Tools ${app.getVersion()}`
  });
  // mainWindow.maximize();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Open the DevTools if running in development
  if (process.defaultApp) mainWindow.webContents.openDevTools();

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

// UPDATER ITEMS
autoUpdater.on('checking-for-update', () => {
  logger.info('Checking for update...');
});
autoUpdater.on('update-available', info => {
  logger.info('Update available.');
  logger.info(info);
});
autoUpdater.on('update-not-available', info => {
  logger.info('Update not available.');
  logger.info(info);
});
autoUpdater.on('error', err => {
  logger.info('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', progressObj => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  logger.info(log_message);
});
autoUpdater.on('update-downloaded', info => {
  logger.info('Update downloaded');
  logger.info(info);
});

// Update general settings from preferences
function reloadPreferences() {
  // Update logging preferences if not in development
  if (!app.defaultApp) {
    logger.transports.file.level = preferences.fileLogLevel;
  }
}
