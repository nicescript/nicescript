nice.Type({
  name: 'DataSource',

  extends: 'Something',

  abstract: true,

  proto: {
    get version(){
      return this._version;
    }
  }
});

nice.eventEmitter(nice.DataSource.proto);


//{
//  version: 2,
//  coldCompute: f,
//  warmUp: f,
//  coolDown: f
//}