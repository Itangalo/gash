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
  var defaultWrapperAttributes = {border : 'none', padding : '0px', margin : '0px'};

  // Public variables
  var versionNumber = 0.2;
  var queryParameters = {};
  var areas = {};
  var defaultAttributes = {};

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
  function Area(name, attributes) {
    this.id = name;
    this.attributes = attributes || gash.defaultAttributes;
  };
  Area.prototype.add = function(element, attributes) {
    // Merge the frame's default attributes with any overrides specified by arguments.
    attributes = attributes || {};
    for (var i in defaultAttributes) {
      attributes[i] = attributes[i] || defaultAttributes[i];
    }

    var app = UiApp.getActiveApplication();
    var panel = app.getElementById(this.id);
    if (typeof element == 'string') {
      element = app.createLabel(element);
    }
    // Some UI objects doesn't accept style attributes.
    if (typeof element.setStyleAttributes == 'function') {
      element.setStyleAttributes(attributes);
    }
    panel.add(element);
    return app;
  }
  Area.prototype.clear = function() {
    gash.clearArea(this.name);
  }


  // Adds a new area, with specified CSS attributes. The area consists of a caption panel, containing
  // a scroll panel, containing a vertical panel. The vertical panel will contain other UI elements.
  function addArea(name, attributes, label) {
    var app = UiApp.getActiveApplication();
    var captionPanel = app.createCaptionPanel(label || '').setStyleAttributes(defaultWrapperAttributes);
    var scrollPanel = app.createScrollPanel().setId(name + '-scroll').setStyleAttributes(attributes || {});
    var container = app.createVerticalPanel().setId(name);
    captionPanel.add(scrollPanel);
    scrollPanel.add(container);
    app.add(captionPanel);
    areas[name] = new Area(name);
    return areas[name];
  }

  // Adds a UI element to the specified area. If just a text string is provided,
  // it will be added as a plain label element.
  function addToArea(element, area, attributes) {
    if (areas[area] == undefined) {
      throw 'Cannot add elements to area ' + area + ': It does not exist.';
    }

    // Merge the frame's default attributes with any overrides specified by arguments.
    attributes = attributes || {};
    for (var i in defaultAttributes) {
      attributes[i] = attributes[i] || defaultAttributes[i];
    }

    var app = UiApp.getActiveApplication();
    var panel = app.getElementById(area);
    if (typeof element == 'string') {
      element = app.createLabel(element);
    }
    panel.add(element.setStyleAttributes(attributes));
    return app;
  }

  // Removes all elements from the specified area.
  function clearArea(area) {
    if (this.areas[area] == undefined) {
      throw 'Cannot clear area ' + area + ': It does not exist.';
    }
    var app = UiApp.getActiveApplication();
    var panel = app.getElementById(area);
    panel.clear();
    return app;
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

  // The publically accessible properties and methods
  return {
    // Variables
    versionNumber : versionNumber,
    queryParameters : queryParameters,
    areas : areas,
    defaultAttributes : defaultAttributes,
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
    addToArea : addToArea,
    clearArea : clearArea,
    createFileUpload : createFileUpload,
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
