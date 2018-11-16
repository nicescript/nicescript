const configProto = {
  next (o) {
    let c = Configurator(this.name || o.name);

    c.signature = (this.signature || []).concat(o.signature || []);
    c.existing = o.existing || this.existing;
    c.functionType = o.functionType || this.functionType;
    c.returnValue = o.returnValue || this.returnValue;
    c.description = o.description || this.description;

    return c;
  },

  about (s) { return this.next({ description: s}); }
};

const skippedProto = {};

const functionProto = {
  addSignature (body, signature, name){
    const ss = this.signatures = this.signatures || new Map();
    if(signature && signature.length){
      const combinations = allSignatureCombinations(signature);
      combinations.forEach(combination => {
        let _ss = ss;
        const lastI = combination.signature.length - 1;
        combination.signature.forEach((type, i) => {
          if(_ss.has(type)){
            _ss = _ss.get(type);
          } else {
            const s = new Map();
            _ss.set(type, s);
            _ss = s;
          }
        });
        if(_ss.action) {
          const existingN = nice._size(_ss.transformations);
          const newN = nice._size(combination.transformations);
          if(!existingN && !newN)
            throw `Function "${name}" already have signature
                [${signature.map(v=>v.name + ' ')}]`;
          if(existingN > newN){
            _ss.action = body;
            _ss.transformations = combination.transformations;
          }
        } else {
          _ss.action = body;
          _ss.transformations = combination.transformations;
        }
      });
    } else {
      ss.action = body;
    }
    return this;
  },

  ary (n){
    return (...a) => this(...a.splice(0, n));
  },

  about (s) {
    return configurator({ description: s });
  }
};

const parseParams = (...a) => {
  if(!a[0])
    return {};

  const [name, body] = a.length === 2 ? a : [a[0].name, a[0]];

  return typeof body === 'function' ? { name, body } : a[0];
};


function toItemType({type}){
  return { type: type._isJsType ? nice[type.niceType] : type };
}


function Configurator(name){
  const z = create(configProto, (...a) => {
    const { name, body, signature } = parseParams(...a);
    const res = createFunction({
      description: z.description,
      type: z.functionType,
      existing: z.existing,
      name: z.name || name,
      body: body || z.body,
      signature: (z.signature || []).concat(signature || [])
    });
    return z.returnValue || res;
  });

  nice.rewriteProperty(z, 'name', name || '');

  return z;
}


function configurator(...a){
  const cfg = parseParams(...a);
  return Configurator(cfg.name).next(cfg);
};


//optimization: create function that don't check fist argument for type.proto
function createFunction({ existing, name, body, source, signature, type, description }){
  if(name && typeof name === 'string' && name[0] !== name[0].toLowerCase())
    throw "Function name should start with lowercase letter. "
          + `"${nice._decapitalize(name)}" not "${name}"`;

  existing = existing || (name && nice[name]);
  const f = existing || createFunctionBody(type);

  if(existing && existing.functionType !== type)
    throw `function '${name}' can't have types '${existing.functionType}' and '${type}' at the same time`;

  //optimization: maybe signature might be just an array of types??
  body && f.addSignature(body, signature.map(v => v.type), name);
  f.maxLength >= signature.length || (f.maxLength = signature.length);
  if(name){
    if(!existing){
      f.name !== name && nice.rewriteProperty(f, 'name', name);
      def(nice, name, f);
      reflect.emitAndSave('function', f);
      type && reflect.emitAndSave(type, f);
    }
    body && reflect.emitAndSave('signature',
      { name, body, signature, type, description, source, f });
  }

  return f;
};


nice.reflect.on('signature', ({ name, signature, f }) => {
  Anything && !Anything.proto.hasOwnProperty(name) &&
      def(Anything.proto, name, function(...a) { return f(this, ...a); });

  const type = signature[0] && signature[0].type;
  if(type && !type._isJsType){
    type && !type.proto.hasOwnProperty(name)
        && def(type.proto, name, function(...a) { return f(this, ...a); });
  }
});


function createFunctionBody(functionType){
  const z = create(functionProto, (...args) => {
    if(args.includes(nice))
      return skip(args, z);

    let target = z.signatures;

    for(let i in args) {
      if(target && target.size){
        let type = nice.getType(args[i++]);
        let found = null;
        while(type){
          if(target.has(type)){
            found = target.get(type);
            break;
          } else {
            type = Object.getPrototypeOf(type);
          }
        }
        target = found;
      }
    }

    if(!target)
      throw signatureError(z.name, args);

    if(target.transformations)
      for(let i in target.transformations)
        args[i] = target.transformations[i](args[i]);

    if(functionType === 'Action')
      args[0].transactionStart();

    const res = target.action(...args);

    if(functionType === 'Mapping')
      return nice(res);

    if(functionType === 'Action'){
      args[0].transactionEnd();
      return args[0];
    }

    return res;
  });

  z.functionType = functionType;

  return z;
}


function mirrorType (t) {
  if(t._isJsType){
    return nice[t.niceType];
  } else if (t._isNiceType){
    const jsTypeName = nice.typesToJsTypesMap[t.name];
    return jsTypeName === undefined ? null : nice.jsTypes[jsTypeName] || null;
  }
  throw 'I need type';
};


function addCombination (a, type, mirror, transformation) {
  let res = [];
  const position = a[0].signature.length;

  a.forEach((last, k) => {
    res.push({
      signature: [ ...last.signature, type],
      transformations: Object.assign({}, last.transformations )
    });
    mirror !== null && res.push({
      signature: [ ...last.signature, mirror],
      transformations: Object.assign({}, last.transformations, { [position]: transformation})
    });
  });
  return res;
}

function allSignatureCombinations (ts) {
  let res = [];

  ts.forEach((type, i) => {
    const mirror = mirrorType(type);
    if(i === 0){
      res.push({signature: [type], transformations: []});
      mirror === null || res.push({
        signature: [mirror],
        transformations: { 0: type._isJsType ? v => v() : nice}
      });
    } else {
      res = addCombination (res, type, mirror, type._isJsType ? v => v() : nice);
    }
  });

  return res;
}


function signatureError(name, a, s){
  return `Function ${name} can't handle (${a.map(v => nice.typeOf(v).name).join(',')})`;
}


function handleType(type){
  type.name === 'Something' && create(type.proto, functionProto);

  defGet(functionProto, type.name, function() {
    return configurator({ signature: [{type}], existing: this });
  });

  defGet(configProto, type.name, function() {
    return this.next({signature: [{type}]});
  });
};


function skip(a, f){
  return create(skippedProto, (...b) => {
    const c = [];
    let i = 0;
    a.forEach(v => c.push(v === nice ? b[i++] : v));
    return f(...c);
  });
}


for(let i in nice.jsTypes) handleType(nice.jsTypes[i]);
reflect.on('Type', handleType);
Func = def(nice, 'Func', configurator());
Action = def(nice, 'Action', configurator({functionType: 'Action'}));
Mapping = def(nice, 'Mapping', configurator({functionType: 'Mapping'}));
Check = def(nice, 'Check', configurator({functionType: 'Check'}));


reflect.on('function', ({name}) => {
  name && !skippedProto[name] && def(skippedProto, name, function(...a){
    return create(skippedProto, a.includes(nice)
      ? (...b) => {
          let c = [];
          for (let i = a.length ; i--;){
            c[i] = a[i] === nice ? b.pop() : a[i];
          }
          return this(...b)[name](...c);
        }
      : (...b) => {
            return this(...b)[name](...a);
    });
  });
});


const ro = def(nice, 'ReadOnly', {});
reflect.on('Type', type => {
  ro[type.name] = function (...a) {
    const [name, f] = a.length === 2 ? a : [a[0].name, a[0]];
    expect(f).isFunction();
    defGet(type.proto, name, function() { return f(this); } );
    return this;
  };
});
