/**
 * @file: Framework for helper plugins, for Google Apps Scripts.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

/**
 * The entry point for page callbacks.
 */
function doGet(queryInfo) {
  var app = UiApp.createApplication();

  // Initialize all plugins, and make sure they are ok.
  if (!gash.initialize(queryInfo)) {
    return app;
  }

  // Call all doGet functions in the plugins.
  gash.invokeAll('doGet', queryInfo);
  return app;
}

/**
 * The main module for gash. See example files for how to use gash.
 */
var gash = (function () {
  // Public variables
  var plugins = []; // Array with names of all plugins.
  var queryParameters; // configObject with page query parameters.
  var apiVersion = 2;
  var subVersion = 1;

  /**
   * Makes query parameters globally available (for good and bad) and initializes plugins.
   *
   * @param {object} [queryInfo= The query info, as passed to the doGet() function.]
   * return {}
   */
  function initialize(queryInfo) {
    // Stores query parameters where all methods can access them. Query parameters
    // can be accessed through the 'queryParameters' property. All parameters are
    // stored as arrays. Their value(s) can be set in the path by adding queries
    // of the type ?foo=value1,value2&bar=value3.
    var parameters = {};
    queryInfo = queryInfo || {};
    for (var i in queryInfo.parameters) {
      if (queryInfo.parameters[i].length > 1) {
        parameters[i] = queryInfo.parameters[i];
      }
      else {
        parameters[i] = queryInfo.parameters[i][0].split(',');
      }
    }
    this.queryParameters = new configObject(parameters);

    // Initialize all plugins, and verify that they start ok.
    var response;
    var errors = {};
    for (var i in plugins) {
      // The response should be 'true', or something is wrong.
      response = this[plugins[i]].initialize(this.queryParameters);
      if (response != true) {
        if (typeof response == 'string') {
          errors[plugins[i]] = response;
        }
        else {
          errors[plugins[i]] = 'Could not initalize plugin ' + plugins[i];
        }
      }
    }

    // If we have any errors, print them out and return false. The caller should abort the page request.
    if (Object.keys(errors).length > 0) {
      var app = UiApp.getActiveApplication();
      app.add(app.createLabel('Errors initializing gash:'));
      for (var i in errors) {
        app.add(app.createLabel('Plugin ' + i + ': ' + errors[i]));
      }
      return false;
    }

    return true;
  }

  /**
   * Calls the given method in all plugins that implement it.
   *
   * @param {string} [method= The name of the method.]
   * @param {object} [argument= Any argument to pass to the method.]
   * return {}
   */
  function invokeAll(method, argument) {
    for (var i in plugins) {
      if (typeof this[plugins[i]][method] == 'function') {
        this[plugins[i]][method](argument);
      }
    }
  }

  return {
    // Properties
    plugins : plugins,
    queryParameters : queryParameters,
    apiVersion : apiVersion,
    subVersion : subVersion,
    // Methods
    initialize : initialize,
    invokeAll : invokeAll,
  };
}) ();

/**
 * Class for gash plugins.
 *
 * @param {string} [id= The unique ID of this plugin.]
 * return {gashPlugin}
 */
function gashPlugin(id) {
  if (typeof id != 'string') {
    throw 'Cannot add plugin ' + id + ': Not a valid name.';
  }
  if (gash[id] !== undefined) {
    throw 'Cannot add plugin ' + id + ': Name is taken.';
  }
  gash[id] = this;
  gash.plugins.push(id);

  return this;
}

/**
 * Default initialization method for gash plugins.
 *
 * @param {configObject} [queryParameters= The query parameters for this page call.]
 * return {boolean}
 */
gashPlugin.prototype.initialize = function(queryParameters) {
  return true;
}

/**
 * Basic configuration class, for storing values in properties.
 * @param {object} [config= Object with properties and values.]
 * return {configObject}
 */
function configObject(config) {
  for (var i in config) {
    this[i] = config[i];
  }
  return this;
}

/**
 * The addDefaults method adds values to a configObject, if they are not already set.
 *
 * @param {configObject} [defaults= Config object containing the default values.]
 * return {configObject}
 */
Object.defineProperty(configObject.prototype, 'addDefaults', {
  value : function(defaults) {
    if (defaults === undefined) {
      return this;
    }
    if (defaults instanceof configObject) {
      for (var i in defaults) {
        if (this[i] === undefined) {
          this[i] = defaults[i];
        }
      }
      return this;
    }
    else {
      throw 'Cannot add default configuration ' + defaults + ': It is not a config object.';
    }
  }
});

/**
 * The overwriteWith method adds and overwrites values of a configObject with the specified properties.
 *
 * If the overwrite properties is a configObject, it will be modified and returned. Otherwise a
 * new configObject will be created.
 *
 * @param {object} [properties= Object (possibly config object) containing the properties used for overwriting.]
 * return {configObject}
 */
Object.defineProperty(configObject.prototype, 'overwriteWith', {
  value : function(properties) {
    if (properties === undefined) {
      return new configObject(this);
    }
    if (typeof properties != 'object') {
      throw 'Cannot overwrite configuration with properties ' + properties + ': they must be an object.';
    }
    if (properties instanceof configObject) {
      return properties.addDefaults(this);
    }
    else {
      properties = new configObject(properties);
      return properties.addDefaults(this);
    }
  }
});
