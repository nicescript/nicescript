const paramsRe = /\:([A-Za-z0-9_]+)/g;

nice.Type({
  name: 'Router',

  initBy: (z, div = nice.Div()) => {
    z.staticRoutes = {};
    if(window && window.addEventListener){
      nice.Html.linkRouter = z;
      z.origin = window.location.origin;

      div.add(nice.RBox(z.currentUrl, url => {
        const route = z.getRoute(url);

        let content = route();

        if(content.__proto__ === Object.prototype && content.content){
          content.title && (window.document.title = content.title);
          content = content.content;
        }

        if(Array.isArray(content))
          content = nice.Div(...content);

        return content;
      })).show();

      window.addEventListener('popstate', function(e) {
        z.currentUrl(e.target.location.pathname);
        return false;
      });
    }
  },

  customCall: (z, ...as) => {
    return as.length === 0 ? z._value : z.setState(as[0]);
  }
})
//  .object('staticRoutes')
  .arr('queryRoutes')
  .box('currentUrl')
  .Method(addRoute)
  .Method(go)
  .Method(function getRoute(z, path){
    path[0] === '/' || (path = '/' + path);
    let url = path;
//    let url = z.relativeUrl(path);
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
    route || z.queryRoutes().some(f => route = f(url, query));
    return route || (() => `Page "${url}" not found`);
  });

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

  const i = router.queryRoutes
      .map(r => r.pattern)
      .sortedIndex(pattern, nice.routeSort);
  router.queryRoutes.insertAt(i, res);
  return router;
}




function go(z, originalUrl){
  let url = originalUrl.pathname || originalUrl;
  const location = window.location;
  const origin = location.origin;

  if(url.startsWith(origin))
    url = url.substr(origin.length);

  z.currentUrl(url);

//  const title = page.title() || site.title();
//  window.document.title = title;

  if(location.pathname + location.hash !== url)
    window.history.pushState(url, url, url);
//    window.history.pushState(url, title, url);

  window.scrollTo(0, 0);
}