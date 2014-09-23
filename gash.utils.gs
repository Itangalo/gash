/**
 * @file: Miscellaneous helper functions for gash.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('utils');

p.apiVersion = 1;
p.subVersion = 1;
p.dependencies = {
  gash : {apiVersion : 2, subVersion : 1},
};

/**
 * Builds random integers in a given range, excluding selected numbers.
 *
 * @param {integer} [min= Lowest allowed integer.]
 * @param {integer} [max= Highest allowed integer.]
 * @param {array} [disallowed= An array of values that must not be returned. May also be a single value.]
 * return {integer}
 */
p.randomInt = function(min, max, disallowed) {
  if (Array.isArray(disallowed) != true) {
    disallowed = [disallowed];
  }
  var value = Math.floor(Math.random() * (max - min + 1)) + min;
  if (disallowed.indexOf(value) == -1) {
    return value
  }
  else {
    return this.randomInt(min, max, disallowed);
  }
}

/**
 * Selects a value based on weighted probabilities.
 *
 * @param {object} [values= An object with selectable values as property keys, and associated relative probability as values.]
 * @param {array} [values= Could also be an array with selectable values. If so, they will be weighted with equal probability.]
 * return {string}
 */
p.randomSelect = function(values) {
  // If we are handed an array, simply return a random element.
  if (Array.isArray(values)) {
    return values[Math.floor(Math.random() * values.length)];
  }

  // If we are handed an object, select an element by weighted probability.
  if (typeof values == 'object') {
    var sum = 0, selected;
    for (var i in values) {
      sum = sum + parseFloat(values[i]);
      values[i] = sum;
    }
    selected = Math.random() * sum;
    for (var i in values) {
      if (selected <= values[i]) {
        return i;
      }
    }
  }

  // If it is not an array and not a string, we assume that we have this
  // single value to choose from and simply return it.
  return values;
}

/**
 * Replaces all occurances of the listed replacements, allowing switching of variables and
 * not breaking up large replacements by smaller ones.
 *
 * @param {string} [expression= The string to perform replacements on.]
 * @param {object} [replacements= An object with the strings that should be replaced as keys, with their replacements as values.]
 * return {string}
 */
p.advancedReplacements = function(expression, replacements) {
  var keys = Object.keys(replacements);
  // Sort the function names by length so a replacement a->b doesn't affect a replacement
  // asin->arcsin (by turning asin to bsin).
  keys.sort(function(a, b){
    return b.length - a.length;
  });

  var re = {};
  for (var i in keys) {
    re[keys[i]] = {};
    re[keys[i]].from = keys[i];
    re[keys[i]].to = replacements[keys[i]];
    re[keys[i]].token = '<' + i + '>';
  }

  // First change all replacement patterns into tokens, so we won't replace them
  // indefinitely.
  for (var i in re) {
    while (expression.replace(re[i].from, re[i].token) != expression) {
      expression = expression.replace(re[i].from, re[i].token);
    }
  }

  // Then go over all the replacements again, changing them from the tokens to the
  // target values.
  for (var i in re) {
    while (expression.replace(re[i].token, re[i].to) != expression) {
      expression = expression.replace(re[i].token, re[i].to);
    }
  }

  return expression;
}

/**
 * Recursively merge properties of two objects. Any properties that exists in obj2 are written into obj1.
 *
 * Code taken from http://stackoverflow.com/a/383245/294262.
 */
p.mergeRecursive = function(obj1, obj2) {
  obj1 = this.deepClone(obj1);
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor == Object) {
        obj1[p] = this.mergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}

/**
 * Checks if a given string is a valid url or not.
 *
 * Code taken from http://stackoverflow.com/a/14582229/294262.
 *
 * @param {string} [str= The string check.]
 * return {boolean}
 */
p.isValidUrl = function(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  if(!pattern.test(str)) {
    return false;
  } else {
    return true;
  }
}

/**
 * Builds a url to the current script, optionally with fragments append.
 *
 * Code taken from http://stackoverflow.com/a/14582229/294262.
 *
 * @param {object} [fragments= Query fragments to append to the url, given in the form {key : 'value'}. Values may be arrays.]
 * return {string}
 */
p.getCurrentUrl = function(fragments) {
  var url = ScriptApp.getService().getUrl();
  var append = '';
  for (var i in fragments) {
    if (Array.isArray(fragments[i])) {
      fragments[i] = fragments[i].join(',');
    }
    append += '&' + i + '=' + fragments[i]
  }
  append = append.split('');
  if (append.length > 0) {
    append[0] = '?';
  }
  append = append.join('');
  return url + append;
}

/**
 * Clones an object, preserving its instance. Note that this does NOT clone any objects in properties.
 *
 * Solution taken from http://stackoverflow.com/a/728694/294262.
 *
 * @param {object} [obj= The object to clone.]
 * return {object} [The clone.]
 */
p.instanceClone = function(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

/**
 * Deep-clones an objects of six common types. Note that this does NOT preserve instanceof.
 *
 * Solution taken from http://stackoverflow.com/a/728694/294262.
 *
 * @param {object} [obj= The object to clone.]
 * return {object} [The clone.]
 */
p.deepClone = function(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || typeof obj != 'object') {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = this.clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = this.deepClone(obj[attr]);
      }
    }
    return copy;
  }

  throw 'Unable to copy obj! Its type is not supported.';
}

/**
 * Tests for this plugin.
 */
p.tests = {
  // Make fairly sure that disallowed values are not selected by randomInt.
  disallowedRandom : function() {
    for (var i = 0; i < 10; i++) {
      if (gash.utils.randomInt(-1, 1, [0]) == 0) {
        throw 'Disallowed values generated by randomInt.';
      }
    }
  },
  // Make fairly sure that randomSelect selects based on relative probability.
  disallowedSelect : function() {
    var count = 0;
    for (var i = 0; i < 100; i++) {
      if (gash.utils.randomSelect({'one' : 1, 'hundered' : 100}) == 'one') {
        count++;
      }
    }
    if (count > 5) {
      throw 'selectRandom appears to respect relative probability. Probably.';
    }
  },
  // Assure that advanced replacements works as intended.
  advancedReplacementsTest : function() {
    if (gash.utils.advancedReplacements('a+2bbaa', {a : 'b', b : 'a'}) != 'b+2aabb') {
      throw 'Advanced replacements does not handle switching of variables.';
    }
    if (gash.utils.advancedReplacements('a+2bbaa', {a : 'b', b : 'a', aa : 'c'}) != 'b+2aac') {
      throw 'Advanced replacements allows shorter replacements to break larger ones.';
    }
  },
  // Verify that cloning and deep cloning works as expected.
  cloneTests : function() {
    var obj = {'foo' : 'bar'};
    var conf1 = new configObject({one : 1, two : 2, three : obj});
    var conf2 =  gash.utils.deepClone(conf1);
    // Could not find any way of preserving instanceof and doing deep cloning. :-(
    conf1.three.foo = 'baz';
    if (conf2.three.foo == 'baz') {
      throw 'deepCloning does not implement deep cloning.';
    }
    conf2 = gash.utils.instanceClone(conf1);
    if ((conf2 instanceof configObject) == false) {
      throw 'instanceClone does not preserve instanceof.';
    }
  },
  // Test some url recognizing.
  urlRecognitionTests : function() {
    if (gash.utils.isValidUrl('foo')) {
      throw 'Plain strings are interpreted as url:s';
    }
    if (!gash.utils.isValidUrl('http://example.com')) {
      throw 'Url:s are not recognized.';
    }
    if (!gash.utils.isValidUrl('example.com')) {
      throw 'Domain names are not recognized as url:s.';
    }
  },
  // Test some url recognizing.
  urlBuildTests : function() {
    if (gash.utils.getCurrentUrl().substring(0, 4) != 'http') {
      throw 'getCurrentUrl does not return a sane url.';
    }
    var url = gash.utils.getCurrentUrl({foo : 'bar'});
    if (url.substring(substring.length, substring.length - 8) != '?foo=bar') {
      throw 'getCurrentUrl does not append query fragments correctly.';
    }
    url = gash.utils.getCurrentUrl({foo : ['bar', 'baz']});
    if (url.substring(substring.length, substring.length - 12) != '?foo=bar,baz') {
      throw 'getCurrentUrl does not append array query fragments correctly.';
    }
  },
};
