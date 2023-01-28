const Html = nice.Html;

'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre,Table,Tr,Td,Th'.split(',').forEach(t => {
  const l = t.toLowerCase();
  Html.extend(t).by((z, a, ...as) => {
    z.tag(l);

    if(a === undefined)
      return;
    const type = nice.getType(a).name;
    //TODO: use function overload (sub types don't work)
//      ? constructors[type](z, a, as[0] || ((t === 'Li' || t === 'Ol')
//        ? (v => (v && v._isLi) ? v : nice.Li(v))
//        : (v => v)))
    constructors[type]
      ? constructors[type](z, a, as[0] || (v => v))
      : z.add(a, ...as);
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


const constructors = {
  BoxArray: (z, b, f) => z.bindChildren(f ?  b.map(f) : b),
  Object: (z, o, f) => _each(o, (v, k) => z.add(f(v, k))),
  Arr: (z, a, f) => a.each((v, k) => z.add(f(v, k))),
  Array: (z, a, f) => a.forEach((v, k) => z.add(f(v, k)))
};
