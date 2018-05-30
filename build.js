const fs = require('fs');

const wrap = s => '\n(function(){"use strict";' + s + '\n})();';

const cleanComments = s => s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
const cleanMultySpaces = s => s.replace(/\n{2,}/gm, '\n');


const order = [
  'core/core',
  'core/utils',
  'core/utils_object',
  'core/events',
  'core/js_type',
  'core/function',
  'core/is',
  'core/expect',
  'core/type',
  'core/simple_types',
  'core/value',
  'types/object',
  'types/box',
  'types/error',
  'types/single',
  'types/array',
  'types/number',
  'types/string',
  'types/boolean',
  'core/interface',
  'types/range',
  'html/html',
  'html/tags',
  'html/inputs'
];


let src = ';let nice;(function(){let create,Div,Func,Switch,expect,is,_each,def,defAll,defGet,Box,Action,Mapping,Check;' +
  order.map(name => fs.readFileSync('./' + name + '.js'))
    .map(wrap)
    .map(cleanComments)
    .map(cleanMultySpaces)
    .join('');

src += ';})();';

fs.writeFileSync('nice.js', src);

fs.writeFileSync(
  'index.js',
  'module.exports = function(){' + src + '; return nice;}'
);

const nice = require('./index.js')();
fs.writeFileSync('./doc/doc.json', JSON.stringify(nice.doc()));