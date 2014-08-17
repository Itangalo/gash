/**
 * Example of how to use the file upload pseudo widget.
 */

function doGet() {
  var app = UiApp.createApplication();

  // We must have a handler set up before creating the file upload.
  var handler = app.createServerHandler('handlerCallback');
  app.add(gash.createFileUpload('myFile', handler, 'Select a file to upload', 'The file will be added to your Google Drive.'));

  app.add(app.createButton('Do something with the file', handler));

  return app;
}

function handlerCallback(eventInfo) {
  // The ID of the file in Google Drive is stored in the parameters.
  var file = DocsList.getFileById(eventInfo.parameter.myFile);
  // The file was uploaded to the trash. Don't forget to un-trash it.
  file.setTrashed(false);

  // Do whatever you want with the file.
  var app = UiApp.getActiveApplication();
  app.add(app.createLabel('Your file size in bytes: ' + file.getSize()));
  return app;
}
