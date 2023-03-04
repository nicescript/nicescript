const Html = nice.Html;

'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre,Table,Tr,Td,Th'.split(',').forEach(t => {
  const l = t.toLowerCase();
  Html.extend(t).by((z, a, ...as) => {
    z.tag(l);

    if(a === undefined)
      return;

    const type = nice.getType(a).name;
    const f = as[0];

    if(a._isBoxArray){
      z.bindChildren(f ?  a.map(f) : a);
    } else if(a._isBoxSet){
      const ba = nice.BoxArray();
      a.subscribe((v, old) => v === null ? ba.removeValue(old) : ba.push(v));
      z.bindChildren(f ?  ba.map(f) : ba);
    } else if( a._isArr ) {
      a.each((v, k) => z.add(f ? f(v, k) : v));
    } else if( type === 'Array' || type === 'Object') {
      _each(a, (v, k) => z.add(f ? f(v, k) : v));
    } else if( a instanceof Set ) {
      for(let c of a) z.add(f ? f(c) : c);
    } else {
      z.add(a, ...as);
    }
  })
    .about('Represents HTML <%s> element.', l);
});

const protocolRe = /^([a-zA-Z0-9]{3,5})\:\/\//;


Html.extend('A').by((z, url, ...children) => {
  z.tag('a').add(...children);

  if (nice.isFunction(url) && !url._isAnything) {
    z.on('click', e => {url(e); e.preventDefault();}).href('#');
  } else {
    const router = nice.Html.linkRouter;

    if(!router || (protocolRe.exec(url) && !url.startsWith(router.origin))) {
      z.href(url || '#');
    } else {
      z.on('click', e => e.preventDefault(router.go(url))).href(url);
    }
  }
}).about('Represents HTML <a> element.');


Html.extend('Img').by((z, src, x, y) => {
  z.tag('img').src(src);
  x === undefined || z.width(x);
  y === undefined || z.height(y);
})
  .about('Represents HTML <img> element.');