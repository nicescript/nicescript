def(nice, 'TestSet', (core) => {
  const tests = [];

  const res = (...a) => {
    const [description, body] = a.length === 2 ? a : [a[0].name, a[0]];
    const position = nice.parseTraceString(Error().stack.split('\n')[2]);
    const test = { body, description, ...position };
    if(res.runner === false)
      tests.push(test);
    else
      runTest(test, res.runner);
  };

  res.core = core;
  res.tests = tests;
  res.runner = false;
  res.run = run;

  return res;
});

Test = nice.TestSet(nice);
def(nice, 'Test', Test);

const colors = {
  blue: s => '\x1b[34m' + s + '\x1b[0m',
  red: s => '\x1b[31m' + s + '\x1b[0m',
  green: s => '\x1b[32m' + s + '\x1b[0m',
  gray: s => '\x1b[38;5;245m' + s + '\x1b[0m'
};


function run(key) {
  this.runner = {
    key: key,
    good: 0,
    bad: 0,
    start: Date.now(),
    core: this.core
  };
  console.log('');
  console.log(colors.blue('Running tests'));
  console.log('');
  this.tests.forEach(t => runTest(t, this.runner));
  console.log(' ');
  const { bad, good, start } = this.runner;
  console.log(colors[bad ? 'red' : 'green']
    (`Tests done. OK: ${good}, Error: ${bad}`), `(${Date.now() - start}ms)`);
  console.log('');
  this.runner = false;
};


function runTest(t, runner){
  const argNames = nice.argumentNames(t.body);
  if(runner.key && !args.includes(runner.key))
    return;

  const args = argNames.map(n => runner.core[n]);

  try {
//    console.log('Running', t.description || t.body.toString());
    t.body(...args);
    runner.good++;
  } catch (e) {
    if(typeof e === 'string') {
      console.log(colors.red('Error while testing ' + (t.description || '')));
      console.log(t.body.toString());
      console.log(e);
    } else {
      const k = 1 + (e.shift || 0);
      const { line, symbol, location } = nice.parseTraceString(e.stack.split('\n')[k]);
      console.log(colors.red('Error while testing ' + (t.description || '')));

      const dh = line - t.line;
      const a = t.body.toString().split('\n');

      a.splice(dh + 1, 0,
        '-'.repeat(symbol - 1) + '^' + (symbol > 80 ? '' : '-'.repeat(80 - symbol)),
         e.message,
         colors.gray(location + ':' + line),
         '-'.repeat(80));

      console.log(a.join('\n'));
    }
    runner.bad++;
  }
}
