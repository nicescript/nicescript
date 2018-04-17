const index = {};

nice.Type({
  title: 'Interface',
  constructor: (z, title, ...a) => {
    if(nice[title])
      throw `Can't create interface ${title} name busy.`;

    if(a.length === 0)
      throw `Can't create empty interface.`;

    z.title = title;
    z.methods = a;
    z.matchingTypes = [];

    a.forEach(k => (index[k] = index[k] || []).push(z));

    nice._on('Type', type => match(type, z) && z.matchingTypes.push(type));
    Check(title, type => z.matchingTypes.includes(type._type || type));

    Object.freeze(z);
    def(nice, title, z);
    nice.emitAndSave('interface', z);
  }
});


nice.onNew('signature', s => {
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