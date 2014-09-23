/**
 * @file: Helper functions for managing math stuff. See also the algebra plugin.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('math');

/**
 * Configuration object with default settings for gash.math.
 *
 * {integer} [maxSearchDenominator= Limit used when identifying fractions.]
 * {integer} [precision= Number of decimals to look at when determining if numerical values are equal. Needed due to float rounding errors.]
 * {integer} [maxDenominator= Limit used when creating random fractions.]
 * {integer} [minCoefficient= Lower limit used when creating random coefficients.]
 * {integer} [maxCoefficient= Upper limit used when creating random coefficients.]
 * {object} [randomVariables= List for selecting random variables, given with relative probability.]
 * {string} [latexDpi= Resolution to use for LaTeX images. See http://www.codecogs.com/latex/eqneditor.php.]
 * {string} [latexFont= The font to use for LaTeX images. See http://www.codecogs.com/latex/eqneditor.php.]
 * {boolean} [swedishNotation= Determines whether some filtering should be used, based on Swedish math notation.]
 * return {configObject}
 */
p.defaults = new configObject({
  maxSearchDenominator : 24,
  precision : 10,
  maxDenominator : 3,
  minCoefficient : -3,
  maxCoefficient : 3,
  randomVariables : {x : 5, y : 2, s : 1, t : 1, a : 1, b : 1, r : 1},
  latexDpi : '150',
//  latexFont : '\\fn_jvn', // Verdana
//  latexFont : '\\fn_cs', // Comic sans
  latexFont : '', // Latin modern (default)
  swedishNotation : true,
});

/**
 * Some constants.
 */
p.CORRECT = 1;
p.CLOSE = 0;
p.INCORRECT = -1;
p.WRONG_FORM = -2;
p.CANNOT_INTERPRET = -3;

/**
 * Builds a random fraction.
 *
 * @param {float} [min= The smallest allowed fraction. See gash.math.defaults.]
 * @param {float} [max= The smallest allowed fraction. See gash.math.defaults.]
 * @param {array} [disallowed= An array of values that must not be returned. May also be a single value.]
 * @param {integer} [maxDenominator= The largest allowed denominator. See gash.math.defaults.]
 * return {object} [An object with properties n (nominator) and d (denominator).]
 */
p.randomFraction = function(min, max, disallowed, maxDenominator) {
  var options = this.defaults.overwriteWith({
    minCoefficient : min,
    maxCoefficient : max,
    maxDenominator : maxDenominator
  });
  if (Array.isArray(disallowed) != true) {
    disallowed = [disallowed];
  }
  for (var i in disallowed) {
    disallowed[i] = Math.round(disallowed[i] * options.maxDenominator);
  }

  min = Math.round(options.minCoefficient * options.maxDenominator);
  max = Math.round(options.maxCoefficient * options.maxDenominator);
  return this.findFraction(gash.utils.randomInt(min, max, disallowed) / options.maxDenominator);
}

/**
 * Tries to build a fraction from a float.
 *
 * @param {float} [a= A numeric value that should be converted to a fraction.]
 * @param {integer} [maxDenominator= The largest denominator to try. See gash.math.defaults.]
 * return {object} [An object with properties n (nominator) and d (denominator). If no matching fraction is found, denominator is 1 and nominator is set to the input number.]
 */
p.findFraction = function(a, maxDenominator) {
  a = parseFloat(a);
  maxDenominator = parseInt(maxDenominator || this.defaults.maxSearchDenominator);
  var denominator = 1;
  while (denominator <= maxDenominator) {
    if (Math.round(a * denominator) == (a * denominator).toFixed(this.defaults.precision)) {
      return {
        n : Math.round(a * denominator),
        d : denominator,
      }
    }
    denominator++;
  }
  return {
    n : a,
    d : 1
  };
}

/**
 * Returns the greatest common denominator for integers a and b.
 *
 * Clever recursive solution taken from http://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
 *
 * @param {integer} [a= An integer to examine, e.g. 12.]
 * @param {integer} [b= Another integer to examine, e.g. 15.]
 * return {integer} [The greatest common denominator for a and b, e.g. 3.]
 */
p.gcd = function(a, b) {
  if ( ! b) {
    return a;
  }
  return this.gcd(b, a % b);
};

/**
 * Builds a random binomial on the form 'ax + b' or 'a + bx'.
 *
 * @param {integer} [min= Lower limit for the coefficient and constant. See gash.math.defaults.]
 * @param {integer} [min= Upper limit for the coefficient and constant. See gash.math.defaults.]
 * @param {configObject} [options= Extra options determining the behaviour of the binomial. Options include:
 *   mode : Set to 'straight' to only use 'ax + b'. Set to 'reverse' to only use 'a + bx'. Defaults to random between the two.
 *   maxDenominator : Determines maximum allowed denominator in coefficients. See gash.math.defaults.
 *   variable : The name of the variable to use. See gash.math.defaults.
 * ]
 * return {object} [An object with two properties:
 *   expression: A string with the expression, with coefficients given as floats.
 *   latex: A string with a LaTeX expression, prettified and represented as a fraction if possible.
 * ]
 */
p.randomBinomial = function(min, max, options) {
  options = this.defaults.overwriteWith(options);
  var maxDenominator = parseInt(Math.max(options.maxDenominator.toFixed(0), 1));
  var variable = options.variable || gash.utils.randomSelect(options.randomVariables);
  var mode = options.mode || gash.utils.randomSelect(['straight', 'reverse']);
  var frac = this.randomFraction(min, max, [0], options.maxDenominator);
  var a = frac.n / frac.d;
  frac = this.randomFraction(min, max, [0], options.maxDenominator);
  var b = frac.n / frac.d;

  var latex = '';
  var expression = '';
  var keepOnes = new configObject({maxDenominator : maxDenominator});
  var skipOnes = new configObject({maxDenominator : maxDenominator, skipOnes : true});

  switch (mode) {
    case 'reverse' :
      if (b > 0) {
        expression += a + '+' + b + variable;
        latex += this.latexFraction(a, keepOnes) + '+' + this.latexFraction(b, skipOnes) + variable;
      }
      else {
        expression += a + '' + b + variable;
        latex += this.latexFraction(a, keepOnes) + '-' + this.latexFraction(Math.abs(b), skipOnes) + variable;
      }
      break;
    default :
      if (b > 0) {
        expression += a + variable + '+' + b;
        latex += this.latexFraction(a, skipOnes) + variable + '+' + this.latexFraction(b, keepOnes);
      }
      else {
        expression += a + variable + b;
        latex += this.latexFraction(a, skipOnes) + variable + '-' + this.latexFraction(Math.abs(b), keepOnes);
      }
      break;
  }
  return {
    expression : expression,
    latex : latex
  };
}

/**
 * Tries to build a LaTeX fraction expression representing a given number.
 *
 * @param {float} [a= The number that should be represented as a fraction.]
 * @param {configObject} [options= Extra options determining how to represent the fraction. Options include:
 *   maxSearchDenominator : Determines maximum allowed denominator in coefficients. See gash.math.defaults.
 *   skipOnes : If set to true, a '1' result will be omitted and a '-1' result will be only '-'. Useful if the fraction should be used as a coefficient.
 * ]
 * return {string} [A LaTeX fraction expression. If no matching fraction is found, the input number. Beware: This is probably a number with a lot of decimals.]
 */
p.latexFraction = function(a, options) {
  options = this.defaults.overwriteWith(options);

  a = this.findFraction(parseFloat(a), options.maxSearchDenominator);
  if (a.d == 1) {
    if (a.n == 1 && options.skipOnes == true) {
      return '';
    }
    if (a.n == -1 && options.skipOnes == true) {
      return '-';
    }
    return a.n;
  }
  else {
    return '\\frac{' + a.n + '}{' + a.d + '}';
  }
}

/**
 * Uses the webservice latex.codecogs.com for building a png from LaTeX expression.
 *
 * @param {string} [expression= The LaTeX expression.]
 * @param {configObject} [options= Extra options for controlling the LaTeX rendering. Options include:
 *   latexDpi : Determines resolution (and screen size) of the image. See gash.math.defaults.
 *   latexFont : Determines which font to use. Explore http://www.codecogs.com/latex/eqneditor.php for perculiar options.
 * ]
 * return {Image} [A GAS image element with the LaTeX expression.]
 */
p.latex2image = function(expression, options) {
  options = this.defaults.overwriteWith(options);
  expression = expression.toString();

  var replacements = {
    '*' : ' \\cdot '
  };
  if (options.swedishNotation) {
    replacements['.'] = ',';
    replacements[','] = '{,}';
  }
  else {
  }

  for (var i in replacements) {
    expression = expression.replace(i, replacements[i]);
  }
  var app = UiApp.getActiveApplication();
  return app.createImage('http://latex.codecogs.com/png.latex?\\dpi{' + options.latexDpi + '} ' + options.latexFont + ' ' + expression);
}

/**
 * Tries to count the number of terms in an expression. (Succeeds with most sane expressions.)
 *
 * @param {expression} [expression= The expression.]
 * return {integer} [The number of terms in the expression.]
 */
p.numberOfTerms = function(expression) {
  expression = expression.trim();
  var simpleSplit = expression.match(/[+-]+/g) || [];
  var negativeSigns = expression.match(/[+-][\D\W][+-]/g) || [];
  if (expression.substring(0, 1) == '+' || expression.substring(0, 1) == '-') {
    negativeSigns.push('-');
  }

  return simpleSplit.length - negativeSigns.length + 1;
}

/**
 * Converts a string with coodinates into an object where x and y coordinates can be read.
 *
 * @param {string} [coordinateString= The string with coordinates, e.g. '(1,4)'.]
 * return {object} [
 *   x : The x coordinate, as a string.
 *   y : The y coordinate, as a string.
 *   code : If parsing is ambivalent, this is set to gash.math.CANNOT_PARSE.
 *          If the string cannot be interpreted as a coordinate, it is set to gash.math.WRONG_FORM.
 *   message : If parsing failed, this contains a clear-text message that could be displayed to the user.
 */
p.parseCoordinate = function(coordinateString) {
  coordinateString = coordinateString.trim();
  var coordinates = {};

  // Strip off parentheses.
  if (coordinateString.length == 0) {
    return {
      code : -2,
      message : 'You have not entered any coordinate.'
    }
  }
  if (coordinateString.substring(0, 1) != '(' || coordinateString.substring(coordinateString.length - 1, coordinateString.length) != ')') {
    return {
      code : this.WRONG_FORM,
      message : 'Coordinates should be given withing paranthesis, e.g. "(1, 4)".'
    }
  }
  coordinateString = coordinateString.substring(1, coordinateString.length - 1);

  // Try splitting with ';' or ','.
  if (coordinateString.split(';').length == 2) {
    coordinates.x = coordinateString.split(';')[0];
    coordinates.y = coordinateString.split(';')[1];
  }
  else if (coordinateString.split(',').length == 2) {
    coordinates.x = coordinateString.split(',')[0];
    coordinates.y = coordinateString.split(',')[1];
  }
  // If this doesn't work, try splitting with ', '.
  else if (coordinateString.split(', ').length == 2) {
    coordinates.x = coordinateString.split(', ')[0];
    coordinates.y = coordinateString.split(', ')[1];
  }
  // We fail to separate two coordinate values. Analyze and return an error.
  else {
    if (coordinateString.split(',').length > 2) {
      return {
        code : this.CANNOT_PARSE,
        message : 'Could not understand your coordinate. Please separate x and y values with semicolon if you use comma as a decimal sign.'
      }
    }
    if (coordinateString.split(',').length < 2 && coordinateString.split(';').length < 2) {
      return {
        code : this.WRONG_FORM,
        message : 'Your expression does not seem to contain both x and y coordinates.'
      }
    }
    else {
      return {
        code : this.WRONG_FORM,
        message : 'Your input could not be interpreted. Please enter a coordinate in a valid form.'
      }
    }
  }

  return coordinates;
}

/**
 * Tests for this plugin.
 */
p.tests = {
  // Make sure that findFraction works as expected.
  findFractionIntegrity : function() {
    var a = gash.math.findFraction(1 / 7);
    if (a.n != 1 || a.d != 7) {
      throw 'fractionFinder cannot identify simple fractions properly.';
    }
    a = gash.math.findFraction(98 / 99);
    if (a.n != 98/99 || a.d != 1) {
      throw 'fractionFinder does not return non-found fractions properly.';
    }
    a = gash.math.findFraction(98 / 99, 99);
    if (a.n != 98 || a.d != 99) {
      throw 'fractionFinder cannot identify advanced fractions properly.';
    }
  },
  // Make fairly sure that disallowed values are not selected by randomFraction.
  disallowedRandomFraction : function() {
    for (var i = 0; i < 10; i++) {
      if (gash.math.randomFraction(-1, 1, [0], 2).n == 0) {
        throw 'Disallowed values generated by randomFraction.';
      }
    }
  },
  // Assure some basic functionality of randomBinomial.
  randomBinomialIntegrity : function() {
    var options = {maxDenominator : 1};
    var biniomial;
    for (var i = 0; i < 10; i++) {
      binomial = gash.math.randomBinomial(-3, 3, options);
      if (binomial.expression.indexOf('.') != -1) {
        throw 'randomBinomial creates fraction coefficients, even when asked not to.';
      }
    }
    options = {maxDenominator : 2, variable : 'z', mode : 'straight'};
    binomial = gash.math.randomBinomial(.4, .6, options);
    if (binomial.latex != '\\frac{1}{2}z+\\frac{1}{2}') {
      throw 'randomBinomial does not utilize options correctly.';
    }
    options = {maxDenominator : 3, variable : 'z', mode : 'reverse'};
    binomial = gash.math.randomBinomial(-.4, -.3, options);
    if (binomial.latex != '\\frac{-1}{3}-\\frac{1}{3}z') {
      throw 'randomBinomial does not use negative coefficients correctly.';
    }
  },
  // Verifies basic functionality in latexFraction.
  latexFractionIntegrity : function() {
    if (gash.math.latexFraction(0.5) != '\\frac{1}{2}') {
      throw 'latexFraction is broken.';
    }
    var options = {maxSearchDenominator : 3};
    if (gash.math.latexFraction(0.1, options) != '0.1') {
      throw 'Handling of maximum denominator in latexFraction is broken.';
    }
    options = {skipOnes : true};
    if (gash.math.latexFraction(1, options) != '' || gash.math.latexFraction(-1, options) != '-') {
      throw 'Skipping ones is broken.';
    }
  },
  // Verify that latex2image returns something that behaves like an image.
  latex2imageTests : function() {
    var image = gash.math.latex2image('x^2');
    try {
      image.setVisibleRect(1, 1, 2, 2);
    }
    catch(e) {
      throw 'latex2image does not return a proper image.';
    }
  },
  // Try some edge cases for counting number of terms.
  numberOfTermsEdgeCases : function() {
    if (gash.math.numberOfTerms('1+2+-3') != 3) {
      throw 'Failed to find three terms in "1+2+-3".';
    }
    if (gash.math.numberOfTerms('1+2+(-3)') != 3) {
      throw 'Failed to find three terms in "1+2+(-3)".';
    }
    if (gash.math.numberOfTerms('1a+2b-3c') != 3) {
      throw 'Failed to find three terms in "1a+2b-3c".';
    }
  },
  // Try some edge cases for parsing coordinates.
  parseCoordinateEdgeCases : function() {
    if (gash.math.parseCoordinate('(1,2, 3)').x != '1,2') {
      throw 'Failed to identify coordinates in "(1,2, 3)".';
    }
    if (gash.math.parseCoordinate('(1,2)').x != '1') {
      throw 'Failed to identify coordinates in "(1,2)".';
    }
    if (gash.math.parseCoordinate('(1,2;3,4)').y != '3,4') {
      throw 'Failed to identify coordinates in "(1,2;3,4)".';
    }
  },
};
