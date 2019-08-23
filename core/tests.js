Test = def(nice, 'Test', (...a) => {
  const [description, body] = a.length === 2 ? a : [a[0].name, a[0]];
  const position = nice.parseTraceString(Error().stack.split('\n')[2]);
  nice.reflect.emitAndSave('test', { body, description, ...position });
});

const colors = {
  blue: s => '\x1b[34m' + s + '\x1b[0m',
  red: s => '\x1b[31m' + s + '\x1b[0m',
  green: s => '\x1b[32m' + s + '\x1b[0m',
  gray: s => '\x1b[38;5;245m' + s + '\x1b[0m'
};


def(nice, 'runTests', () => {
  console.log('');
  console.log(' ', colors.blue('Running tests'));
  console.log('');
  let good = 0, bad = 0, start = Date.now();
  nice.reflect.on('test', t => runTest(t) ? good++ : bad++);
  console.log(' ');
  console.log(colors[bad ? 'red' : 'green']
    (`Tests done. OK: ${good}, Error: ${bad}`), `(${Date.now() - start}ms)`);
  console.log('');
});


function runTest(t){
  try {
    t.body(...nice.argumentNames(t.body).map(n => nice[n]));
    return true;
  } catch (e) {
    const k = 1 + (e.shift || 0);
    const { line, symbol, location } = nice.parseTraceString(e.stack.split('\n')[k]);
    console.log(colors.red('Error while testing ' + (t.description || '')));

    const dh = line - t.line;
    const a = t.body.toString().split('\n');

    a.splice(dh + 1, 0,
      '-'.repeat(symbol - 1) + '^' + '-'.repeat(80 - symbol),
       e.message,
       colors.gray(location + ':' + line),
       '-'.repeat(80));

    console.log(a.join('\n'));
    return false;
  }
}
