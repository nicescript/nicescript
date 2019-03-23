const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const is = nice.is;


describe("Type", function() {

  it("create", function() {
    const type = nice.Type({})();
    expect(nice.type(type)).to.equal(type);
    const item = type();
    expect(nice.isFunction(item)).to.equal(true);
    expect(item._type).to.equal(type);
    expect(item._type).to.equal(type);
  });


  it("extends", function() {
    const a = nice.Type({
      name: 'T1',

      creator: () => { return {}; },

      proto: {
      }
    });

    const b = nice.Type('T2').extends('T1');

    expect(nice.T1.creator).not.to.equal(undefined);
    expect(nice.T1.creator).to.equal(nice.T2.creator);
    expect(nice.T1()._set).to.equal(nice.T2()._set);
  });


  it("extends", function() {
    const T = nice.Type('T14').num('size')();

    expect(T().size(5).jsValue).to.deep.equal({[nice.TYPE_KEY]: "T14", size:5 });
  });


  it("super property", function() {
    const A = nice.Type({
      proto: {
        qwe(){ return this._value + 3 }
      }
    }).extends(nice.Value)();

    const B = nice.Type({
      proto: {
        qwe(){ return this._value + 5 }
      }
    }).extends(A)();

    const a = A(1);
    const b = B(1);

    expect(B.super).to.equal(A);
  });


  it("super constructor", function() {
    const A = nice.Type({
      proto: {
        qwe (){ return this._value + 3 }
      }
    }).by((z, a) => z.a = a).extends(nice.Value)();

    const B = nice.Type({
      proto: {
         qwe (){ return this._value + 5 }
      }
    }).by(z => z.super('B')).extends(A)();

    const a = A(1);
    const b = B(1);

    expect(b.a).to.equal('B');
  });


  it("super super constructor", function() {
    const A = nice.Type({
      proto: {
        qwe (){ return this._value + 3 }
      }
    }).by((z, a) => z.a = a).extends(nice.Value)();

    const B = nice.Type({
      proto: {
         qwe (){ return this._value + 5 }
      }
    }).by((z, x) => z.super(x || 'B')).extends(A)();

    const C = nice.Type({
      proto: {
         qwe (){ return this._value + 7 }
      }
    }).by(z => z.super('C')).extends(B)();

    const c = C(1);

    expect(c.a).to.equal('C');
  });


  it("isSubType", function() {
    const a = nice.Type()();
    const b = nice.Type().extends(a)();

    expect(b.isSubType(b)).to.equal(true);
    expect(b.isSubType(a)).to.equal(true);
  });


  it("default", function() {
    const A = nice.Type().str('qwe', 'asd')();
    const B = nice.Type().extends(A).str('zxc', '123').str('asd')();

    expect(A().qwe()).to.equal('asd');
    expect(B().get('qwe')()).to.equal('asd');
    expect(B().qwe()).to.equal('asd');
    expect(B().get('zxc')()).to.equal('123');
    expect(B().get('asd')()).to.equal('');
  });


  it("Method", function() {
    const spy = chai.spy();
    const City = nice.Type().Method('go', function(z, a){spy(a, z);})();
    const city = City();
    city.go(3);
    expect(spy).to.have.been.called.once().with(3, city);
  });


  it('typeOf', function () {
    expect(nice.typeOf(nice.Num()).name).to.equal('Num');
    expect(nice.typeOf([]).name).to.equal('Arr');
    expect(nice.typeOf(1).name).to.equal('Num');
    expect(nice.typeOf('1').name).to.equal('Str');
    expect(nice.typeOf({}).name).to.equal('Obj');
    expect(nice.typeOf(undefined).name).to.equal('Undefined');
    expect(nice.typeOf(null).name).to.equal('Null');
//    expect(nice.typeOf(() => {}).name).to.equal('function');
  });


  it("Const", function() {
    let A = nice.Type().Const('qwe', 9)();
    let a = A();
    expect(A.qwe).to.equal(9);
    expect(a.qwe).to.equal(9);
    A.qwe = 5;
    expect(a.qwe).to.equal(9);
  });


  it("Not extensible", function() {
    expect(() => {
      nince.Str.extend('Str2');
    }).to.throw();
  });


  it("by function", function() {
    const type = nice.Type({}).by((z, v) => z.set('q', v))();

    expect(type(1).get('q')).to.equal(1);
  });


  it("by string", function() {
    const type = nice.Type({}).by('q','w')();
    const v = type(1, 2);
    expect(v.get('q')).to.equal(1);
    expect(v.get('w')).to.equal(2);
  });


  it("skip arguments", () => {
    const { $1, $2, $3 } = nice;
    const f = nice.Arr($2, $1);
    expect(f(2,1).jsValue).to.deep.equal([1,2]);
  });


  it("skip arguments and modify", () => {
    const { $1, $2, $3 } = nice;
    const f = nice.Arr($2, $1).push(3);
    expect(f(2,1).jsValue).to.deep.equal([1,2,3]);
  });


  it("skip all arguments", () => {
    const { $$ } = nice;
    const f = nice.Arr(0, $$, 3);
    expect(f(2,1).jsValue).to.deep.equal([0,2,1,3]);
  });


  it("invariant", () => {
    nice.Type('Size')
      .num('x')
      .num('y')
      .invariant(z => z.x.gte(0) && z.y.gte(0));

    const s = nice.Size().x(1).y(2);

    //problem is .x does not triggers s
    expect(() => s.x(-2)).to.throw();
    //TODO: test constructor
  });
});