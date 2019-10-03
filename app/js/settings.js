const { ipcRenderer } = require('electron');
const storage = require('electron-json-storage');
const Constants = require('../constants.js');
const $ = require('jquery');

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

module.exports = {
  populateSettingsPage,
  addListItem,
  addItemFromModal
};

// Reference for list IDs
let settingPageIDS = {};

// Storage Tests
// check for existing storage
Object.keys(Constants.SETTINGS).map(settingName => {
  const settingCategory = Constants.SETTINGS[settingName];
  settingPageIDS[settingName] = settingCategory;
  storage.has(settingCategory, (err, hasKey) => {
    if (err) {
      logger.error(err.msg);
      throw err;
    }
    if (!hasKey) {
      storage.set(settingCategory, [], err => {
        if (err) {
          logger.error(err);
          throw err;
        }
        logger.info(`Created new settings file for ${settingName}`);
      });
    } else {
      logger.debug(`Existing settings file found for ${settingName}`);
    }
  });
});

// populate the settings lists with the values from the settings file
function populateSettingsPage() {
  logger.info('Loading values in settings page from settings files.');
  Object.keys(Constants.SETTINGS).map(k => {
    addTab(Constants.SETTINGS[k]);
    generateListFromStorage(Constants.SETTINGS[k]);
  });
}

function generateListFromStorage(storageKey) {
  const targetID = `#${storageKey} .list-group`;
  logger.debug(`generating settings list for ${targetID}`);
  storage.get(storageKey, (err, data) => {
    if (err) {
      logger.error(`Error reading storage for settings page.\n${err.msg}`);
      throw err;
    }
    $(targetID).html(generateListHTMLFromJson(data));
    $(`${targetID} .edit-option`).click(editListItem);
    $(`${targetID} .remove-option`).click(removeListItem);
  });
}

function generateListHTMLFromJson(listjson) {
  // Should be an array..
  if (!Array.isArray(listjson)) {
    logger.debug(`Got non-array for list generation.\n${JSON.stringify(listjson)}`);
    return false;
  }

  let html = '';
  listjson.map(item => {
    html += `<div class="list-group-item list-group-item-action" data-value="${item}">
              <span>${item}</span>
              <div class="settings-option remove-option my-0">
                <i class="mdi mdi-trash-can-outline"></i>
              </div>
              <div class="settings-option edit-option my-0 mx-2">
                <i class="mdi mdi-pencil-outline"></i>
              </div>
            </div>`;
  });

  return html;
}

function addListItem(event) {
  console.log(event);
  let cat = event.currentTarget.parentElement.id;
  logger.debug(`Adding new item for ${cat}`);
  $('.newListItemCategory').text(cat);
  $('#addListItemModal').data('category', cat);
  $('#addListItemModal').modal();
}

function addItemFromModal() {
  let item = $('#newItemInput').val();
  let list = $('#addListItemModal').data('category');
  updateListItem(list, null, item);
  $('#addListItemModal').modal('hide');
  $('#newItemInput').val('');
}

function editListItem(event) {
  let $listItem = $(event.currentTarget.parentElement);
  $('span', $listItem).hide();
  $listItem.append(
    `<input class="form-control" value="${event.currentTarget.parentElement.dataset.value}" />
    <button class="btn btn-sm btn-success mt-1">Save</button>
    <button class="btn btn-sm btn-danger mt-1">Cancel</button>`
  );
  console.log(event);
  $('.btn-success', $listItem).click(saveModified);
  $('input', $listItem).keypress(saveModified);
  $('.btn-danger', $listItem).click(cancelModification);
  logger.debug(`EDIT -> ${event.currentTarget.parentElement.dataset.value}`);
}
function removeListItem(event) {
  logger.debug(`REMOVE -> ${event.currentTarget.parentElement.dataset.value}`);
}

function saveModified(event) {
  if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
    let $listItem = $(event.target.parentElement);
    let listID = event.target.parentElement.parentElement.parentElement.id;
    let oldVal = event.currentTarget.parentElement.dataset.value;
    let newVal = $('input', $listItem).val();
    // Send values to get updated
    updateListItem(listID, oldVal, newVal);
    logger.info(`SAVE -> ${oldVal} >>> ${newVal}`);
    event.currentTarget.parentElement.dataset.value = newVal;
    // Remove the input box and buttons
    $('input', $listItem).remove();
    $('button', $listItem).remove();
    $('span', $listItem).text(newVal);
    $('span', $listItem).show();
  }
}

function cancelModification(event) {
  let $listItem = $(event.target.parentElement);
  // Remove the input box and buttons
  $('input', $listItem).remove();
  $('button', $listItem).remove();
  $('span', $listItem).show();
}

function updateListItem(listID, oldVal, newVal) {
  logger.debug(`Called updateListItem(${listID}, ${oldVal}, ${newVal})`);
  if (oldVal) {
    storage.get(listID, (err, data) => {
      if (err) {
        logger.error(`Error reading storage for ${listID}.`);
        throw err;
      }
      let editedList = data;
      editedList.splice(data.indexOf(oldVal), 1, newVal);
      storage.set(listID, editedList, err => {
        if (err) {
          logger.error(`Error setting new value (${newVal}) for ${listID}.`);
          throw err;
        }
      });
    });
  } else {
    storage.get(listID, (err, data) => {
      if (err) {
        logger.error(`Error reading storage for for ${listID}.`);
        throw err;
      }
      let editedList = data;
      editedList.push(newVal);
      storage.set(listID, editedList, err => {
        if (err) {
          logger.error(`Error adding new value (${newVal}) to ${listID} list.`);
          throw err;
        }
        generateListFromStorage(listID);
      });
    });
  }
}

function addTab(category) {
  let htmlStr = `<a class="nav-item nav-link" id="nav-${category}-tab"
    data-toggle="tab" href="#${category}">${category[0].toUpperCase() + category.substring(1)}</a>`;
  let emptyCont = `<div class="tab-pane fade p-2" id="${category}">
    <div class="list-group"></div><hr />
    <button class="btn btn-success addNewItemBtn">Add New</button>
    </div>`;
  $('#settingsNav').append(htmlStr);
  $('#settingsNav-tabContent').append(emptyCont);
  // $(`#nav-${category}-tab`).tab();
}
