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
  queryInfo = queryInfo || {}; // Allows running the doGet function without an actual page call.
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
 * The entry point for spreadsheet and document open.
 */
function onOpen(queryInfo) {
  queryInfo = queryInfo || {}; // Allows running the onOpen function without an actual page call.
  var app = UiApp.createApplication();

  // Initialize all plugins, and make sure they are ok.
  if (!gash.initialize(queryInfo)) {
    return app;
  }

  // Call all onOpen functions in the plugins.
  gash.invokeAll('onOpen', queryInfo);
  return app;
}

/**
 * The entry point for form submissions.
 */
function doPost(eventInfo) {
  eventInfo = eventInfo || {}; // Allows running the doPost function without an actual page call.
  var app = UiApp.getActiveApplication();

  // Initialize all plugins, and make sure they are ok.
  if (!gash.initialize(eventInfo)) {
    return app;
  }

  // Call all doGet functions in the plugins.
  gash.invokeAll('doGet', queryInfo);
  return app;
}

/**
 * The entry point for server handler callbacks.
 */
function gashHandlerCallback(eventInfo) {
  // Initialize all plugins, and make sure they are ok.
  if (!gash.initialize(eventInfo)) {
    return app;
  }

  var callback = eventInfo.parameter[eventInfo.parameter.source + '-callback'];
  if (!callback) {
    throw 'No callback defined for source ' + eventInfo.parameter.source + '.';
  }
  var parts = callback.split('.');
  if (parts[0] != 'gash') {
    throw 'Callback must be a method within the gash object.';
  }
  parts.shift();
  var target = gash;
  for (var i in parts) {
    target = target[parts[i]];
    if (target == undefined) {
      throw 'Cannot find callback function ' + callback + '.';
    }
  }
  if (typeof target != 'function') {
    throw 'Callback ' + callback + ' is not a function.';
  }
  target(eventInfo);
  return UiApp.getActiveApplication();
}

/**
 * The main module for gash. See example files for how to use gash.
 */
var gash = (function () {
  // Public variables
  var plugins = []; // Array with names of all plugins.
  var queryParameters = new configObject({}); // configObject with page query parameters.
  var apiVersion = 2;
  var subVersion = 3;

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

    // Verify that all plugins have dependencies met.
    var errors = {};
    var reqApi, reqSub, gotApi, gotSub;
    for (var i in plugins) {
      for (var j in this[plugins[i]].dependencies) {
        reqApi = this[plugins[i]].dependencies[j].apiVersion;
        reqSub = this[plugins[i]].dependencies[j].subVersion;
        if (j == 'gash') {
          gotApi = this.apiVersion;
          gotSub = this.subVersion;
        } else {
          if (this[j] instanceof gashPlugin) {
            gotApi = this[j].apiVersion;
            gotSub = this[j].subVersion;
          }
          else {
            gotApi = false;
            gotSub = false;
            errors[plugins[i] + ' dependency'] = 'Requires version ' + reqApi + '.' + reqSub + ' of ' + j + ' (plugin missing)';
          }
        }
        if (reqApi != gotApi || reqSub > gotSub && gotApi) {
          errors[plugins[i] + ' dependency'] = 'Requires version ' + reqApi + '.' + reqSub + ' of ' + j + ' (got ' + gotApi + '.' + gotSub + ')';
        }
      }
    }

    // Initialize all plugins, and verify that they start ok.
    var response;
    for (var i in plugins) {
      // The response should be 'true', or something is wrong.
      response = this[plugins[i]].initialize(this.queryParameters);
      if (response != true) {
        if (typeof response == 'string') {
          errors['Initializing ' + plugins[i]] = response;
        }
        else {
          errors['Initializing ' + plugins[i]] = 'Could not initalize plugin ' + plugins[i];
        }
      }
    }

    // If we have any errors, print them out and return false. The aborts the page request.
    if (Object.keys(errors).length > 0) {
      var app = UiApp.getActiveApplication();
      app.add(app.createLabel('Errors initializing gash:'));
      for (var i in errors) {
        app.add(app.createLabel(i + ': ' + errors[i]));
      }
      return false;
    }

    // Run overrides declared by plugins.
    gash.invokeAll('overrides', queryInfo);

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
    var result = {};
    for (var i in plugins) {
      if (typeof this[plugins[i]][method] == 'function') {
        result[plugins[i]] = this[plugins[i]][method](argument);
      }
      else if (typeof this[plugins[i]][method] == 'object') {
        result[plugins[i]] = this[plugins[i]][method];
      }
    }
    return result;
  }

  /**
   * Returns the general server handler for gash, and creates one if need be.
   */
  function getServerHandler() {
    var app = UiApp.getActiveApplication();
    var handler = app.getElementById('gashHandler');
    if (typeof handler.addCallbackElement == 'function') {
      return handler;
    }
    else {
      handler = app.createServerHandler('gashHandlerCallback').setId('gashHandler');
      return handler;
    }
  }

  /**
   * Connects a callback method with a given UI elment.
   *
   * This method can be used to route all server handler callbacks through gash,
   * thereby assuring proper plugin initation and so on. The ID of the widget must
   * not be changed after the callback is connected, since it is used to remember
   * which callback to used.
   *
   * @param {UI element} [element= The widget to connect the callback to.]
   * @param {string} [callback= The name of the method to call. Must begin with 'gash.'.]
   */
  function connectCallback(element, callback) {
    var app = UiApp.getActiveApplication();
    var hidden = app.createHidden(element.getId() + '-callback', callback);
    this.getServerHandler().addCallbackElement(hidden);
  }

  /**
   * Shortcut for adding callback elements to the gash server handler.
   *
   * @param {UI element} [element= The element to add.]
   * @param {string} [name= If set, the element will be given this name before being added.]
   */
  function addCallbackElement(element, name) {
    var app = UiApp.getActiveApplication();
    if (name && typeof element.setName == 'function') {
      element.setName(name);
    }
    this.getServerHandler().addCallbackElement(element);
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
    getServerHandler : getServerHandler,
    connectCallback : connectCallback,
    addCallbackElement : addCallbackElement,
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

  // Set some required properties.
  this.id = id;
  this.apiVersion = 0; // Must be overwritten by plugin.
  this.subVersion = 0; // Must be overwritten by plugin.
  this.dependencies = {
    gash : {apiVersion : 2, subVersion : 1},
  };

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
