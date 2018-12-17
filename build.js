const fs = require('fs');

const wrap = s => '\n(function(){"use strict";' + s + '\n})();';

const cleanComments = s => s.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
const cleanMultySpaces = s => s.replace(/\n{2,}/gm, '\n');

const pachageInfo = JSON.parse(fs.readFileSync('./package.json'));

const order = [
  'core/core',
  'core/utils',
  'doc/doc_lib',
  'core/utils_object',
  'core/events',
  'core/js_type',
  'core/function',
  'core/anything',
  'core/is',
  'core/expect',
  'core/observable',
  'core/type',
  'core/simple_types',
  'core/logic',
  'core/value',
  'types/obj',
  'types/box',
  'types/rbox',
  'types/err',
  'types/single',
  'types/arr',
  'types/num',
  'types/str',
  'types/pointer',
  'types/bool',
//  'core/interface',
  'types/range',
  'html/html',
  'html/tags',
  'html/inputs'
];


let src = ';let nice;(function(){let create,Div,Func,Switch,expect,is,_each,def,defAll,defGet,Anything,Box,Action,Mapping,Check,reflect;' +
  order.map(name => fs.readFileSync('./' + name + '.js'))
    .map(wrap)
    .map(cleanComments)
    .map(cleanMultySpaces)
    .join('');

src += `;nice.version = "${pachageInfo.version}";})();`;

fs.writeFileSync('nice.js', src);

fs.writeFileSync(
  'index.js',
  'module.exports = function(){' + src + '; return nice;}'
);

const nice = require('./index.js')();

nice.runTests();

fs.writeFileSync('./doc/doc.json', JSON.stringify(nice.generateDoc()));