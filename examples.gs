/**
 * Example of how to use the property get/set functions.
 */

function myFunction() {
  // JSON conversion done behind the scene: You can store/get objects.
  var userData1 = {
    name : 'John Doe',
    age : 35,
    email : 'johndoe@example.com',
  };
  var moreUserData = 'some value';

  // Data is stored using data ID keys. The stored data will be unique to this
  // installation of gash -- it is stored in a script-unique entry.
  gash.setUserData('basicData', userData);
  gash.setUserData('extraData', moreUserData);

  // Similar functions are used for fetching data:
  var evenMoreData = gash.getUserData('dataId');

  // You can set global data in a similar way:
  var someGlobalData = {
    user1 : 'foo',
    user2 : 'bar',
    user3 : 'baz',
  }
  gash.setGlobalData('dataId', someGlobalData);

  // In the special case where you have global data in an object, you can get
  // and set values for only one specified key in the object:
  gash.setGlobalData('dataId', 'hazza', 'user4');
  var subEntry = gash.getGlobalData('dataId', 'user1'); // Gives 'foo'.

  // It might be good to know that since all this data is stored as user or
  // script properties, they have a maximum allowed size of 8 kB. No big data.
}

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

/**
 * Example of how to use areas to build a UI.
 */

function doGet() {
  var app = UiApp.createApplication();

  // First add an area.
  gash.addArea('firstArea');
  // The area is now avaialble as an object you can add widgets to.
  gash.areas.firstArea.add(app.createAnchor('some text', 'http://example.com/'));
  // If you pass a string, it will be converted to a label widget.
  gash.areas.firstArea.add('Quick way of adding a label widget');

  // You can pass an additional parameter to affect the CSS styles of an area.
  gash.addArea('area51', {border : 'thin black solid'});
  // The same goes for widgets added to the area.
  gash.areas.area51.add('Some text', {border : 'thin black solid'});

  var handler = app.createServerHandler('myCallbackFunction');
  gash.areas.firstArea.add(app.createButton('do stuff', handler));

  return app;
}
