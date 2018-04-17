def(nice, '_set', (o, ks, v) => {
  const res = o;
  if(!o)
    return;

  let l;
  if(ks.pop){
    l = ks.pop();
    let k;
    while(k = ks.shift()){
      o = o[k] = o[k] || {};
    }
  } else {
    l = ks;
  }
  o[l] = v;

  return res;
});


def(nice, '_get', (o, ks) => {
  if(!o)
    return;

  if(ks.pop){
    let k;
    while(o !== undefined && (k = ks.shift())){
      o = o[k];
    }
    return o;
  } else {
    return o[ks];
  }
});
