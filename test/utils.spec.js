var nice = require('../index.js')();
var chai = require('chai');
var expect = chai.expect;


describe("Nice utils", function() {
  it("format", function() {
    expect(nice.format('Hi %s', 'qwe')).to.equal('Hi qwe');
    expect(nice.format('Hi %d', 'qwe')).to.equal('Hi NaN');
    expect(nice.format('Hi %j', [1,2])).to.equal('Hi [1,2]');
    expect(nice.format('%%s', 'qwe')).to.equal('%s qwe');
  });


  it("objDiggMin", function() {
    var o = {a: 1, b:{ bb:2 } };
    nice.objDiggMin(o, 'b', 'bb', 1);
    nice.objDiggMin(o, 'c', 'cc', 3);
    expect(o.b.bb).to.equal(1);
    expect(o.c.cc).to.equal(3);
  });


  it("objDiggMax", function() {
    var o = {a: 1, b:{ bb:2 } };
    nice.objDiggMax(o, 'b', 'bb', 1);
    nice.objDiggMax(o, 'c', 'cc', 3);
    expect(o.b.bb).to.equal(2);
    expect(o.c.cc).to.equal(3);
  });


  it("objMax", function() {
    var a = {a: 1, b:3 };
    var b = {a: 2, b:1, c:4};
    var o = nice.objMax(a, b);
    expect(o.a).to.equal(2);
    expect(o.b).to.equal(3);
    expect(o.c).to.equal(4);
  });


  it("reduceToObject", function() {
    var a = ['a', 'b'];
    var o = nice.reduceToObject(a, (res, v, k) => res[v] = k);
    expect(o.a).to.equal(0);
    expect(o.b).to.equal(1);
  });


  it("findKey", function() {
    var a = ['a', 'b'];
    var o = {qwe: 'a', asd: 'b'};
    var f = l => l === 'b';
    expect(nice.findKey(f, a)).to.equal(1);
    expect(nice.findKey(f, o)).to.equal('asd');
  });


  it("eachEach", function() {
    var o = {qwe: [0], asd: {zxc:1}};
    var spy = chai.spy();
    nice.eachEach(spy, o);

    expect(spy).to.have.been.called.twice();
    expect(spy).to.have.been.called.with(0, 0, 'qwe');
    expect(spy).to.have.been.called.with(1, 'zxc', 'asd');
  });


  it('orderedStringify', () => {
    expect(nice.orderedStringify({qwe:1,asd:[1,2],zxc:{b:3,a:2},b:'bb'}))
       .to.equal('{"asd":[1,2],"b":"bb","qwe":1,"zxc":{"a":2,"b":3}}');
  });


  it('pull', () => {
    expect(nice.pull(2, [1, 2, 3])).to.deep.equal([1, 3]);
  });


  it('pullAll', () => {
    expect(nice.pullAll([2, 4, 5], [1, 2, 3, 4])).to.deep.equal([1, 3]);
  });


  it("sortBy", () => {
    var a = [8, 5, 9];
    expect(nice.sortBy(i => i, a)).to.deep.equal([5, 8, 9]);
    var invertor = nice.sortBy(i => -i);
    expect(invertor(a)).to.deep.equal([9, 8, 5]);
  });


  it("filter", () => {
    var a = [8, 5, 9];
    expect(nice.filterArray(i => i % 2, a)).to.deep.equal([5, 9]);

    var evenItems = nice.filterArray(i => !(i % 2));
    expect(evenItems(a)).to.deep.equal([8]);
  });


  it("once", () => {
    var spy = chai.spy();
    var f = nice.once(spy);
    f();
    f();
    f();
    expect(spy).to.have.been.called.once();
  });
});
