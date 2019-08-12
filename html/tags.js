//TODO: select
const Html = nice.Html;

'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,Li,Ul,Ol,Pre,Table,Tr,Td,Th'.split(',').forEach(t => {
  const l = t.toLowerCase();
  Html.extend(t).by((z, a, ...as) => {
    z.tag(l);

    if(a === undefined)
      return;
    const type = nice.getType(a).name;
    constructors[type]
      ? constructors[type](z, a, as[0] || ((t === 'Li' || t === 'Ol') ? nice.Li(nice._1) : (v => v)))
      : z.add(a, ...as);
  })
    .about('Represents HTML <%s> element.', l);
});

Html.extend('A').by((z, url, ...children) => {
  z.tag('a').add(...children);
  nice.isFunction(url) && !url._isAnything
    ? z.on('click', e => {url(e); e.preventDefault();}).href('#')
    : z.href(url || '#');
}).about('Represents HTML <a> element.');


Html.extend('Img').by((z, src, x, y) => {
  z.tag('img').src(src);
  x === undefined || z.width(x);
  y === undefined || z.height(y);
})
  .about('Represents HTML <img> element.');


const constructors = {
  Obj: (z, o, f) => {
    const positions = {};
    o.listen({
      onRemove: (v, k) => z.children.removeAt(positions[k]),
      onAdd: (v, k) => {
        const i = Object.keys(o()).indexOf(k);
        positions[k] = i;
        z.children.insertAt(i, f(v, k));
      }
    }, z.children);
  },
  Object: (z, o, f) => _each(o, (v, k) => z.add(f(v, k))),
//  Arr: (z, a, f) => a.listenItems(v => v.isNotFound()
//    ? z.children.removeAt(v._name)
//    : z.children.insertAt(v._name, f(v, v._name))
//  , z.children),
    Arr: (z, a, f) => a.listenItems({
      NotFound: v => z.children.removeAt(v._name),
      '*': v => z.children.insertAt(v._name, f(v, v._name))
    }, z.children),
//  Arr: (z, a, f) => a.listen({
//    onRemove: (v, k) => z.children.removeAt(k),
//    onAdd: (v, k) => z.children.insertAt(k, f(v, k))
//  }, z.children),
  Array: (z, a, f) => a.forEach((v, k) => z.add(f(v, k)))
};
