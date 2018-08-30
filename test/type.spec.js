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
    expect(is.function(item)).to.equal(true);
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


  it("super", function() {
    const A = nice.Type({
      proto: {
        'qwe': function(){ return this._value + 3 }
      }
    }).extends(nice.Value)();

    const B = nice.Type({
      proto: {
        'qwe': function(){ return this._value + 5 }
      }
    }).extends(A)();

    const a = A(1);
    const b = B(1);

    expect(B.super).to.equal(A);
//
//    expect(b.super.qwe()).to.equal(4);
//    expect(b.qwe()).to.equal(6);
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
});