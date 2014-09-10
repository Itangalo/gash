/**
 * @file: Some helper functions for Google Apps Scripts.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var gash = (function () {
  // Private variables
  var cache = {};

  // Public variables
  var versionNumber = 0.4;
  var queryParameters = {};
  var areas = {};
  var defaultWrapperAttributes = {maxHeight : '240px', width : '640px', padding : '0px', margin : '0px', border : 'thin lightgrey solid', overflow : 'auto'};
  var defaultScrollAttributes = {};
  var defaultWidgetAttributes = {};

/**
 * Meta-functions, for managing property storage.
 */
  // Stores query parameters where all methods can access them. Query parameters
  // can be accessed through the 'queryParameters' property. All parameters are
  // stored as arrays. Their value(s) can be set in the path by adding queries
  // of the type ?foo=value1,value2&bar=value3.
  function storeQueryParameters(queryInfo) {
    var queryParameters = {};
    for (var i in queryInfo.parameters) {
      if (queryInfo.parameters[i].length > 1) {
        queryParameters[i] = queryInfo.parameters[i];
      }
      else {
        queryParameters[i] = queryInfo.parameters[i][0].split(',');
      }
    }
    this.queryParameters = queryParameters;
  }

  // Adds default properties to an object.
  function addDefaults(object, defaults) {
    if (object === undefined) {
      return defaults;
    }
    for (var i in defaults) {
      // Explicit check to prevent 'false' from being overwritten by defaults.
      if (object[i] === undefined) {
        object[i] = defaults[i];
      }
    }
    return object;
  }

  // Fetches (and if necessary builds) the hopefully unique ID for
  // this instance of gash. Uses a time-based token.
  function getScriptId() {
    if (typeof PropertiesService.getScriptProperties().getProperty('gash id') == 'string') {
      return PropertiesService.getScriptProperties().getProperty('gash id');
    }
    else {
      var d = new Date();
      return PropertiesService.getScriptProperties().setProperty('gash id', 'gash' + d.valueOf()).getProperty('gash id');
    }
  };

  // Fetches (and if necessary builds) the user ID for this gash instance.
  // If the user is logged in, the e-mail will be used. Otherwise a time-based
  // token will be built and stored as user property 'gash user id'.
  function getUserId() {
    if (Session.getActiveUser().getEmail() != '') {
      return Session.getActiveUser().getEmail();
    }
    else {
      var gashUserId = JSON.parse(PropertiesService.getUserProperties().getProperty('gash user id')) || {};
      if (gashUserId[getScriptId()] != undefined) {
        return gashUserId[getScriptId()];
      }
      else {
        var d = new Date();
        gashUserId[getScriptId()] = 'id-' + d.valueOf();
        PropertiesService.getUserProperties().setProperty('gash user id', JSON.stringify(gashUserId));
        return 'id-' + d.valueOf();
      }
    }
  }

  // Fetches stored data with a given store Id.
  function getUserData(storeId) {
    // Verify that we have something that looks like a valid storeId.
    if (typeof storeId != 'string') {
      return false;
    }
    var result = PropertiesService.getUserProperties().getProperty(storeId);
    if (result == null) {
      return result;
    }
    else {
      return JSON.parse(result);
    }
  }

  // Stores data with a given store ID.
  function setUserData(storeId, data) {
    if (typeof storeId != 'string') {
      throw 'Cannot store data with ID ' + JSON.stringify(storeId) + ': ID must be a string.';
    }
    PropertiesService.getUserProperties().setProperty(storeId, JSON.stringify(data));
    return;
  }

  // Fetches stored data with a given store Id.
  function getGlobalData(storeId, subProperty) {
    // Call recurively if a subProperty is set.
    if (subProperty != undefined) {
      var parent = getGlobalData(storeId);
      if (typeof parent == 'object' && parent != null) {
        return parent[subProperty];
      }
      else {
        return undefined;
      }
    }

    // Verify that we have something that looks like a valid storeId.
    if (typeof storeId != 'string') {
      return false;
    }
    var result = PropertiesService.getScriptProperties().getProperty(storeId);
    if (result == null) {
      return result;
    }
    else {
      return JSON.parse(result);
    }
  }

  // Stores data with a given store Id.
  function setGlobalData(storeId, data, subProperty) {
    if (typeof storeId != 'string') {
      throw 'Cannot store data with ID ' + JSON.stringify(storeId) + ': ID must be a string.';
    }
    // If a sub property should be set, fetch the parent and set sub property.
    if (subProperty != undefined) {
      var parent = getGlobalData(storeId) || {};
      parent[subProperty] = data;
      data = parent;
    }

    PropertiesService.getScriptProperties().setProperty(storeId, JSON.stringify(data));
    return;
  }

/**
 * Functions for managing areas/UI.
 */
  function Area(name, widgetAttributes) {
    this.id = name;
    this.widgetAttributes = gash.addDefaults(widgetAttributes, defaultWidgetAttributes);
  };
  Area.prototype.add = function(element, attributes) {
    var app = UiApp.getActiveApplication();
    var panel = app.getElementById(this.id);
    if (typeof element == 'string') {
      element = app.createLabel(element);
    }
    // Some UI objects doesn't accept style attributes.
    if (typeof element.setStyleAttributes == 'function') {
      element.setStyleAttributes(gash.addDefaults(attributes, this.widgetAttributes));
    }
    panel.add(element);
    return app;
  }
  Area.prototype.clear = function() {
    var app = UiApp.getActiveApplication();
    var panel = app.getElementById(this.id);
    panel.clear();
    return app;
  }

  // Adds a new area, consisting of a caption panel (with optional label), containing a scroll panel,
  // containing a vertical panel. The vertical panel will contain other UI elements. CSS attributes
  // for the outer wrapper can be set, as well as default attributes for widgets added to the area.
  function addArea(name, label, widgetAttributes, areaAttributes) {
    var app = UiApp.getActiveApplication();
    var captionPanel = app.createCaptionPanel(label || '').setId(name + '-wrapper').setStyleAttributes(gash.addDefaults(areaAttributes, defaultWrapperAttributes));;
    var scrollPanel = app.createScrollPanel().setId(name + '-scroll').setStyleAttributes(defaultScrollAttributes);
    var container = app.createVerticalPanel().setId(name);//.setStyleAttributes({width : '100%', height : '100%'});
    captionPanel.add(scrollPanel);
    scrollPanel.add(container);
    app.add(captionPanel);
    areas[name] = new Area(name, widgetAttributes);
    return areas[name];
  }

/**
 * Extra UI widgets
 */

  // Adds a pseduo-widget with a file upload. The file will be uploaded to the user's trash
  // on Google Drive, and the ID of the file will be added as a parameter to the provided
  // externalHandler. This is a workaround to allow file uploads to be used in normal UI.
  // Note that this function depends on the doPost() function provided by gash.
  // Arguments:
  //   id: the ID to use for the file widget
  //   externalHandler: a server handler being used by the script calling this function
  //   label: any text to display above the file upload box
  //   helptext: any text to display as a title popup
  function createFileUpload(id, externalHandler, label, helptext) {
    var app = UiApp.getActiveApplication();

    // Add a hidden element to the provided external handler.
    externalHandler.addCallbackElement(app.createHidden(id).setId(id));
    var form = app.createFormPanel().setId(id + '-form');
    if (typeof helptext == 'string') {
      form.setTitle(helptext);
    }

    var wrapper = app.createVerticalPanel().setId(id + '-wrapper');
    if (typeof label == 'string') {
      wrapper.add(app.createLabel(label).setId(id + '-label'));
    }

    wrapper.add(app.createFileUpload().setId(id + '-upload').setName(id + '-upload'));
    wrapper.add(app.createSubmitButton('upload').setId(id + '-submit'));

    form.add(wrapper)
    return form;
  }

  // Adds a pseudo-widget for selecting a folder in Google Drive. The folder ID will be
  // available through the name provided in the id argument.
  function createFolderListBox(id, externalHandler, label) {
    label = label || 'Search and select folder:';
    var app = UiApp.getActiveApplication();
    var handler = app.createServerHandler('createFolderListBoxHandler');
    var wrapper = app.createHorizontalPanel();
    wrapper.add(app.createLabel(label).setId(id + '-label'));
    var searchBox = app.createTextBox().setId(id + '-search').setName(id + '-search');
    handler.addCallbackElement(searchBox);
    wrapper.add(searchBox);
    wrapper.add(app.createButton('search', handler).setId(id + '-button'));

    var folderListBox = app.createListBox().setId(id).setName(id).addItem('select folder', '');
    externalHandler.addCallbackElement(folderListBox);
    wrapper.add(folderListBox);
    return wrapper;
  }

  // The publically accessible properties and methods
  return {
    // Variables
    versionNumber : versionNumber,
    queryParameters : queryParameters,
    areas : areas,
    defaultWrapperAttributes : defaultWrapperAttributes,
    defaultScrollAttributes : defaultScrollAttributes,
    defaultWidgetAttributes : defaultWidgetAttributes,
    // Methods
    storeQueryParameters : storeQueryParameters,
    addDefaults : addDefaults,
    getScriptId : getScriptId,
    getUserId : getUserId,
    getUserData : getUserData,
    setUserData : setUserData,
    getGlobalData : getGlobalData,
    setGlobalData : setGlobalData,
    addArea : addArea,
    createFileUpload : createFileUpload,
    createFolderListBox : createFolderListBox,
  };
}) ();

// Function required by the file upload pseudo widget.
// @TODO: Add a failsafe mechanism, to avoid having this function run on ALL form submissions.
function doPost(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Extract the id to use for the file storing.
  var name = eventInfo.parameter.formId.split('-')[0];
  var hidden = app.getElementById(name);
  // Create a file a store it in the user's trash on Google Drive. (Storing it in the trash
  // allows the user to abort the script at any time, and not have extra files lying around.)
  var file = DocsList.createFile(eventInfo.parameter[name + '-upload']);
  hidden.setValue(file.getId());
  file.setTrashed(true);

  return app;
}

// Handler callback making the 'createFolderListBox' method work.
function createFolderListBoxHandler(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Extract the id of the list box with folders.
  var id = eventInfo.parameter.source.split('-')[0];
  var listBox = app.getElementById(id);
  listBox.clear();

  // Search for matching folders and populate the list box.
  var searchString = eventInfo.parameter[id + '-search'];
  var folders = DriveApp.searchFolders('title contains "' + searchString + '"');
  var items = {};
  while (folders.hasNext()) {
    folder = folders.next();
    items[folder.getId()] = folder.getName();
  }
  listBox.addItem('Found ' + Object.keys(items).length + ' folders', '');
  for (var value in items) {
    listBox.addItem(items[value], value);
  }
  return app;
}

function debug(data, label) {
  label = label || 'debugged';

//  if (data.toString() != undefined) {
//    Logger.log(label + ' : ' + data.toString());
//    return;
//  }
  if (typeof data == 'object') {
    for (var i in data) {
      debug(data[i], label + '.' + i);
    }
  }
  else {
    Logger.log(label + ' : ' + data);
  }
}

function logTime(sinceTime, message) {
  if (typeof message == 'string') {
    Logger.log(message);
  }
  var now = new Date().getTime();
  Logger.log(now - sinceTime);
}
