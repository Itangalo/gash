/**
 * @file: Plugin for handling tests for gash and gash plugins.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('tests');

p.okMessages = {};
p.errorMessages = {};
p.runTests = false;

/**
 * Page callback used when the test plugin is active.
 */
p.doGet = function(queryParameters) {
  var app = UiApp.getActiveApplication();

  // Shortcut the tests if they should not be run.
  if (this.runTests != true) {
    app.add(app.createLabel('The tests plugin is installed, but is not running tests. It should not be installed on a live environment.').setStyleAttribute('color', 'red'));
    return;
  }

  // Run all tests and print out results.
  app.add(app.createLabel('Running tests...'));
  gash.tests.runTests();

  for (var i in gash.tests.errorMessages) {
    for (var j in gash.tests.errorMessages[i]) {
      app.add(app.createLabel(gash.tests.errorMessages[i][j]).setStyleAttribute('color', 'red'));
    }
  }

  for (var i in gash.tests.okMessages) {
    for (var j in gash.tests.okMessages[i]) {
      app.add(app.createLabel(gash.tests.okMessages[i][j]));
    }
  }
}

/**
 * Runs all tests declared by plugins and collects any thrown errors.
 */
p.runTests = function() {
  okMessages = this.okMessages;
  errorMessages = this.errorMessages;
  for (var i in gash.plugins) {
    okMessages[gash.plugins[i]] = {};
    errorMessages[gash.plugins[i]] = {};
    if (gash[gash.plugins[i]].tests != undefined) {
      for (var t in gash[gash.plugins[i]].tests) {
        try {
          gash[gash.plugins[i]].tests[t]();
          okMessages[gash.plugins[i]][t] = 'Plugin: ' + gash.plugins[i] + ', test: ' + t + ' (ok)';
          Logger.log('Plugin: ' + gash.plugins[i] + ', test: ' + t + ' (ok)');
        }
        catch(e) {
          errorMessages[gash.plugins[i]][t] = 'ERROR: Plugin: ' + gash.plugins[i] + ', test: ' + t + ': ' + e;
          Logger.log('Plugin: ' + gash.plugins[i] + ', test: ' + t + ': ERROR (' + e + ')');
        }
      }
    }
  }
  return true;
}

/**
 * Tests for gash itself.
 */
p.tests = {
  // Check that we cannot overwrite existing plugins.
  preventPluginOverwrite : function() {
    try {
      var r = new gashPlugin('tests');
      throw('Could overwrite plugin name.');
    }
    catch(e) {
    }
  },
  // Check that plugins can't have the same name as existing gash properties.
  preventPropertyOverwrite : function() {
    try {
      var r = new gashPlugin('apiVersion');
      throw('Could overwrite gash property with plugin.');
    }
    catch(e) {
    }
  },
  // Assures that configObjects can use defaults and be overwritten properly.
  configObjectsIntegrity : function() {
    var a = new configObject({'one' : 'one', 'two' : 'two'});
    var b = new configObject({'one' : 'one', 'two' : 'three'});
    a.addDefaults(b);
    if (a.two != 'two') {
      throw 'Defaults overwrite existing properties in config objects.';
    }
    b = b.overwriteWith(a);
    if (b.two != 'two') {
      throw 'Overwriting of config objects fails.';
    }
  }
};
