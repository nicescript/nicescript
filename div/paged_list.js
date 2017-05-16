nice.block('PagedList')
  .Number('step', z => z(10))
  .Number('currentPage')
  .Item('pageNumberBy')
  .Item('itemBy')
  .Item('placeholderBy')
  .Method(function pagesList(size){
    var res = nice.Div();
    var width = 5;
    var start = Math.max(0, this.currentPage() - width);
    var end = Math.min(size, this.currentPage() + width + 1);
    start && res.add(this.pageNumber(0));
    start > 1 && res.add('...');
    for(let i = start; i < end; i++)
      res.add(this.pageNumber(i));
    end < size && res.add('...');
    return res;
  })
  .Method(function pageNumber(n){
    var res = n === this.currentPage()
      ? nice.B(n+1)
      : nice.A(e => e.preventDefault(this.currentPage(n))).add(n+1);
    this.pageNumberBy() && this.pageNumberBy()(res);
    return res;
  })
  .Array(function actualChildren(z){
    var children = z.try(this.children);
    var step = z.use(this.step)();
    var current = z.use(this.currentPage)();
    var offset = current * step;
    var res = children().slice(offset, offset + step);

    this.itemBy() && (res = res.map(this.itemBy()));

    if(children.size() > step){
      res.push(this.pagesList(Math.ceil(children.size() / step)));
    }
    z.replace(res.length
        ? res
        : this.placeholderBy() ? this.placeholderBy()() : []);
  });