const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const x2 = n => n * 2;
const even = n => n % 2 === 0;
const { set, get, map, filter, reduce } = nice;

describe("Obj", function() {

  it("set / get", function() {
    const o = {};
    set(o, 'qwe', 1);
    set(o, nice('asd'), 2);
    expect(o).to.deep.equal({qwe:1, asd: 2});
    expect(get(o, nice('qwe'))).to.equal(1);
    expect(get(o, 'asd')).to.equal(2);
  });

//  it("get deep", function() {
//    const a = Obj();
//    const asd = a.getDeep(['qwe', 'asd']);
//    expect(asd).to.equal(a.getDeep(['qwe', 'asd']));
//    expect(asd).to.equal(a.get('qwe').get('asd'));
//    expect(asd._parent).to.equal(a.get('qwe'));
//  });


//  it("set deep on empty", function() {
//    const a = Obj();
//    a.setDeep(['qwe', 'asd'], 1);
//    expect(a('qwe')()).to.deep.equal({asd:1});
//    expect(a.getDeep(['qwe', 'asd'])()).to.equal(1);
//  });
//
//

//  it("remove", function() {
//    const a = Obj({qwe: 1, asd: 3});
//    a.remove('qwe');
//    expect(a.jsValue).to.deep.equal({asd:3});
//  });
//
//
//  it("removeAll", () => {
//    const a = Obj({qwe: 1, asd: 3});
//    a.removeAll();
//    expect(a.jsValue).to.deep.equal({});
//  });


//  it("reduce", function(){
//    const c = Obj({qwe: 1, ads: 3});
//    expect(c.reduce((sum, n) => sum + n, 3)).to.equal(7);
//  });
//
//
//  it("sum", function() {
//    const a = Obj({qwe: 1, ads: 3});
//    expect(a.sum()).to.equal(4);
//  });
//
//
//  it("some", function() {
//    const o = Obj({qwe: 1, ads: 3});
//    expect(o.some(n => n > 5)).to.equal(false);
//    expect(o.some(n => n > 2)).to.equal(true);
//  });
//
//
//  it("find", () => {
//    const c = Obj({qwe: 1, ads: 4});
//    expect(c.find(n => n % 2 === 0)).to.equal(4);
//  });
//
//
//  it("findKey", () => {
//    const c = Obj({qwe: 1, ads: 4});
//    expect(c.findKey(n => n % 2 === 0)).to.equal('ads');
//  });
//
//
//  it("every", function() {
//    const a = Obj({qwe: 1, ads: 3});
//    expect(a.every(n => n > 2)).to.equal(false);
//    expect(a.every(n => n > 0)).to.equal(true);
//  });
//
//
//  it("size", function() {
//    expect(Obj({qwe: 1, ads: 3}).size).to.equal(2);
//    expect(Obj().size).to.equal(0);
//  });
//
//
//  it("map", function() {
//    const a = Obj();
//    a.set('qwe', 3);
//    a.set('ad', 2);
//    let b = a.map(x2);
//    expect(b._type).to.equal(Obj);
//    expect(b.jsValue).to.deep.equal({qwe:6, ad:4});
//  });
//
//
//  it("rMap", function() {
//    const a = Obj({qwe: 1, asd: 3});
//    const b = a.rMap(x2);
//    a.set('zxc', 2);
//    expect(b._type).to.equal(Obj);
//    expect(b.jsValue).to.deep.equal({qwe:2, asd:6, zxc:4});
//  });
//
//
//  it("count", () => {
//    const a = nice.Arr(1, 2, 3, 4, 5);
//    expect(a.count(n => n % 2)()).to.equal(3);
//  });
//
//
//  it("each stop", () => {
//    let sum = 0;
//    Obj({qwe: 1, asd: 2}).each(n => {
//      sum += n;
//      return nice.Stop();
//    });
//    expect(sum).to.equal(1);
//  });
//
//
//  it("filter", () => {
//    const a = Obj({qwe: 1, asd: 2});
//    expect(a.filter(n => n % 2).jsValue).to.deep.equal({qwe:1});
//  });
//
//
//  it("rFilter", function() {
//    const a = Obj({qwe: 1, asd: 2});
//    const b = a.rFilter(even);
//    a.set('zxc', 4);
//    expect(b._type).to.equal(Obj);
//    expect(b.jsValue).to.deep.equal({asd:2, zxc:4});
//    a.remove('asd');
//    expect(b.jsValue).to.deep.equal({zxc:4});
//  });
//
//
//  it("default object values for property", () => {
//    const T = nice.Type('Site')
//      .num('size', 1)
//      .obj('urls', {qwe:1})
//      .arr('pages', 'qwe', 'asd')
//      ();
//    expect(T().size()).to.equal(1);
//    expect(T().urls.get('qwe')).to.equal(1);
//    expect(T().pages.get(0)).to.equal('qwe');
//    expect(T().pages.get(1)).to.equal('asd');
//  });

});