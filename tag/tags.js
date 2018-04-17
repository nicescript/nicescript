'Div,I,B,Span,H1,H2,H3,H4,H5,H6,P,LI,UL,OL'.split(',').forEach(t =>
  nice.Block(t, (z, c, ...cs) => z.tag(t.toLowerCase()).add(c, ...cs)));

nice.Block('A', (z, url, ...children) => {
  z.tag('a');
  z.add(...children);
  is.function(url)
    ? z.on('click', e => {url(e); e.preventDefault();}).href('#')
    : z.href(url || '#');
});


nice.Block('Img', (z, src) => z.tag('img').src(src));