/**
 * @file: Pseudo widgets to make Google scripting easier.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('widgets');

p.apiVersion = 1;
p.subVersion = 1;
p.dependencies = {
  gash : {apiVersion : 2, subVersion : 2},
};

/**
 * Creates a pseudo widget for file upload, storing a file in Google Drive.
 *
 * The file will be uploaded to the user's trash on Google Drive, and the ID
 * of the file will be stored in the hidden element provided by this widget. (The
 * hidden element can be added to a handler, for further processing of the file.)
 * This is a workaround to allow file uploads to be used in kind of normal UI.
 * Note that this function depends on the doPost() function provided by gash.
 *
 * @param {string} [id= The ID to use for the file widget.]
 * @param {object} [options= Extra options for displaying the file upload:
 *   label : Any text to display above the file upload box.
 *   popup : Any text to display as a title popup.
 *   ]
 * return {object} [
 *   A UI object of type 'hidden', which contains/will contain the file ID on Google Drive.
 *   Property name is the provided ID.
 *   A form panel containing a file upload. Property name customized by this function,
 *   and used for internal purposes.]
 */
p.createFileUpload = function(id, options) {
  options = options || {};
  var output = {};
  var app = UiApp.getActiveApplication();

  // This is where the file ID will be stored.
  output[id] = app.createHidden(id).setId(id);

  // This is the form that will upload the file.
  var form = app.createFormPanel().setId('gash.widgets.createFileUpload-' + id + '-form');
  if (typeof options.popup == 'string') {
    form.setTitle(options.popup);
  }

  var wrapper = app.createVerticalPanel().setId(id + '-wrapper');
  if (typeof options.label == 'string') {
    wrapper.add(app.createLabel(options.label).setId(id + '-label'));
  }

  wrapper.add(app.createFileUpload().setId(id + '-upload').setName(id + '-upload'));
  wrapper.add(app.createSubmitButton('upload').setId(id + '-submit'));

  form.add(wrapper)
  output['gash.widgets.createFileUpload-' + id + '-form'] = form;

  return output;
}

// Function required by the file upload pseudo widget. Called by gash on doPost events.
p.doPost = function(eventInfo) {
  // Abort if the post event does not belong to this plugin.
  var parts = eventInfo.parameter.formId.split('-');
  if (parts[0] != 'gash.widgets.createFileUpload') {
    return;
  }

  var app = UiApp.getActiveApplication();
  // Extract the id to use for the file storing.
  var name = parts[1];
  // Create a file a store it in the user's trash on Google Drive. (Storing it in the trash
  // allows the user to abort the script at any time, and not have extra files lying around.)
  var file = DocsList.createFile(eventInfo.parameter[name + '-upload']);
  file.setTrashed(true);
  var hidden = app.getElementById(name);
  hidden.setValue(file.getId());
}

/**
 * Tests for this plugin.
 */
p.tests = {
};
