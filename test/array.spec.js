var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Nice Array", function() {

  it("setter", function() {
    var a = nice.Array();

    a(2)(3, 4)(5);
    expect(a()).to.deep.equal([2, 3, 4, 5]);
  });


  it("constructor", function() {
//    var a = nice.Array();
    var a = nice.Array(1, 5, 8);
    a(9)
//    expect(a()).to.deep.equal([9]);
    expect(a()).to.deep.equal([1, 5, 8, 9]);
  });

  it("lock", function(){
    var a = nice.Array();

    a.lock();
    expect(() => a(6)).to.throw();
    expect(a()).to.deep.equal([]);

    a.unlock();
    expect(() => a(7)).not.to.throw();
    expect(a()).to.deep.equal([7]);
  });


  it("listen", () => {
    var a = nice.Array();
    var spy = chai.spy();

    a.listenBy(item => spy(item()));
    expect(spy).to.have.been.called.once();
    expect(a()).to.deep.equal([]);
    a(2);
    expect(spy).to.have.been.called.twice();
    expect(a()).to.deep.equal([2]);
  });


  it("pull", done => {
    var a = nice.Array();

    a(1, 2, 3);
    a.pull(2);
    a.listenBy(item => {
      expect(item()).to.deep.equal([1, 3]);
      done();
    });
  });


  it("filter", () => {
    var a = nice.Array();
    var even = a.filter(n => n % 2 === 0);
    var spy = chai.spy();

    a(1, 2, 3, 4, 5);
    even.listenBy(spy);
    expect(spy).to.have.been.called.once().with(even);
    expect(even()).to.deep.equal([2,4]);
  });


  it("sortBy", () => {
    var a = nice.Array(4, 3, 5);
    expect(a.sortBy()()).to.deep.equal([3,4,5]);
    expect(a.sortBy(v => -v)()).to.deep.equal([5,4,3]);
  });


  it("find", () => {
    var a = nice.Array(1, 2, 3, 4, 5);
    expect(a.find(n => n % 2 === 0)).to.equal(2);
  });


  it("onAdd", () => {
    var a = nice.Array();
    var a2 = nice.Array();
    var spy = chai.spy();
    var spy2 = chai.spy();
    a.onAdd(spy);
    a2.onAdd(spy2);
    a(2);
    expect(spy).to.have.been.called.once.with(2, 0);
    expect(spy2).not.to.have.been.called();
  });


  it("onEach", () => {
    var a = nice.Array();
    var spy = chai.spy();

    a(2).onEach(spy);
    expect(spy).to.have.been.called.once.with(2, 0);
    a(3);
    expect(spy).to.have.been.called.twice.with(3, 1);
  });


  it("_compareItems", function(){
    var a1 = [1, 2, 3];
    var a2 = [1, 3, 4];
    var add = chai.spy();
    var del = chai.spy();

    nice.ArrayPrototype._compareItems(a1, a2, add, del);
    expect(add).have.been.called.once.with(4, 2);
    expect(del).have.been.called.once.with(2, 1);
  });


  it("_compareItems 2", function(){
    var a1 = [1, 2, 3];
    var a2 = [1, 15, 16, 2, 3];
    var addSpy = chai.spy();
    var add = (...v) => {addSpy(...v)};
    var del = chai.spy();

    nice.ArrayPrototype._compareItems(a1, a2, add, del);
    expect(addSpy).to.have.been.called.twice();
    expect(addSpy).to.have.been.called.with(15, 1);
    expect(addSpy).to.have.been.called.with(16, 2);
    expect(del).not.to.have.been.called();
  });


  it("_compareItems 3", function(){
    var a1 = [];
    var a2 = [1, 2];
    var addSpy = chai.spy();
    var add = (...v) => {addSpy(...v)};
    var del = chai.spy();

    nice.ArrayPrototype._compareItems(a1, a2, add, del);
    expect(addSpy).to.have.been.called.twice();
    expect(addSpy).to.have.been.called.with(0, 1);
    expect(addSpy).to.have.been.called.with(1, 2);
    expect(del).not.to.have.been.called();
  });


  it("_compareItems 4", function(){
    var a1 = [1, 2];
    var a2 = [];
    var add = chai.spy();
    var del = chai.spy();

    nice.ArrayPrototype._compareItems(a1, a2, add, del);
    expect(add).not.to.have.been.called();
    expect(del).to.have.been.called.twice();
    expect(del).to.have.been.called.with(1, 0);
    expect(del).to.have.been.called.with(2, 0);
  });


  it("by()", () => {
    var n = nice.Number().pending();
    var a = nice.Array().by(z => z.replace([1, z.use(n)()]));
    var spy = chai.spy();

    a.onEach((v, k) => {
//      console.log('-', v, k);
      spy(v, parseInt(k));
    });
    n(4);
//    console.log(a());
    expect(spy).to.have.been.called.with(1, 0);
    expect(spy).to.have.been.called.with(4, 1);
  });


  it("async by()", (done) => {
    var a = nice.Array().by(z => {
      setTimeout(() => z('qwe', 'asd'), 1);
    });
    a.listenBy(z => {
//      console.log(z());
      expect(z()).to.deep.equal(['qwe', 'asd']);
      done();
    });
  });


  it("by() with chain and delay", (done) => {
    var n = nice(f => setTimeout(() => f(13), 1));
    var a = nice.Array().by(z => z(...[z.use(n)()]));

    a.listenBy(z => {
      expect(z()).to.deep.equal([13]);
      done();
    });
  });


  it("object property by()", () => {
    var o = nice.Object().Array('urls');
    o.urls.by(z => z("qwe", "asd"));

    var spy = chai.spy();

    o.urls.onEach((v) => spy(v));
    expect(spy).to.have.been.called.with("qwe");
    expect(spy).to.have.been.called.with("asd");
  });


  it("class property by()", () => {
    var car = nice.Class().Array('wheels');
    var c = car();
    c.wheels.by(z => z(16, 17));
    var spy = chai.spy();

    c.wheels.onEach((v) => spy(v));
    expect(spy).to.have.been.called.with(16);
    expect(spy).to.have.been.called.twice.with(17);
  });


  it("count", () => {
    var a = nice.Array(1, 2, 3, 4, 5);
    expect(a.count(n => n % 2)()).to.equal(3);
  });


  it("preserve order when replace", () => {
    var a = nice.Array(3, 2, 1);
    var spy = chai.spy();

    expect(a()).to.deep.equal([3, 2, 1]);
    a.onEach((v, k) => spy(v));

    a.replace([1, 2, 3]);
    expect(a()).to.deep.equal([1,2,3]);
  });


  it("use", function(){
    var a = nice.Array();
    var b = nice.Array().by(z => z.set(...z.use(a).map(n => n+1)));
    expect(b()).to.deep.equal([]);
    a(5, 2);
    expect(b()).to.deep.equal([6,3]);
    a(1,8);
    expect(b()).to.deep.equal([6,3,2,9]);
  });


  it("transaction", function(){
    var spy = chai.spy();
    var a = nice.Array().listenBy(spy);
    a.transactionStart();
    a(3)(4)(5);
    a.transactionEnd();
    expect(spy).to.have.been.called.twice.with(a);
    expect(a()).to.deep.equal([3, 4, 5]);
  });


  it("of transaction", function(){
    var spy = chai.spy();
    var a = nice.Array().of('Number').listenBy(spy);
    a.transactionStart();
    a(3)(4)(5);
    a.transactionEnd();
    expect(spy).to.have.been.called.twice.with(a);
    expect(a()).to.deep.equal([3, 4, 5]);
  });


  it("setting same value shuld resolve item", function(){
    var a = nice.Array();
    var spy = chai.spy();
    a.pending().listenBy(spy);
    expect(spy).not.to.have.been.called();
    a([]);
    expect(spy).to.have.been.called.once.with(a);
    expect(a()).to.deep.equal([]);
  });


  it("clear", function(){
    var a = nice.Array(1, 2);
    a.clear();
    expect(a()).to.deep.equal([]);
  });

});
