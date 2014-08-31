/**
 * Example of how to use the property get/set functions.
 */
function myFunction() {
  // gash makes it easier to store properties that are objects (which GAS
  // doesn't support natively). Example:
  var userData = {
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
  // and set values for only one specified key in the object. This example will
  // add the property 'user4' to they global data object 'dataId':
  gash.setGlobalData('dataId', 'hazza', 'user4');
  // In a similar way, you can access a selected property from a global object,
  // instead of the full object.
  var subEntry = gash.getGlobalData('dataId', 'user1'); // Gives 'foo'.

  // It might be good to know that since all this data is stored as user or
  // script properties, they have a maximum allowed size of 8 kB. No big data.
}

/**
 * Example of how to make query parameters globally accessible.
 */
function doGet(queryInfo) {
  gash.storeQueryInfo(queryInfo);
  // Query parameters can now be accessed through gash.queryParameters. All
  // parameters are stored as arrays. Their value(s) can be set in the path by
  // adding queries of the type ?foo=value1,value2&bar=value3. This example
  // would yield gash.queryParameters = {
  //   foo : ['value1', 'value2'],
  //   bar : ['value3']
  // }

  // Then go on to call other functions, which may or may not use the query
  // parameters.
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

  // The areas can take additional parameters. The following example createas
  // an area with caption 'Secrets' with blue background, and where added
  // widgets by default have font size 20px.
  gash.addArea('area51', 'Secrets', {fontSize: '20px'}, {backgroundColor : 'blue'});
  // You can override the default widgets for the area in a similar way:
  gash.areas.area51.add('Some text', {fontSize : '36px'});

  // Global default styles for areas and widgets are stored in properties of
  // the gash object. Use these if you for example want to change the width of
  // all areas, or all text sizes.
  Logger.log(gash.defaultWrapperAttributes);
  Logger.log(gash.defaultWidgetAttributes);

  return app;
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
