const fs = require('fs');
const espree = require('espree');
const estraverse = require('estraverse');
const terser = require("terser");

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
  'core/anything',
  'core/type',
  'core/compile_function',
  'core/function',
  'core/tests',
  'core/is',
  'core/expect',
  'core/spy',
  'core/simple_types',
  'box/box',
  'box/box_set',
  'box/box_map',
  'box/r_box',
  'box/interval_box',
  'box/model',
  'core/stream',
  'core/logic',
  'core/value',
  'types/obj',
  'types/err',
  'types/single',
  'types/str',
  'types/arr',
  'types/num',
  'types/bool',
  'types/range',
  'html/html',
  'html/tags',
  'html/inputs',
  'html/routing',
  'core/core_tests'
];


let src = 'let nice;(function(){let create,Div,NotFound,Func,Test,Switch,expect,is,_each,def,defAll,defGet,Anything,Action,Mapping,Check,reflect,Err,each;' +
  order.map(name => fs.readFileSync('./' + name + '.js'))
    .map(wrap)
    .map(cleanComments)
    .map(cleanMultySpaces)
    .join('');

src += `;nice.version = "${pachageInfo.version}";})();`;

fs.writeFileSync('nice.js', src);
fs.writeFileSync('nice.min.js', removeTests(src));
//TODO: fix or remove
//terser.minify(removeTests(src))
//  .then(min => fs.writeFileSync('nice.min.js', min.code));

const nodeSrc = 'module.exports = function(){' + src + '; return nice;}';
fs.writeFileSync('index.js', nodeSrc);


const nice = require('./index.js')();

const blackList = ['class', 'try', 'with','super'];
fs.writeFileSync( 'nice.mjs',
  src + '; export let '
  + Object.getOwnPropertyNames(nice)
      .filter(k => !blackList.includes(k))
      .map(k => `${k} = nice.${k}`).join(',')
  + '; export default nice;' );


nice.runTests();

fs.writeFileSync('./doc/doc.json', JSON.stringify(nice.generateDoc()));


function removeTests(source) {
    const nodes = [];
    const tree = espree.parse(source, { ecmaVersion: 2022 });

    estraverse.traverse(tree, {
        enter: function (node, parent) {
          const f = node.callee;
          if(node.type === 'CallExpression' && f.name === 'Test'
              && f.object === undefined) {
            nodes.push(node);
            return estraverse.VisitorOption.Skip;
          }
        },
    });

    nodes.sort((a, b) => b.end - a.end).forEach(n => {
        source = source.slice(0, n.start) + source.slice(n.end);
    });
    return source;
}
