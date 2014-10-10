gash
====

gash (Google Apps Script helpers) is a plugin based framework to make it easier
to write Google scripts.

At the moment, gash provides the following plugins:

* gash.utils: A number of often-used functions, for example for getting random
  integers and selecting random items from a list and deep-merging objects.
* gash.tests: Allows running automated tests on gash and gash plugins. Should
  not be installed on a live site (since it slows down the load), but should
  definitely be installed in the development environment.
* gash.data: Allows using parse.com for storing, retrieving and searching data.
  Requires that you set up an account (free) on parse.com and that you provide
  API and REST keys. Good alternative to the deprecated database in GAS.
* gash.areas: Provides a framework for declaring UI areas, to which UI elements
  can be added. Also has mechanisms for managing default style attributes for
  areas.
* gash.math: Provides some math and LaTeX functionality such as recognizing
  fractions, building random binomials, converting LaTeX expression to image
  elements, parsing coordinates from text input, counting the number of terms in
  a mathematical expression, and drawing graphs.
* gash.algebra: Provides some quite advanced algebraic tools, such as evaluating
  mathematical expressions (including variables and common functions),
  determining if two algebraic expressions are mathematically the same, and
  determining if two equations are mathematically the same. Requires the Parser
  library found at http://silentmatt.com/javascript-expression-evaluator/ (which
  should just be added as a separate script file).

There is an example file which needs updating, but gives a basic example of how
to use some of the functionality in gash.

Other projects may create their own gash plugins. See
https://github.com/Itangalo/waxon for an example.

Note: This work is ongoing and kind of experimental. Suggestions and
improvements are very welcome.
