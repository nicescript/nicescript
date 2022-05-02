nice.reflect.compileFunction = function compileFunction(cfg){
  const reflect = nice.reflect;
  const res = [];
  const name = cfg.name.toString();

  if(reflect.reportUse){
    res.push('this.reflect.onFunctionUse && this.reflect.onFunctionUse("' + name + '");\n');
  }

  res.push(compileStep(0, cfg.signatures, name, cfg.functionType));

  return (new Function('...args', res.join(''))).bind(nice);
};


function compileStep(step, signatures, name, functionType){
  const res = [];
  const types = Array.from(signatures.keys()).sort(compareTypes);
  types.forEach(type => {
    const f = signatures.get(type);
    if(!type.name)
      throw 'Bad type';
    const callCode = compileStep(step + 1, f, name, functionType);
    res.push('if(', getTypeCheckCode(type, 'args[' + step + ']'),'){',
        callCode, '}');
    const mirrorType = getMirrorType(type);
    if(mirrorType && !signatures.has(mirrorType)){
      res.push('if(', getTypeCheckCode(mirrorType, 'args[' + step + ']'),'){',
          getTranslatorCode(mirrorType, 'args[0]'),
          callCode, '}');
    }
  });

  if(signatures.action){
    res.push(compileCall(signatures, functionType));
  } else {
    res.push(`const cur = args[${step}];
const type = cur._type === undefined ? typeof cur : cur._type.name;
throw "Function ${name} do not accept " + type + " as #${step+1} argument"; `);
  }
  return res.join('\n');
}


function compileCall(f, type){
  if(f.action === undefined)
    throw 'Bad function body';
  if(f.bodyId === undefined){
    f.bodyId = reflect.bodies.length;
    reflect.bodies.push(f.action);
  }
  if(type === 'Action'){
    return 'this.reflect.bodies[' + f.bodyId + '](...args);return args[0]';
  } else if ('returns' in f) {
    return `const result = this.${f.returns.name}();
    this.reflect.bodies[${f.bodyId}](result, ...args);
    return result`;
  }
  return 'return this.reflect.bodies[' + f.bodyId + '](...args);';
}


function getMirrorType (type) {
  if(type._isJsType){
    return nice[type.niceType];
  } else if (type._isNiceType){
    const jsTypeName = nice.typesToJsTypesMap[type.name];
    return jsTypeName === undefined ? null : nice.jsTypes[jsTypeName] || null;
  }
  throw 'I need type';
};


function getTranslatorCode(type, name){
  return type._isJsType
    ? name + ' = this(' + name + ');'
    : name + ' = ' + name + '();';
}


function getTypeCheckCode(type, name){
  if(!type.name)
    console.log('No type name');
//    throw 'No type name';

  return type._isJsType
    ? type.primitiveName
      ? 'typeof ' + name + " === '" + type.primitiveName + "'"
      : name + ' instanceof ' + type.name
    : name + ' !== undefined && ' + name + '._is' + type.name;
}


function compareTypes(a, b){
  if(a._isJsType){
    if(b._isJsType){
      a.name === 'Object' ? -1 : 0;
    } else {
      return 1;
    }
  } else {
    if(b._isJsType){
      return -1;
    } else {
      return a.proto.isPrototypeOf(b.proto)
        ? 1
        : b.proto.isPrototypeOf(a.proto)
          ? -1
          : 0;
    }
  }
}
