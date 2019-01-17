nice.generateDoc = () => {
  if(nice.doc)
    return nice.doc;
  const res = { types: {}, functions: [], fs: {} };

  reflect.on('signature', s => {
    if(!s.name || s.name[0] === '_' || typeof s.name !== 'string')
      return;

    const o = {};
    o.source = '' + s.body;

    const args = nice.argumentNames(o.source || '');
    const types = s.signature.map(v => v.type.name);
    types.forEach((v,k) => args[k] = args[k] ? v + ' ' + args[k] : v);
    o.title = [s.type || 'Func', s.name, '(', args.join(', '), ')'].join(' ');
    o.description = s.description;
    o.tests = s.tests.map(wrapTest(s));
    o.type = s.type

/*      _each(s, (v, k) => nice.Switch(k)
      //.is('body').use(() => o.source = v.toString())
//        .is('source').use(() => o.source = v.toString())
      //.is('signature').use(() => o[k] = v.map(t => t.type.name))
      .default.use(() => o[k] = ''+v));*/
    res.functions.push(o);
    (res.fs[s.name] = res.fs[s.name] || {})[o.title] = o;
  });


  reflect.on('Type', t => {
    if(!t.name || t.name[0] === '_')
      return;
    const o = { title: t.name, properties: [] };
    t.hasOwnProperty('description') && (o.description = t.description);
    t.extends && (o.extends = t.super.name);
    res.types[t.name] = o;
  });

  reflect.on('Property', ({ type, name, targetType }) => {
    res.types[targetType.name].properties.push({ name, type: type.name });
  });

  return nice.doc = res;
};


function wrapTest(s) {
  const { intersperse, argumentNames } = nice;
  return t => {
    let a = t.body.toString().split('\n').slice(1,-1);
    const minOffset = a.reduce((last, s) => Math.min(last, s.match(/^([\s]+)/g)[0].length), 100);
    a = a.map(s => s.slice(minOffset));
    a.unshift(`const { expect, ${argumentNames(t.body).join(', ')} } = nice;`);
    return a.join('\n');
  };
}