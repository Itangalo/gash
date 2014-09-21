/**
 * @file: Miscellaneous helper functions for gash.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('utils');

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