defAll(nice, {
  _newItem: (type, parent = null, key = null) => {
    const f = function(...a){
      if(a.length === 0){
        return f._type.itemArgs0(f);
      } else if (a.length === 1){
        return f._type.itemArgs1(f, a[0]);
      } else {
        return f._type.itemArgsN(f, a);
      }
//      if(a.length){
//        if(!f._type || f._type === nice.NotFound){
//          const type = f._originalType || nice.Single;
////          const type = f._originalType || (a.length > 1 ? Arr : nice.typeOf(a[0]));
//          nice._assignType(f, type);
//        }
//        return f._type.itemArgs ? f._type.itemArgs(f, ...a) : f.setValue(...a);
////        return f._parent || f;
//      } else {
//        return (f._type && f._type.itemNoArgs)
//          ? f._type.itemNoArgs(f)
//          : f._getResult();
//      }
    };
    nice._assignType(f, type || Anything);
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

  itemArgs0: z => z._value,
  itemArgs1: (z, v) => z._setValue(v),
  itemArgsN: (z, vs) => {
    throw `${z._type.name} doesn't know what to do with ${vs.length} arguments.`;
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


//    _assertResultObject: function (f){
//      this._hasChanges = true;
//      if(this._parent){
//        this._parent._assertResultObject((parentRes, inTransaction) => {
//          if(!parentRes.hasOwnProperty(this._parentKey)){
//            const val = this.is.Nothing() ? {} : this._type.defaultValue();
//            f(parentRes[this._parentKey] = val, inTransaction);
//          }
//          const t = typeof parentRes[this._parentKey];
//          if(t !== 'object')
//            throw "Can't set children to " + t;
//          else
//            f(parentRes[this._parentKey], inTransaction);
//        });
//      } else {
//        const t = typeof this._result;
//        if(t !== 'object')
//          throw "Can't set children to " + t;
//
//        if(!this._isHot() || this._transactionDepth){
//          f(this._result, this._transactionDepth);
//        } else {
//          this.transaction(() => f(this._result, true));
//        }
//      }
//    },

    _setValue: function (v){
      if(v === this._value)
        return;
      this.transaction(isHot => {
        isHot && !this.hasOwnProperty('_oldValue') && (this._oldValue = this._value);
        this._value = v;
      });
      return this;
    },

//    _getChildResult: function (k){
//      const res = this._getResult();
//      if(typeof res !== 'object')
//        return nice.NotFound();
//      return res[k];
//    },
//
//    _getResult: function (){
////        const parentRes = this._parent._getResult();
////  return (parentRes && parentRes.hasOwnProperty(this._parentKey))
////    ? parentRes[this._parentKey]
////    : this._type.defaultValue();
//
//      let value = this._parent
//        ? this._parent._getChildResult(this._parentKey)
//        : this._result;
//      if(value === undefined)
//        value = this._type.defaultValue();
//      return value;
//    },
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

//    key: function (name, o) {
//      if(name[0] !== name[0].toLowerCase())
//        throw "Property name should start with lowercase letter. ";
//      def(this.target.proto, name, function (...a) {
//        const r = this._getResult();
//        if(a.length){
//          if(is.Object(a[0]))
//            throw "Key must be a primitive value.";
//
//          this.set(name, a[0])
//          return this;
//        } else {
//          return is.Anything(o) ? o.get(r[name]) : o[r[name]];
//        }
//      });
//      return this;
//    }
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


nice.ANYTHING = Object.seal(create(Anything.proto, new String('ANYTHING')));
Anything.proto._type = Anything;