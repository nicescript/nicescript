const paramsRe = /\:([A-Za-z0-9_]+)/g;

nice.Type('Router')
  .object('staticRoutes')
  .arr('queryRoutes')
  .Method(addRoute)
  .Method(addRoutes)
  .Method(function resolve(z, path){
    path[0] === '/' || (path = '/' + path);
    let url = path;
    const query = {};
    const i = url.indexOf('?');
    if(i >= 0){
      url.substring(i+1).split('&').forEach(v => {
        const pair = v.split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      });
      url = url.substring(0, i);
    }
    const rurl = '/' + nice.trimRight(url, '/');
    let route = z.staticRoutes[url];
    route || z.queryRoutes.some(f => route = f(url, query));
    return route || (() => `Page "${url}" not found`);
  });


function addRoutes(router, rr) {
  _each(rr, (v, k) => addRoute(router, k, v));
}


function addRoute(router, pattern, f){
  if(!pattern || pattern === '/'){
    router.staticRoutes['/'] = f;
    return router;
  }

  pattern[0] === '/' || (pattern = '/' + pattern);
  const params = pattern.match(paramsRe);
  if(!params){
    router.staticRoutes[nice.trimRight(pattern, '/')] = f;
    return router;
  }

  const s = pattern.replace('.', '\\.');
  const re = new RegExp('^' + s.replace(paramsRe, '(.+)'));
  const res = (s, query) => {
    const a = re.exec(s);
    if(!a)
      return false;
    params.forEach((v, k) => query[v.substr(1)] = a[k+1]);
    return () => f(query);
  };
  res.pattern = pattern;

  const i = nice.sortedIndex(router.queryRoutes._value, res, routeSort);
  router.queryRoutes.insertAt(i, res);
  return router;
}


function routeSort (a, b) {
  a = a.pattern;
  b = b.pattern;
  let res = b[b.length - 1] === '*' ? -1 : 0;
  return res + b.length - a.length;
};


Test((Router, Spy) => {
  const r = Router();
  const f = () => 1;

  r.addRoute('/', f);
  expect(r.resolve('/')).is(f);

  let res;
  const f2 = o => res = o.id;

  r.addRoute('/page/:id', f2);
  r.addRoute('/pages/:type', f);
  r.resolve('/page/123')();

  r.addRoute('/pagesddss', f);

  expect(res).is('123');
});


Test((Router, addRoutes) => {
  const r = Router();
  const f = () => 1;

  r.addRoutes({'/asd': f});
  expect(r.resolve('/asd')).is(f);
  expect(r.resolve('/')).not.is(f);
});


nice.Type({
  name: 'WindowRouter',

  extends: 'Router',

  initBy: (z, div = nice.Div()) => {
    if(window && window.addEventListener){
      nice.Html.linkRouter = z;
      z.origin = window.location.origin;
      let lastHandlers = null;

      div.add(nice.RBox(z.currentUrl, url => {
        if(lastHandlers !== null)
          _each(lastHandlers, (v, k) => window.removeEventListener(k, v));

        const route = z.resolve(url);

        let content = route();

        if(content.__proto__ === Object.prototype){
          content.title && (window.document.title = content.title);
          if(content.handlers) {
            lastHandlers = content.handlers;
            _each(lastHandlers, (v, k) => window.addEventListener(k, v));
          }
          content = content.content;
        }

        if(Array.isArray(content))
          content = nice.Div(...content);

        while(content !== undefined && content._up_ && content._up_ !== content)
          content = content._up_;

        return content;
      }));

      window.addEventListener('load', () => div.show());

      window.addEventListener('popstate', function(e) {
        z.currentUrl(e.target.location.pathname);
        return false;
      });
    }
  }
})
  .box('currentUrl')
  .Method(go);


function go(z, originalUrl){
  let url = originalUrl.pathname || originalUrl;
  const location = window.location;
  const origin = location.origin;

  if(url.startsWith(origin))
    url = url.substr(origin.length);

  z.currentUrl(url);

  try {
    if(location.pathname + location.hash !== url)
      window.history.pushState(url, url, url);
  } catch (e) {
    console.log(e);
  }

  window.scrollTo(0, 0);
}
