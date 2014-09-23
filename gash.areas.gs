/**
 * @file: Helper functions for UI in Google Apps Script.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('areas');

p.apiVersion = 1;
p.subVersion = 1;
p.dependencies = {
  gash : {apiVersion : 2, subVersion : 1},
  utils : {apiVersion : 1, subVersion : 1},
};

/**
 * Default configuration for areas.
 */
p.defaults = new configObject({
  areaAttributes : {overflow : 'auto'},
  scrollAttributes : {},
  containerAttributes : {},
  elementAttributes : {},
});

/**
 * Array containing area IDs. Populated by the gashArea constructor.
 */
p.areas = [];

/**
 * Builds the areas on page loads.
 */
p.doGet = function(queryParameters) {
  gash.areas.buildAreas();
}

/**
 * Finds all declared areas and adds them to the active UI.
 *
 * return {}
 */
p.buildAreas = function() {
  var id;
  var app = UiApp.getActiveApplication();

  var options;
  for (var i in this.areas) {
    id = this.areas[i];
    options = this[id].defaults;
    // Merge any custom options declared by the plugins with default configuration,
    // then add the panels constituting the area.
    var captionPanel = app.createCaptionPanel(options.label || '').setId(id + '-wrapper').setStyleAttributes(options.areaAttributes);
    var scrollPanel = app.createScrollPanel().setId(id + '-scroll').setStyleAttributes(options.scrollAttributes);
    if (options.horizontal == true) {
      var container = app.createHorizontalPanel().setId(id).setStyleAttributes(options.containerAttributes);
    }
    else if (options.vertical == true) {
      var container = app.createVerticalPanel().setId(id).setStyleAttributes(options.containerAttributes);
    }
    else {
      var container = app.createFlowPanel().setId(id).setStyleAttributes(options.containerAttributes);
    }
    captionPanel.add(container);
    app.add(captionPanel);
  }
  return;
}

/**
 * Class for gash areas, initializing the area. The actual drawing is done by gash.area.buildAreas().
 *
 * @param {string} [id= The unique id of this area.]
 * @param {configObject} [options= Any options, overriding gash.areas.defaults.]
 * return {gashArea}
 */
function gashArea(id, options) {
  if (gash.areas[id] != undefined) {
    throw 'Cannot add area with ID ' + id + ': Name is taken.';
  }
  // Add the ID to the area ID list, and add a reference to the area to gash.areas.
  gash.areas.areas.push(id);
  this.id = id;
  gash.areas[id] = this;

  // Add default settings to the area object.
  options = gash.utils.mergeRecursive(gash.areas.defaults, options);
  this.defaults = options;
  return this;
}

/**
 * Adds a UI element to an area.
 *
 * @param {UiElement} [element= A UI element for GAS, or a string. A url string will be added as a link, otherwise as a plain label.]
 * @param {configObject} [options= Any options, overriding the defaults for this area.]
 * return {gashArea}
 */
gashArea.prototype.add = function(element, options) {
  options = gash.utils.mergeRecursive(this.defaults.elementAttributes, options);
  var app = UiApp.getActiveApplication();
  var container = app.getElementById(this.id);
  if (typeof element == 'string') {
    if (gash.utils.isValidUrl(element)) {
      element = app.createAnchor(element, element);
    }
    else {
      element = app.createLabel(element);
    }
  }
  container.add(element);

  if (typeof element.setStyleAttributes == 'function') {
    element.setStyleAttributes(options);
  }
  return this;
}

/**
 * Clears all elements in the area.
 *
 * return {gashArea}
 */
gashArea.prototype.clear = function() {
  var app = UiApp.getActiveApplication();
  container = app.getElementById(this.id).clear();
  return this;
}
