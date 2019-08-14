nice.Type({
  name: 'Reference',
  extends: 'Anything',
  itemArgs0: z => z._ref(),
  proto: new Proxy({}, {
    get (o, k, receiver) {
      if(!('_ref' in receiver))
        def(receiver, '_ref', nice._db.getValue(receiver._id, '_value'));
//      if(k === '_ref')
//        return receiver._ref;
      return receiver._ref[k];
    }
  })
});