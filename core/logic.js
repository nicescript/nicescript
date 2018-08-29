Mapping.Anything('or', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && v._value !== false)
      return v;
  }
  return v || nice.Nothing();
});


Func.Anything('and', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(!is.Something(v) || v._value === false)
      return v;
  }
  return v;
});


Func.Anything('nor', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && v._value !== false)
      return nice(false);
  }
  return nice(true);
});


Func.Anything('xor', (...as) => {
  let count = 0;
  for(let i in as){
    const v = nice(as[i]);
    if(is.Something(v) && v._value !== false)
      count++;
  }
  return nice(count && count < as.length ? true : false);
});