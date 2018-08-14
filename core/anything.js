//let o = nice(); // assume object
//nice('qwe', 1); // set {qwe:1}
//nice('qwe');    // get 1
//nice.get('qwe')('qwe' , 1) // set {qwe: ['qwe', 1]}}

defAll(nice, {
  _newItem: (type, parent = null, key = null) => {
    const f = create(type ? type.proto : Anything.proto, function(...a){
      if(a.length){
        if(!f._type || f._type === nice.NotFound){
          const type = f._originalType || (a.length > 1 ? Arr : nice.typeOf(a[0]));
          nice._assignType(f, type);
        }
        return f._type.itemArgs ? f._type.itemArgs(f, ...a) : f.setValue(...a);
//        return f._parent || f;
      } else {
        return (f._type && f._type.itemNoArgs)
          ? f._type.itemNoArgs(f)
          : f.getResult();
      }
    });
    f._parent = parent;
    f._parentKey = key;
    f._originalType = type;
    return f;
  },

  _assignType: (item, type) => {
    create(type.proto, item);
    'name' in type.proto && nice.eraseProperty(item, 'name');
    'length' in type.proto && nice.eraseProperty(item, 'length');
  }
});


nice.registerType({
  name: 'Anything',

  description: 'Parent type for all types.',

  extend: function (...a){
    return nice.Type(...a).extends(this);
  },

  proto: {
    _isAnything: true,

    apply: function(f){
      f(this);
      return this;
    },

    Switch: function (...vs) {
      const s = Switch(this, ...vs);
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    SwitchArg: function (...vs) {
      const s = Switch(this, ...vs);
      s.checkArgs = vs;
      return defGet(s, 'up', () => {
        s();
        return this;
      });
    },

    _notifyUp: function () {
      //TODO: change logic
      let p = this;
      do {
        p._notify && p._notify();
      } while (p = p._parent);
    },

    get(i) {
      const z = this;

      if(i._isAnything === true)
        i = i();

      if(i.pop){
        if(i.length === 1){
          i = i[0];
        } else {
          let k = 0;
          let res = this;
          while(k < i.length) res = res.get(i[k++]);
          return res;
        }
      }

      z.items = z.items || {};
      if(z.items.hasOwnProperty(i)){
        return z.items[i];
      }

      const types = z._type.types;

//      if(!vs.hasOwnProperty(i)){
//        const types = z._type.types;
//        if(i in vs === false){
//          if(types && types[i])
//            vs[i] = types[i].defaultValue();
//          else
//            return nice.NOT_FOUND;
//        } else {
//          if(typeof vs[i] === 'object')
//            vs[i] = create(vs[i], (types && types[i] && types[i].defaultValue()) || {});
//        }
//      }

      const type = types[i];
      const item = nice._newItem(type, z, i);
      const thisResult = this.getResult();
      if(typeof thisResult === 'object' && i in thisResult){
        const result = thisResult[i];
        const vType = nice.typeOf(result);
        if(type && !is.subType(vType, type)) {
          throw `Can't create ${type.name} from ${vType.name}: ${JSON.stringify(result)}`;
        } else {
          nice._assignType(item, vType);
        }
      } else {
//        if(defaultValue !== undefined){
//          type && nice._assignType(item, type || nice.typeOf(defaultValue));
//          thisResult[i] = defaultValue;
//        } else {
        nice._assignType(item, type || nice.NotFound);
//        }
      }
      return z.items[i] = item;
    },

    set: function(path, v) {
      return this.get(path)(v);
//      const z = this;
//      let data = z.getResult();
//      let k = path;
//      if(path.pop){
//        while(path.length > 1){
//          k = nice.unwrap(path.shift());
//          if(!data.hasOwnProperty(k)){
//            data[k] = {};
//            data = data[k];
//          } else if(data[k]._nt_){
//            if(typeof data[k] !== 'object')
//              throw `Can't set property ${k} of ${data[k]}`;
//            else
//              data = data[k];
//          } else if(typeof data[k] !== 'object') {
//            throw `Can't set property ${k} of ${data[k]}`;
//          } else {
//            data = data[k];
//          }
//        }
//        k = path[0];
//      }
//      k = nice.unwrap(k);
//      const type = z._itemsType;
//
//      data[k] = type
//        ? (v._type && v._type === type ? v : type(v)).getResult()
//        : Switch(v)//TODO: simlify maybe
//          .Box.use(v => v)
//          .primitive.use(v => v)
//          .nice.use(v => v.getResult())
//          .Object.use(v => v)
//          .function.use(v => v)
//          ();
//      z._notifyUp();
//
//      return z;
    },

    assertResultObject: function (){
      if(this._parent){
        const parentRes = this._parent.assertResultObject();
        if(!parentRes.hasOwnProperty(this._parentKey)){
          //TODO: check items type (maybe array, maybe single)
          return parentRes[this._parentKey] = {};
        } else {
          const t = typeof parentRes[this._parentKey];
          if(t !== 'object')
            throw "Can't set children to " + t;
          else
            return parentRes[this._parentKey];
        }
      } else {
        const t = typeof this._result;
        if(t !== 'object')
          throw "Can't set children to " + t;
        else
          return this._result;
      }
    },

    setResult: function (v){
      if(this._parent){
        this._parent.assertResultObject()[this._parentKey] = v;
      } else {
        this._result = v;
      }
      this._notifyUp();
    },

    getResult: function (){
      return this._parent
        ? this._parent.getResult()[this._parentKey]
        : this._result;
    },

    listen: function(f) {
      const ss = this._subscribers = this._subscribers || [];

      if(!ss.includes(f)){
        ss.push(f);
        isResolved(this) ? f(this) : this.compute();
      }

      return this;
    },

    _notify: function (){
      if(!this._subscribers)
        return;
      this._notifing = true;
      this._subscribers.forEach(s => {
        if(s.doCompute){
          s._notifing || s.doCompute();
        } else {
          isResolved(this) && s(this);
        }
      });
      this._notifing = false;
    },

  },

  configProto: {
    extends: function(parent){
      const type = this.target;
      is.String(parent) && (parent = nice[parent]);
      expect(parent).Type();
      nice.extend(type, parent);
      return this;
    },

    about: function (...a) {
      this.target.description = nice.format(...a);
      return this;
    },

    key: function (name, o) {
      if(name[0] !== name[0].toLowerCase())
        throw "Property name should start with lowercase letter. ";
      def(this.target.proto, name, function (...a) {
        const r = this.getResult();
        if(a.length){
          if(is.Object(a[0]))
            throw "Key must be a primitive value.";

//          r[name] = a[0];
          this.set(name, a[0])
          return this;
        } else {
          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
        }
      });
      return this;
    }
  },

  types: {}
});

const Anything = nice.Anything;

Object.defineProperties(Anything.proto, {
  switch: { get: function() { return Switch(this); } },

  is: { get: function() {
    const f = v => is(this).equal(v);
    f.value = this;
    return create(nice.isProto, f);
  } }
});


function isResolved (s){
  return s._result !== nice.NEED_COMPUTING && s._result !== nice.PENDING;
}

nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;