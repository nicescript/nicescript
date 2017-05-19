const fs = require('fs');

var wrap = s => '\n(function(){"use strict";' + s + '\n})();';

var order = [
  'core/core',
  'core/utils',
  'core/type',
  'core/collection',
  'core/is',
  'core/item',
  'core/subscription',
  'core/transaction',
  'core/error',
  'core/value_string',
  'core/value_boolean',
  'core/value_number',
  'core/value_array',
  'core/value_map',
  'core/value_object',
  'core/function',
  'core/class',
  'core/expect',
  'div/div',
  'div/tags',
  'div/paged_list',
  'div/inputs'
];


var src = ';var nice = {}, Div;' +
  order.map(name => fs.readFileSync('./' + name + '.js'))
    .map(wrap)
    .join('');

fs.writeFileSync('nice.js', src);

fs.writeFileSync(
  'index.js',
  'module.exports = function(){' + src + '; return nice;}'
);
