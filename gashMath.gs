/**
 * @file: Some helper functions for using math in Google Apps Scripts.
 */

/**
 * This project is licensed under GNU general public license. Feel free to
 * use, study, share and improve. See https://github.com/Itangalo/gash/ for
 * source code and license details.
 */

var gashMath = (function () {
  // Creates a graph of a given function, in a given interval.
  function createGraph(f, min, max, options) {
    // Set some default values.
    if (typeof f != 'function') {
      f = function (x) {return x};
    }
    min = gash.addDefaults(min, -5);
    max = gash.addDefaults(max, 5);
    options = options || {};
    var defaultOptions = {
      title : false,
      xTitle : false,
      yTitle : false,
      fTitle : false,
      width : 320,
      height : 200,
      steps : 100,
      pointStyle : Charts.PointStyle.TINY,
      opacity : 0,
      lineWidth : 1,
      color : 'blue',
    }
    options = gash.addDefaults(options, defaultOptions);
    
    // Build a table with points to plot.
    var points = Charts.newDataTable().addColumn(Charts.ColumnType.NUMBER, 'x').addColumn(Charts.ColumnType.NUMBER, options.fTitle || 'y');
    var step = (max - min) / (options.steps + 1);
    for (var i = min; i <= max; i = i + step) {
      if (!isNaN(f(i))) {
        points.addRow([i, f(i)]);
      }
      else {
        Logger.log(i);

      }
    }
    points.build();
    
    // Build a graph and apply some settings to it.
    var graph = Charts.newScatterChart().setDataTable(points).setDimensions(options.width, options.height).setColors([options.color]);
    // Display the points as a smooth curve, rather than a scatter plot.
    graph.setPointStyle(options.pointStyle).setOption('dataOpacity', options.opacity).setOption('lineWidth', options.lineWidth).setOption('curveType', 'function');
    // Some optional options for titles and labels.
    graph.setXAxisRange(min, max);
    if (options.fTitle == false) {
      graph.setLegendPosition(Charts.Position.NONE);
    }
    if (options.title) {
      graph.setTitle(options.title);
    }
    if (options.xTitle) {
      graph.setXAxisTitle(options.xTitle);
    }
    if (options.yTitle) {
      graph.setYAxisTitle(options.yTitle);
    }
    
    return graph.build();
  }
  
  return {
    createGraph : createGraph,
  }
}) ();
