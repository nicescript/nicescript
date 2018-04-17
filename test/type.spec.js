var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;
const is = nice.is;


describe("Type", function() {

  it("create", function() {
    var type = nice.Type({})();
    expect(nice.type(type)).to.equal(type);
    var item = type();
    expect(is.function(item)).to.equal(true);
    expect(item._type).to.equal(type);
  });


  it("extends", function() {
    var a = nice.Type({
      title: 'T1',

      creator: () => { return {}; },

      set: v => v * 2,

      proto: {
      }
    }).extends('Single');

    var b = nice.Type('T2').extends('T1');

    expect(nice.T1.creator).not.to.equal(undefined);
    expect(nice.T1.creator).to.equal(nice.T2.creator);
    expect(nice.T1()._set).to.equal(nice.T2()._set);
    expect(nice.T2(3)._result).to.equal(6);
  });


//  it("super", function() {
//    var A = nice.Type({
//      proto: {
//        'qwe': function(){ return this.getResult() + 3 }
//      }
//    }).extends('Number');
//
//    var B = nice.Type({
//      proto: {
//        'qwe': function(){ return this.getResult() + 5 }
//      }
//    }).extends(A);
//
//    var a = A(1);
//    var b = B(1);
//
//    expect(B.super).to.equal(A);
//
//    expect(b.super.qwe()).to.equal(4);
//    expect(b.qwe()).to.equal(6);
//
//  });


  it("isSubType", function() {
    var a = nice.Type()();
    var b = nice.Type().extends(a)();

    expect(b.isSubType(b)).to.equal(true);
    expect(b.isSubType(a)).to.equal(true);
  });


  it("Method", function() {
    var spy = chai.spy();
    var City = nice.Type().Method('go', function(z, a){spy(a, z);})();
    var city = City();
    city.go(3);
    expect(spy).to.have.been.called.once().with(3, city);
  });


  it('typeOf', function () {
    expect(nice.typeOf(nice.Number()).title).to.equal('Number');
    expect(nice.typeOf([]).title).to.equal('Array');
    expect(nice.typeOf(1).title).to.equal('Number');
    expect(nice.typeOf('1').title).to.equal('String');
    expect(nice.typeOf({}).title).to.equal('Object');
    expect(nice.typeOf(undefined).title).to.equal('Undefined');
    expect(nice.typeOf(null).title).to.equal('Null');
//    expect(nice.typeOf(() => {}).title).to.equal('function');
  });


  it("Const", function() {
    let A = nice.Type().Const('qwe', 9)();
    let a = A();
    expect(A.qwe).to.equal(9);
    expect(a.qwe).to.equal(9);
    A.qwe = 5;
    expect(a.qwe).to.equal(9);
  });
});