const nice = require('../index.js')();
const chai = require('chai');
const expect = chai.expect;


describe("utils", function() {
  it('nice', function () {
    expect(nice(true, 1, '')._type).to.equal(nice.Arr);
    expect(nice([1])()).to.deep.equal([1]);
    expect(nice(true)._type).to.equal(nice.Bool);
    expect(nice(1)._type).to.equal(nice.Num);
    expect(nice('Hi')._type).to.equal(nice.Str);
    expect(nice({})._type).to.equal(nice.Obj);
  });


  it("format", function() {
    expect(nice.format('Hi %s', 'qwe')).to.equal('Hi qwe');
    expect(nice.format('Hi %d', 'qwe')).to.equal('Hi NaN');
    expect(nice.format('Hi %j', [1,2])).to.equal('Hi [1,2]');
    expect(nice.format('%%s', 'qwe')).to.equal('%s qwe');
  });


  it("Configurator", function() {
    let o = {};
    let c = nice.Configurator(o, 'name', 'size');
    c.name('Qwe').size(4);

    expect(c().name).to.equal('Qwe');
    expect(o.size).to.equal(4);

  });


//  it("objDiggMin", function() {
//    const o = {a: 1, b:{ bb:2 } };
//    nice.objDiggMin(o, 'b', 'bb', 1);
//    nice.objDiggMin(o, 'c', 'cc', 3);
//    expect(o.b.bb).to.equal(1);
//    expect(o.c.cc).to.equal(3);
//  });
//
//
//  it("objDiggMax", function() {
//    const o = {a: 1, b:{ bb:2 } };
//    nice.objDiggMax(o, 'b', 'bb', 1);
//    nice.objDiggMax(o, 'c', 'cc', 3);
//    expect(o.b.bb).to.equal(2);
//    expect(o.c.cc).to.equal(3);
//  });


//  it("objMax", function() {
//    const a = {a: 1, b:3 };
//    const b = {a: 2, b:1, c:4};
//    const o = nice.objMax(a, b);
//    expect(o.a).to.equal(2);
//    expect(o.b).to.equal(3);
//    expect(o.c).to.equal(4);
//  });


//  it("findKey", function() {
//    const a = ['a', 'b'];
//    const o = {qwe: 'a', asd: 'b'};
//    const f = l => l === 'b';
//    expect(nice.findKey(f, a)).to.equal(1);
//    expect(nice.findKey(f, o)).to.equal('asd');
//  });


  it("_eachEach", function() {
    const o = {qwe: [0], asd: {zxc:1}};
    const spy = chai.spy();
    nice._eachEach(o, spy);

    expect(spy).to.have.been.called.twice();
    expect(spy).to.have.been.called.with(0, 0, 'qwe');
    expect(spy).to.have.been.called.with(1, 'zxc', 'asd');
  });


//  it('orderedStringify', () => {
//    expect(nice.orderedStringify({qwe:1,asd:[1,2],zxc:{b:3,a:2},b:'bb'}))
//       .to.equal('{"asd":[1,2],"b":"bb","qwe":1,"zxc":{"a":2,"b":3}}');
//  });


  it("super", () => {
    const a = {qwe: 1, asd:1};
    const b = {qwe: 2};
    const c = {qwe: 3, asd: 3};
    Object.setPrototypeOf(b, a);
    Object.setPrototypeOf(c, b);
    expect(nice.super(b, 'qwe')).to.equal(1);
    expect(nice.super(c, 'qwe')).to.equal(2);
  });


  it("_set", () => {
    expect(nice._set({}, 'a', 1)).to.deep.equal({a:1});
    expect(nice._set({}, ['q', 'a'], 1)).to.deep.equal({q:{a:1}});
  });


  it("_get", () => {
    expect(nice._get({a:1}, 'a')).to.deep.equal(1);
    expect(nice._get({q:{a:2}}, ['q', 'a'])).to.deep.equal(2);
  });


  it("defineCached", () => {
    let o = {};
    nice.defineCached(o, function qwe(){ return {}; });
    expect(o.qwe).to.equal(o.qwe);
  });


  it("defineCached with prototype", () => {
    let o = {};
    let o2 = nice.create(o);
    let o3 = nice.create(o);
    nice.defineCached(o, function qwe(){ return {}; });
    nice.defineCached(o2, function qwe(){ return {}; });
    nice.defineCached(o3, function qwe(){ return {}; });
    expect(o.qwe).to.equal(o.qwe);
    expect(o2.qwe).to.equal(o2.qwe);
    expect(o3.qwe).to.equal(o3.qwe);
    expect(o.qwe).not.to.equal(o2.qwe);
    expect(o3.qwe).not.to.equal(o2.qwe);
  });


  it("with", () => {
    let o = {};
    let o2 = nice.with(o, v => v.qwe = 3);
    expect(o2).to.equal(o);
    expect(o.qwe).to.equal(3);

    let w = nice.with(o, nice);
    expect(w(v => v.asd = 4)).to.equal(o);
    expect(o.asd).to.equal(4);

    let w2 = nice.with(nice, v => v.zxc = 5);
    expect(w2(o)).to.equal(o);
    expect(o.zxc).to.equal(5);
  });
});
