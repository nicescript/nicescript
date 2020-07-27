//nice.Type('Range')
//  .about('Represent range of numbers.')
//  .num('start', 0)
//  .num('end', Infinity)
//  .by((z, a, b) => b === undefined ? z.end(a) : z.start(a).end(b))
//  .Method(function each(z, f){
//    let i = z.start();
//    let end = z.end();
//    let n = 0;
//    while(i <= end) f(i++, n++);
//  })
//  .Mapping(function map(z, f){
//    let i = z.start();
//    let n = 0;
//    const a = nice.Arr();
//    while(i <= z.end()) a(f(i++, n++));
//    return a;
//  })
//  .Mapping(function filter(z, f){
//    let i = z.start();
//    let n = 0;
//    const a = nice.Arr();
//    while(i <= z.end()) {
//      f(i, n) && a(n);
//      i++;
//      n++;
//    }
//    return a;
//  })
//  .Mapping(function toArray(z){
//    const a = [];
//    const end = z.end();
//    let i = z.start();
//    while(i <= end) a.push(i++);
//    return a;
//  })
//  .Check(function includes(z, n){
//    return n >= z.start() && n <= z.end();
//  });
//
//
//Func.Number.Range(function within(v, r){
//  return v >= r.start() && v <= r.end();
//});
