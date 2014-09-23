/**
 * @file: Data storing and retrieving based on parse.com. Data is stored for
 * the script as a whole, not per user.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('data');

p.apiVersion = 1;
p.subVersion = 1;
p.dependencies = {
  gash : {apiVersion : 2, subVersion : 1},
};

p.initialize = function() {
  try {
    var parseCom = cParseCom.getParsed('ping', this.credentials);
  }
  catch(e) {
    throw 'You must install the cParseCom library to use gash.data. See https://sites.google.com/site/nnillixxsource/McPherson/cParseCom.';
  }
  if (parseCom.getObjectsByQuery({'key' : 'value'}).jObject().error == 'unauthorized') {
    var app = UiApp.getActiveApplication();
    app.add(app.createLabel('Cannot get data from parse.com. Either application ID or Rest API key is broken.'));
    var handler = app.createServerHandler('gashDataSaveId');
    app.add(app.createLabel('Application ID from parse.com'));
    var appId = app.createTextBox().setName('gash data applicationID');
    app.add(appId);
    handler.addCallbackElement(appId);
    app.add(app.createLabel('Rest API key from parse.com'));
    var restKey = app.createTextBox().setName('gash data restAPIKey');
    app.add(restKey);
    handler.addCallbackElement(restKey);
    app.add(app.createButton('Save', handler));
    return 'gash.data needs credentials for parse.com.';
  }
  return true;
}

/**
 * Credentials for accessing data at parse.com.
 */
p.credentials = {
  'applicationID' : PropertiesService.getScriptProperties().getProperty('gash data applicationID'),
  'restAPIKey' : PropertiesService.getScriptProperties().getProperty('gash data restAPIKey'),
};

/**
 * Handler callback, saving credentials for parse.com to script properties.
 */
function gashDataSaveId(eventInfo) {
  var properties = {
    'gash data applicationID' : 'gash data applicationID',
    'gash data restAPIKey' : 'gash data restAPIKey'
  };
  var app = UiApp.getActiveApplication();

  for (var i in properties) {
    if (eventInfo.parameter[i] != '') {
      PropertiesService.getScriptProperties().setProperty(i, eventInfo.parameter[i]);
      app.add(app.createLabel('Saved ' + i));
    }
  }
  app.add(app.createLabel('Reload page for changes to take effect.'));
  return app;
}

/**
 * Stores a data object on parse.com.
 *
 * @param {string} [table= The class name used at parse.com.]
 * @param {string} [id= If any existing entry has this gashId, it will be updated. Otherwise a new entry will be made.]
 * @param {object} [dataObject= The object to store. Some property names are reserved by parse.com.]
 * return {boolean} [False if the data storing failed.]
 */
p.storeData = function(table, id, dataObject) {
  id = id.toString();
  parseCom = cParseCom.getParsed(table, this.credentials);
  var existingObject = this.loadData(table, id);
  if (existingObject != null) {
    parseCom.batch(true).updateObjects({'gashId':id}, dataObject).batch(false);
    return true;
  }
  else {
    dataObject.gashId = id;
    return parseCom.createObject(dataObject).isOk();
  }
}

/**
 * Loads a data object from parse.com.
 *
 * @param {string} [table= The class name used at parse.com.]
 * @param {string} [id= The (gash) ID used for the entry.]
 * return {object} [The data object, including extra properties added by parse.com. Null if no matching data is found.]
 */
p.loadData = function(table, id) {
  id = id.toString();
  parseCom = cParseCom.getParsed(table, this.credentials);
  var response = parseCom.getObjectsByQuery({'gashId' : id}).jObject();
  if (response.results.length == 0) {
    return null;
  }
  else {
    return response.results[0];
  }
}

/**
 * Loads multiple data objects from parse.com.
 *
 * @param {string} [table= The class name used at parse.com.]
 * @param {string} [searchProperties= The properties to search for, e.g. {'name' : 'needle', 'place' : 'haystack'}.]
 * return {array} [An array with all the matching objects.]
 */
p.searchData = function(table, searchProperties) {
  parseCom = cParseCom.getParsed(table, this.credentials);
  var response = parseCom.getObjectsByQuery(searchProperties).jObject();
  return response.results;
}

/**
 * Deletes data objects at parse.com.
 *
 * @param {string} [table= The class name used at parse.com.]
 * @param {string} [id= The (gash) id of the object to delete. May also be an array of ids.]
 * return {}
 */
p.deleteData = function(table, id) {
  parseCom = cParseCom.getParsed(table, this.credentials);
  if (!Array.isArray(id)) {
    id = [id.toString()];
  }
  parseCom.batch(true);
  for (var i in id) {
    parseCom.deleteObjects({'gashId' : id[i].toString()});
  }
  parseCom.batch(false);
}

/**
 * Tests for this plugin.
 */
p.tests = {
  // Make fairly sure that disallowed values are not selected by randomInt.
  libraryExists : function() {
    try {
      var parseCom = cParseCom.getParsed('ping', gash.data.credentials);
    }
    catch(e) {
      throw 'cParseCom not installed (https://sites.google.com/site/nnillixxsource/McPherson/cParseCom).';
    }
  },
  // Make fairly sure that randomSelect selects based on relative probability.
  credentialsExist : function() {
    if (cParseCom.getParsed('ping', gash.data.credentials).getObjectsByQuery({'key' : 'value'}).jObject().error == 'unauthorized') {
      throw 'parse.com credentials not working.';
    }
  },
  // Assure that data objects can be stored, loaded and deleted.
  createAndVerifyObject : function() {
    var data1 = {'key' : 'value1'};
    gash.data.storeData('test', 1, data1);
    var stored = gash.data.loadData('test', '1');
    if (stored.key != 'value1') {
      throw 'Storing/loading of data does not convert id to strings (or might not work, generally).';
    }
    gash.data.deleteData('test', 1);
    var stored = gash.data.loadData('test', '1');
    if (stored != null) {
      throw 'Deleting of data does not work.';
    }
  },
  // Assure that data objects can be searched, uppdated and mass deleted.
  searchUpdateAndMassDelete : function() {
    var data1 = {'key' : 'value1'};
    var data2 = {'key' : 'value2'};
    gash.data.storeData('test', '1', data1);
    gash.data.storeData('test', '2', data1);
    var stored = gash.data.searchData('test', {'key' : 'value1'});
    if (stored.length < 2) {
      throw 'Searching data does not work.';
    }
    gash.data.storeData('test', 2, data2);
    stored = gash.data.searchData('test', {'gashId' : '2'});
    if (stored.length > 1) {
      throw 'Updating data seems to create new objects.';
    }
    if (stored[0].key != 'value2') {
      throw 'Updating data does not work';
    }
    gash.data.deleteData('test', [1, 2]);
    var stored = gash.data.loadData('test', '1');
    if (stored != null) {
      throw 'Mass deleting of data does not work.';
    }
  }
};
