'I,B,Span,H1,H2,H3,H4,H5,H6,P,LI,UL,OL'.split(',').forEach(t => {
  nice.block(t, (z, ...a) => z.tag(t.toLowerCase()).add(...a));
});

nice.block('A', (z, url) => {
  z.tag('a');
  nice.is.Function(url) ? z.on('click', url).href('#') : z.href(url || '#');
});


nice.block('Img', (z, src) => z.tag('img').src(src));