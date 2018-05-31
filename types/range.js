nice.Type('Range')
  .about('Represent range of numbers.')
  .Number('start', 0)
  .Number('end', Infinity)
  .by((z, a, b) => b === undefined ? z.end(a) : z.start(a).end(b))
  .Method(function each(z, f){
    let i = z.start();
    let end = z.end();
    let n = 0;
    while(i <= end) f(i++, n++);
  })
  .Mapping(function map(f){
    let i = this.start();
    let n = 0;
    const a = nice.Array();
    while(i <= this.end()) a(f(i++, n++));
    return a;
  })
  .Mapping(function toArray(z){
    const a = [];
    const end = z.end();
    let i = z.start();
    while(i <= end) a.push(i++);
    return a;
  })
  .Check(function includes(z, n){
    return n >= z.start && n <= z.end;
  });


Func.Number.Range(function within(v, r){
  return v >= r.start && v <= r.end;
});
