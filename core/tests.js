Test = def(nice, 'Test', (...a) => {
  const [description, body] = a.length === 2 ? a : [a[0].name, a[0]];
  nice.reflect.emitAndSave('test', { body, description });
});

const colors = {
  blue: s => '\x1b[34m' + s + '\x1b[0m',
  red: s => '\x1b[31m' + s + '\x1b[0m',
  green: s => '\x1b[32m' + s + '\x1b[0m',
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
    console.log(colors.red('Error while testing ' + (t.description || '')));
    console.log(t.body.toString());
    console.error('  ', e);
    return false;
  }
}
