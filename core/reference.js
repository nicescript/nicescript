nice.Type({
  name: 'Reference',
  extends: 'Anything',
  itemArgs0: z => z._ref(),
  //TODO:0 remove _ref if type or value changes
  initBy: (z, v) => {
    nice._db.update(z._id, '_value', v);
  },
  proto: new Proxy({}, {
    get (o, k, receiver) {
//      if(k === 'transaction')
//        throw 'Link is read only';
      if(!('_ref' in receiver))
        def(receiver, '_ref', nice._db.getValue(receiver._id, '_value'));
      return receiver._ref[k];
    }
  })
});