const index = {};

nice.Type({
  name: 'Interface',
  initBy: (z, name, ...a) => {
    if(nice[name])
      throw `Can't create interface ${name} name busy.`;

    if(a.length === 0)
      throw `Can't create empty interface.`;

    z.name = name;
    z.methods = a;
    z.matchingTypes = [];

    a.forEach(k => (index[k] = index[k] || []).push(z));

    reflect.on('Type', type => match(type, z) && z.matchingTypes.push(type));
    Check(name, type => z.matchingTypes.includes(type._type || type));

    Object.freeze(z);
    def(nice, name, z);
    reflect.emitAndSave('interface', z);
  }
});


reflect.onNew('signature', s => {
  if(s.type === 'Check')
    return;

  const type = s.signature[0] && s.signature[0].type;
  const intrested = index[s.name];

  type && intrested && intrested.forEach(i => {
    match(type, i) && i.matchingTypes.push(type);
  });
});



function match(type, { methods }){
  let ok = true;
  let l = methods.length;
  while(ok && l--){
    ok &= type.proto.hasOwnProperty(methods[l]);
  }
  return ok;
}