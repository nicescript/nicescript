const { orderedStringify, memoize, Box } = nice;

nice.Type({
  name: 'RowModelProxy',
  extends: 'DataSource',
  initBy(z, subscribe){
    z.subscribe = subscribe;
//    z.sortsAsc = memoize(field => nice.SortResult(z, field, 1));
//    z.sortsDesc = memoize(field => nice.SortResult(z, field, -1));
    z.filters = {};
    z.filter = memoize(o => nice.RowModelFilterProxy(o, z), JSON.stringify);
    z.rowBox = memoize(id => {
      const res = Box();
      z.subscribe([{action: 'rowBox', args: id }], res);
      return res;
    });
  },
  proto: {
  }
});

nice.Type({
  name: 'RowModelFilterProxy',
  extends: 'BoxSet',
  initBy(z, args, modelProxy){
    z.super();
    modelProxy.subscribe([{action: 'filter', args }], (v, oldV) => {
      v === null ? z.delete(oldV) : z.add(v);
    });
  }
});

nice.Type({
  name: 'RowModelSortProxy',
  extends: 'DataSource',
});

nice.Type({
  name: 'RowModelOtptionsProxy',
  extends: 'DataSource',
});