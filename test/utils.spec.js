const nice = require('../index.js')();
const chai = require('chai');
const expect = chai.expect;
const x2 = n => n * 2;
const { fromJson, Obj, Arr, serialize, deserialize, Num } = nice;


describe("utils", function() {
  it('nice', function () {
    expect(nice.try(x2, 1)).to.equal(2);
    expect(nice.try(() => xx)._type).to.equal(nice.Err);
  });

  it('try', function () {
    expect(nice(true, 1, '')._type).to.equal(Arr);
    expect(nice([1]).jsValue).to.deep.equal([1]);
    expect(nice(true)._type).to.equal(nice.Bool);
    expect(nice(1)._type).to.equal(nice.Num);
    expect(nice('Hi')._type).to.equal(nice.Str);
    expect(nice({})._type).to.equal(Obj);
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

  it('Num fromJson', () => {
    const res = fromJson(5);
    expect(res._type).to.equal(nice.Num);
    expect(res()).to.equal(5);
  });

  it('Object fromJson', () => {
    const res = fromJson({});
    expect(res._type).to.equal(Obj);
    expect(res._items).to.deep.equal({});
  });

  it('Object fromJson', () => {
    const res = fromJson({ q: 5 });
    expect(res._type).to.equal(Obj);
    expect(res._items.q._type).to.equal(nice.Num);
    expect(res._items.q()).to.equal(5);
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


//  it("clone", function() {
//    let a = Arr(1,2);
//    let b = nice.clone(a);
//
//    expect(b()).to.deep.equal([1,2]);
//    a.push(3);
//
//    expect(b()).to.deep.equal([1,2]);
//  });
//
//
//  it("cloneDeep", function() {
//    let a = Arr(1,2);
//    let b = nice.cloneDeep(a);
//
//    expect(b()).to.deep.equal([1,2]);
//    a.push(3);
//
//    expect(b()).to.deep.equal([1,2]);
//  });

  const jsTable = [
    [2,2],
    [[],[]],
    [[1,2],[1,2]],
  ];
  const niceTable = [
    [Num(2), {[nice.TYPE_KEY]: 'Num', value: 2}],
    [Arr(1,2), {[nice.TYPE_KEY]: 'Arr', value: [1,2]}]
  ];

  it('serialze', () => {
    jsTable.forEach(pair => {
      expect(serialize(pair[0])).to.deep.equal(pair[1]);
    });
    niceTable.forEach(pair => {
      expect(serialize(pair[0])).to.deep.equal(pair[1]);
    });
  });


  it('deserialize', () => {
    jsTable.forEach(pair => {
      expect(deserialize(pair[1])).to.deep.equal(pair[1]);
    });
    niceTable.forEach(pair => {
      expect(deserialize(pair[1])._type).to.equal(nice[pair[1][nice.TYPE_KEY]]);
    });
  });


  it('serialze/deserialize', () => {
    const turn = v => nice.deserialize(nice.serialize(v));
    expect(turn(2)).to.equal(2);
    expect(turn([])).to.deep.equal([]);

    const a = {[nice.TYPE_KEY]:'Arr',value:[1,2]};
    expect(nice.serialize(Arr(1,2))).to.deep.equal(a);
    expect(nice.deserialize(a)._items).to.deep.equal([1,2]);
    expect(nice.deserialize(a)._type).to.equal(Arr);

    expect(turn(Obj())._type.name).to.equal('Obj');
    expect(turn(nice.Div('a')).children.get(0)).to.equal('a');
  });

});
