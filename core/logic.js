Mapping.Anything('or', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && (!v._getResult || v._getResult() !== false))
      return v;
  }
  return v || nice.NOTHING;
});


Func.Anything('and', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(!is.Something(v) || (!v._getResult || v._getResult() === false))
      return v;
  }
  return v;
});


Func.Anything('nor', (...as) => {
  let v;
  for(let i in as){
    v = nice(as[i]);
    if(is.Something(v) && (!v._getResult || v._getResult() !== false))
      return nice(false);
  }
  return nice(true);
});


Func.Anything('xor', (...as) => {
  let count = 0;
  for(let i in as){
    const v = nice(as[i]);
    if(is.Something(v) && (!v._getResult || v._getResult() !== false))
      count++;
  }
  return nice(count && count < as.length ? true : false);
});