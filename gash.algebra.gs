/**
 * @file: Helper functions for evaluating algebraic expressions and doing calculations.
 * Requires Parser: See http://silentmatt.com/javascript-expression-evaluator/
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var p = new gashPlugin('algebra');

/**
 * Some constants.
 */
p.CORRECT = 1;
p.CLOSE = 0;
p.INCORRECT = -1;
p.WRONG_FORM = -2;
p.CANNOT_INTERPRET = -3;

/**
 * Configuration object with default settings for gash.math.
 *
 * {integer} [precision= Number of decimals to look at when determining if numerical values are equal. Needed due to float rounding errors.]
 * {integer} [randomTries= The number of times to evaluate expressions with random numbers before assuming that they are equal.]
 * {integer} [minRandom= Lower limit for random numbers inserted to evaluate expressions.]
 * {integer} [maxRandom= Upper limit for random numbers inserted to evaluate expressions.]
 * {boolean} [swedishNotation= Determines whether some filtering should be used, based on Swedish math notation.]
 * return {configObject}
 */
p.defaults = new configObject({
  precision : 10,
  randomTries : 5,
  minRandom : -3,
  maxRandom : 3,
  swedishNotation : true,
});

/**
 * Overwrites the default initialize method. Verifies that the Parser library is in place.
 */
p.initialize = function() {
  if (typeof Parser != 'function') {
    throw 'The algebra plugin requires Parser. See http://silentmatt.com/javascript-expression-evaluator/ for code.';
  }
  return true;
}

/**
 * Parses an expression string, allowing Swedish notation and implicit multiplication.
 *
 * @TODO: Allow passing in more replacement patterns.
 *
 * @param {string} [expressionString= The expression to prepare.]
 * return {string}
*/
function preParseExpression(expressionString, options) {
  options = this.defaults.overwrite(options);
  expressionString = expressionString.toString();

  // Replace any function names in the expression with tokens, so they won't
  // confuse the replacements for implicit multiplication. (All the functions
  // and constants used by Parser can be found as properties in Parser.values.)
  var operators = Object.keys(Parser.values);
  // Sort the function names by length so we replace 'asin' before 'sin'. (This
  // avoids breaking function names.)
  operators.sort(function(a, b){
    return b.length - a.length;
  });

  // Build an object with replacement rules. (The order matters!)
  var re = {};

  if (options.swedishNotation == true) {
    // Turns '2,5' into '2.5', but leaves '(2, 5)' untouched. Good for Swedish people.
    re.commaAsDecimal = {
      expr : /(\d)[,]+(\d)/,
      repl : '$1.$2',
    };
  }

  // Replace function names with tokens. Include opening parenthesis of the function
  // argument, to avoid it being treated as an implicit multiplication.
  for (var i in operators) {
    re['op' + i] = {
      expr : new RegExp(operators[i] + '\\('),
      repl : '<' + i + '>',
    };
  }

  // Special case: The constant PI is understood by Parser, and should be replaced
  // to avoid treating the letters as an implicit multiplication.
  re.pi = {
    expr : /pi/i,
    repl : 'π',
  };
  // Replacements making implicit multiplication explicit:
  // a(x+1)(x+2) becomes a*(x+1)*(x+2). Most of this trick comes from
  // http://stackoverflow.com/questions/20912455/math-expression-parser
  // Cred to Reut Sharabani.
  re.implicit = {
    expr: /([0-9]+|[a-zπ\\)])(?=[a-zπ<\\(])/i,
    repl : '$1*',
  };
  // When implicit multiplications have been taken care of, we can return 'π' to 'PI'.
  re.piBack = {
    expr: /π/,
    repl : 'PI',
  };

  // Return any function names to the expression.
  for (var i in operators) {
    re['opBack' + i] = {
      expr : new RegExp('<' + i + '>'),
      repl : operators[i] + '(',
    };
  }

  // Apply the replacement rules.
  for (var i in re) {
    while (expressionString.replace(re[i].expr, re[i].repl) != expressionString) {
      expressionString = expressionString.replace(re[i].expr, re[i].repl);
    }
  }

  return expressionString;
}

/**
 * Evaluates an expression, with variable values if supplied.
 *
 * If evaluation fails, for any reason, 'undefined' will be returned.
 *
 * @param {string} [expressionString= The expression to evaluate.]
 * @param {object} [variables= any variables and their values, for example '{x : 3, y : 2}'.]
 * @param {configObject} [options= Extra options, including:
 *   allowedOperators {Array} : If set, only the listes operators (or functions) will be used. Useful for evaluating fractions.
 * ]
 * return {float}
 */
p.evaluate = function(expressionString, variables, allowedOperators) {
  // Make sure we have sane arguments.
  if (typeof expressionString != 'string') {
    return;
  }
  if (typeof variables != 'object') {
    variables = {};
  }

  // Make sure all variables (and functions) are lower-case.
  expressionString = expressionString.toLowerCase();
  for (var v in variables) {
    if (v != v.toLowerCase()) {
      variables[v.toLowerCase()] = variables[v];
      delete variables[v];
    }
  }

  // Take care of implicit multiplication and Swedish notation in the expression.
  expressionString = this.preParseExpression(expressionString);

  // Evaluate! Since Parser may throw errors, we need a try statement.
  try {
    // Special handling if we should restrict allowed operators.
    if (Array.isArray(allowedOperators)) {
      var expr = Parser.parse(expressionString);
      // Manipulate ops1, ops2 and functions of the expression object.
      for (var op in {ops1 : 'ops1', ops2 : 'ops2', functions : 'functions'}) {
        for (var i in expr[op]) {
          // Never remove the negative sign as operator.
          if (op == 'ops1' && i == '-') {
            continue;
          }
          if (allowedOperators.indexOf(i) < 0) {
            // We cannot delete the function, since it not a property. Instead we
            // set it to something awkward, which will fail evaluation if the
            // function is used.
            expr[op][i] = undefined;
          }
        }
      }
      return expr.evaluate(variables);
    }
    else {
      return Parser.parse(expressionString).evaluate(variables);
    }
  }
  catch(e) {
    return;
  }
}

/**
 * Compares two mathematic/algebraic expressions, to see if they are the same.
 *
 * Evaluation is done by inserting random numbers in the variables, and see if the expressions
 * evaluate to the same number. Differnt variables may be used for the two expressions, eg.
 * 'x+2y' could be compared to '2b+a' if variables are set to ['x', 'y'] and ['a', 'b'].
 *
 * @param {string} [expression1= The first of the two expressions to compare.]
 * @param {string} [expression2= The second of the two expressions to compare.]
 * @param {string} [var1= Name of variable used in the first expression. If more than one variable is used, variable names should be passed in an array. Defaults to 'x'.]
 * @param {string} [var2= Name of variable used in the first expression. If more than one variable is used, variable names should be passed in an array. Defaults to 'x'.]
 * @param {configObject} [options= Extra options.]
 * return {integer} [
 *   gash.algebra.CORRECT if expressions are the same.
 *   gash.algebra.INCORRECT if expressions are not the same.
 *   gash.algebra.CANNOT_INTERPRET if something is wrong.]
 */
p.compareExpressions = function(expression1, expression2, var1, var2, options) {
  options = this.defaults.overwrite(options);
  var1 = var1 || 'x';
  var2 = var2 || var1;
  if (typeof var1 == 'string') {
    var1 = [var1];
  }
  if (typeof var2 == 'string') {
    var2 = [var2];
  }
  // We should now have two arrays with variable names, and there should be the same
  // number of variables in them.
  if (Array.isArray(var1) != true || Array.isArray(var2) != true || var1.length != var2.length) {
    return this.CANNOT_INTERPRET;
  }
  var x, vars1 = {}, vars2 = {}, val1, val2, tries = 0;

  // Run five evaluations of random numbers between -5 and 5, to see if the expressions
  // yield the same values. (Yes, this is an ugly way of comparing the expressions. But
  // it is cheap and it works for the practical purposes.)
  for (var i = 0; i < options.randomTries; i++) {
    for (var v in var1) {
      x = Math.random() * (options.maxRandom - options.minRandom) + options.MinRandom;
      vars1[var1[v]] = x;
      vars2[var2[v]] = x;
    }
    val1 = this.evaluate(expression1, vars1);
    val2 = this.evaluate(expression2, vars2);

    // The expressions may be undefined for these variable values. This check allow trying
    // again, but aborts if we've tried more than ten times. (The expressions might just be
    // juble, and impossible to evaluate alltogether.)
    if (val1 == undefined && val2 == undefined) {
      i--;
      tries++;
      if (tries > options.randomTries * 2) {
        return this.CANNOT_INTERPRET;
      }
      continue;
    }
    // If one expression value is undefined, but not the other, they cannot be the same.
    if ((val1 == undefined && val2 != undefined) || (val1 != undefined && val2 == undefined)) {
      return this.INCORRECT;
    }

    // Finally, we compare the numeric values of the expressions. The rounding here is to
    // prevent calculation errors to give false negative results.
    if (val1.toFixed(this.defaults.precision) != val2.toFixed(this.defaults.precision)) {
      return this.INCORRECT;
    }
  }
  // If we got this far, the expressions are most likely the same.
  return this.CORRECT;
}