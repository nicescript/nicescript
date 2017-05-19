var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Map", function() {

  it("Map setter", function() {
    var m = nice.Map();
    expect(m._typeTitle).to.equal('Map');

    m("qwe", 1);
    expect(m('asd', 2)).to.equal(m);
    expect(m('asd')).to.equal(2);

    m({"asd": 3, "zxc": 4});
    expect(m()).to.deep.equal({"qwe": 1, "asd": 3, "zxc": 4});
  });


  it("constructor", () => {
    var m = nice.Map({"qwe": 2, "asd": 1});
    expect(m()).to.deep.equal({"qwe": 2, "asd": 1});
  });


  it("within an object", function() {
    var m = nice.Object().Map('p');

    expect(m.p("qwe", 2)).to.equal(m);
    expect(m.p("qwe")).to.equal(2);
    expect(m().p["qwe"]).to.equal(2);
  });


  it("size", done => {
    var m = nice.Map();
    m({"qwe": 2, "asd": 1});

    expect(m.size()).to.equal(2);

    m.delete('qwe');
    expect(m.size()).to.equal(1);

    m("zxc", 3);
    m.size.listenBy(item => {
      expect(item()).to.equal(2);
      done();
    });
  });


  it("resetValue", () => {
    var m = nice.Map({"qwe": 2, "asd": 1});
    var spy = chai.spy();
    m.listenBy(spy);

    expect(m.size()).to.equal(2);
    m.resetValue();
    expect(m.size()).to.equal(0);
    expect(m()).to.deep.equal({});
    expect(spy).to.have.been.called.twice.with(m);
  });


  it("each", () => {
    var m = nice.Map();
    var spy = chai.spy();

    m.each(spy);
    expect(spy).not.to.have.been.called();

    m({qwe: 2}).each(spy);
    expect(spy).to.have.been.called.once.with(2, 'qwe');
  });


  it("map", () => {
    var m = nice.Map();
    expect(m.map(n => n*2)()).to.deep.equal({});
    m({"qwe": 2, "asd": 1});
    expect(m.map(n => n*2)()).to.deep.equal({qwe: 4, asd: 2});
  });


  it("mapArray", () => {
    var m = nice.Map();
    expect(m.mapArray(n => n*2)()).to.deep.equal([]);
    m({"qwe": 2, "asd": 1});
    expect(m.mapArray(n => n*2)()).to.deep.equal([4, 2]);
  });


  it("mapObject", () => {
    var m = nice.Map();
    expect(m.mapObject(n => n*2)()).to.deep.equal({});
    m({"qwe": 2, "asd": 1});
    expect(m.mapObject(n => n*2)()).to.deep.equal({qwe: 4, asd: 2});
  });


  it("values", () => {
    var m = nice.Map();
    expect(m.values()).to.deep.equal([]);
    m({"qwe": 2, "asd": 1});
    expect(m.values()).to.deep.equal([2, 1]);
  });


  it("filter", () => {
    var m = nice.Map({qwe:1,asd:2});
    expect(m.filter(n => n%2)()).to.deep.equal({qwe:1});
  });


  it("mapFilter", () => {
    var m = nice.Map({qwe:1,asd:2});
    expect(m.mapFilter(n => n-1)()).to.deep.equal({asd:1});
  });


  it("onEach", () => {
    var a = nice.Map();
    var spy = chai.spy();

    a({qwe: 2}).onEach(spy);
    expect(spy).to.have.been.called.once.with(2, 'qwe');
    a("zxc", 3);
    expect(spy).to.have.been.called.twice.with(3, 'zxc');
  });


  it("of", () => {
    var map = nice.Map().of('Number');
    map('qwe', '7');
    expect(map('qwe')).to.deep.equal(map.get('qwe'));
    expect(map('qwe')()).to.equal(7);
    map('qwe')('8');
    expect(map()).to.deep.equal({'qwe': 8 });
  });


  it("of Map", () => {
    var map = nice.Map().of('Map');

    map('qwe').set('asd', 1);
    map('qwe').set('asd', 2);
    expect(map()).to.deep.equal({'qwe': {'asd': 2}});
  });


  it("listen children", () => {
    var spy = chai.spy();
    var map = nice.Map().of('Number').listenBy(z => {
      spy(z());
    });
    var qwe = map('qwe');

    qwe(9);
    expect(spy).to.have.been.called.with({'qwe':9});
  });


  it("transaction", function(){
    var spy = chai.spy();
    var map = nice.Map().listenBy(spy);
    map.transactionStart();
    map('qwe', 3)('qwe', 4)('qwe', 5);
    map.transactionEnd();
    expect(spy).to.have.been.called.twice.with(map);
    expect(map()).to.deep.equal({"qwe": 5});
  });


  it("setting same value should resolve item", function(){
    var a = nice.Map();
    var spy = chai.spy();
    a.pending().listenBy(spy);
    expect(spy).not.to.have.been.called();
    a({});
    expect(spy).to.have.been.called.once.with(a);
    expect(a()).to.deep.equal({});
  });


  it("max", function(){
    var a = nice.Map();
    var max = a.max();
    expect(max()).to.equal(-Infinity);
    a.set('a', 1);
    expect(max()).to.equal(1);
  });


  it("reduce", function(){
    var a = nice.Map({a: 1, b: 2, c: 4});
    expect(a.reduce((sum, n) => sum + n, 0)()).to.equal(7);
  });


  it("reduceTo", function(){
    var a = nice.Map({a: 1, b: 2, c: 4});
    var sum = a.reduceTo((sum, n) => sum.inc(n), nice.Number());
    expect(sum()).to.equal(7);
    a('d', 6);
    expect(sum()).to.equal(13);
  });


  it("reduceTo.Type", function(){
    var a = nice.Map({a: 1, b: 2, c: 4});
    var sum = a.reduceTo.Number((sum, n) => sum.inc(n));
    expect(sum()).to.equal(7);
    a('d', 5);
    expect(sum()).to.equal(12);
  });

});
