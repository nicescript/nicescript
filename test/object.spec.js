const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;
const Obj = nice.Obj;

describe("Obj", function() {

  it("constructor", function() {
    const a = Obj({asd: 3});
    expect(a.get('asd')()).to.equal(3);
    expect(a.get('qwe').is.NotFound()).to.equal(true);
  });


  it("set / get primitive", function() {
    const a = Obj();
    a.set('qwe', 1);
    expect(a.get('qwe')()).to.equal(1);
  });


  it("set / get with nice.Str as key", function() {
    const a = Obj();
    a.set('qwe', 1);
    expect(a.get(nice('qwe'))()).to.equal(1);
  });


//  it("get deep", function() {
//    const a = Obj();
//    const asd = a.getDeep(['qwe', 'asd']);
//    expect(asd).to.equal(a.getDeep(['qwe', 'asd']));
//    expect(asd).to.equal(a.get('qwe').get('asd'));
//    expect(asd._parent).to.equal(a.get('qwe'));
//    expect(asd.is.NotFound()).to.equal(true);
//  });


//  it("set deep on empty", function() {
//    const a = Obj();
//    a.setDeep(['qwe', 'asd'], 1);
//    expect(a('qwe')()).to.deep.equal({asd:1});
//    expect(a.getDeep(['qwe', 'asd'])()).to.equal(1);
//  });
//
//
//  it("set deep on single", function() {
//    const a = Obj();
//    a.set('qwe', 1);
//    expect(() => a.setDeep(['qwe', 'asd'], 1)).to.throw("Can't set children to number");
//  });


//  it("object values", () => {
//    let o = Obj();
//    o('qwe', {'':  1});
//    expect(o.get('qwe')()).to.deep.equal({'':1});
//    expect(o.getDeep(['qwe', ''])()).to.deep.equal(1);
//    o('asd', {'zxc':  {'': 2}});
//    expect(o.getDeep(['asd', 'zxc'])()).to.deep.equal({'':2});
//  });


  it("remove", function() {
    const a = Obj({qwe: 1, asd: 3});
    a.remove('qwe');
    expect(a.jsValue).to.deep.equal({asd:3});
  });


  it("removeAll", () => {
    const a = Obj({qwe: 1, asd: 3});
    a.removeAll();
    expect(a.jsValue).to.deep.equal({});
  });


  it("Standalone class", function() {
    const Cat = nice.Type().str('name')();

    const ball = Cat().name('Ball');
    expect(ball.name()).to.equal('Ball');
    expect(ball.name.is('Ball')).to.equal(true);
    expect(ball.name.is('Flat')).to.equal(false);
  });


  it("Setting all data", function() {
    const type = nice.Type().str('name')();
    const cat = type({name: 'Ball'});
    expect(cat.name()).to.equal('Ball');
  });


  it("named type", function() {
    nice.Type('Cat').str('name');

    const cat = nice.Cat().name('Ball');
    expect(cat._type.name).to.equal('Cat');
    expect(cat.name()).to.equal('Ball');
  });


  it("Value", function() {
    const City = nice.Type().single('price')();
    const city = City();
    city({price: "50$"});
    expect(city.price()).to.equal('50$');
    city({price: 50});
    expect(city.price()).to.equal(50);
  });


  it("by", function() {
    const Cat = nice.Type()
      .str('name')
      .by((z, name) => z.name(name))();

    const cat = Cat('Ball');
    expect(cat.name()).to.equal('Ball');
  });


  it("named type by", function() {
    nice.Type('Plane')
      .str('name')
      .by((z, name) => z.name(name));

    expect(nice.Plane('Ball').name()).to.equal('Ball');
  });


  it("Inheritance", function() {
    const A = nice.Type().num('x')();

    const B = nice.Type()
      .num('y')
      .extends(A)();

    const b = B().x(5).y(10);
    expect(b.y()).to.equal(10);
    expect(b.get('y')()).to.equal(10);
    expect(b.x()).to.equal(5);
    expect(b.get('x')()).to.equal(5);
  });


  it("Named inheritance", function() {
    nice.Type('Pet')
      .str('name')
      .num('weight')
      .num('legs')
      .by((z, name) => z.name(name));

    nice.Type('Dog')
      .num('size')
      .extends('Pet')
      .by((z, name) => z.name(name).size(5).legs(4));

    expect(nice.Pet('qwe').name()).to.equal('qwe');

    const dog = nice.Dog('Ball').weight(10);
    expect(dog.name()).to.equal('Ball');
    expect(dog.weight()).to.equal(10);
    expect(dog.size()).to.equal(5);
    expect(dog.legs()).to.equal(4);
  });


  it("instances should not interfire", function() {
    nice.Type('Gate')
      .num('items')
      .by(z => z.items(1));

    const g1 = nice.Gate().items(2);
    const g2 = nice.Gate();

    expect(g1.items === g2.items).to.equal(false);
    expect(g1.items()).to.equal(2);
    expect(g2.items()).to.equal(1);
  });


  it("itemBy", function() {
    const City = nice.Type()
      .num('height')
      .by(z => z.height(20))();
    const city = City();
    expect(city.height()).to.equal(20);
  });


  it("Obj property", function() {
    const City = nice.Type()
      .obj('streets')();
    const city = City();
    city.streets.set('Main', 1);
    expect(city.streets.get('Main')()).to.equal(1);
  });


  it("values", function() {
    const a = Obj();
    a.set('qwe', 3);
    a.set('ad', 2);
    expect(a.values._type).to.equal(nice.Arr);
    expect(a.values.jsValue).to.deep.equal([3, 2]);
  });


  it("reduce", function(){
    const c = Obj({qwe: 1, ads: 3});
    expect(c.reduce((sum, n) => sum + n, 3)()).to.equal(7);
  });


  it("reduceTo", function() {
    const c = Obj({qwe: 1, ads: 3});
    const a = nice.Num();

    expect(c.reduceTo(a, (z, v) => z.inc(v))).to.equal(a);
    expect(a()).to.equal(4);
  });


  it("reduceTo.Type", function() {
    const c = Obj({qwe: 1, ads: 3});
    const a = c.reduceTo.Num((z, v) => z.inc(v));
    expect(a.is.Num()).to.equal(true);
    expect(a()).to.equal(4);
  });


  it("sum", function() {
    const a = Obj({qwe: 1, ads: 3});
    expect(a.sum()()).to.equal(4);
  });


  it("some", function() {
    const o = Obj({qwe: 1, ads: 3});
    expect(o.is.some(n => n > 5)).to.equal(false);
    expect(o.is.some(n => n > 2)).to.equal(true);
  });


  it("find", () => {
    const c = Obj({qwe: 1, ads: 4});
    expect(c.find(n => n % 2 === 0)()).to.equal(4);
  });


  it("findKey", () => {
    const c = Obj({qwe: 1, ads: 4});
    expect(c.findKey(n => n % 2 === 0)()).to.equal('ads');
  });


  it("every", function() {
    const a = Obj({qwe: 1, ads: 3});
    expect(a.is.every(n => n > 2)).to.equal(false);
    expect(a.is.every(n => n > 0)).to.equal(true);
  });


  it("size", function() {
    expect(Obj({qwe: 1, ads: 3}).size).to.equal(2);
    expect(Obj().size).to.equal(0);
  });


  it("map", function() {
    const a = Obj();
    a.set('qwe', 3);
    a.set('ad', 2);
    let b = a.map(v => v * 2);
    expect(b._type).to.equal(Obj);
    expect(b.jsValue).to.deep.equal({qwe:6, ad:4});
  });


  it("itemsType", function() {
    const a = Obj().itemsType(nice.Num);
    a.set('qwe', 3);
    a.set('ad', '2');
    expect(() => a.set('zc', {})).to.throw();
    expect(a._type).to.equal(Obj);
    expect(a._itemsType).to.equal(nice.Num);
    expect(a.jsValue).to.deep.equal({qwe:3, ad:2});
  });


  it("count", () => {
    const a = nice.Arr(1, 2, 3, 4, 5);
    expect(a.count(n => n() % 2)()).to.equal(3);
  });


  it("each stop", () => {
    let sum = 0;
    Obj({qwe: 1, asd: 2}).each(n => {
      sum += n;
      return nice.Stop();
    });
    expect(sum).to.equal(1);
  });


  it("filter", () => {
    const a = Obj({qwe: 1, asd: 2});
    expect(a.filter(n => n() % 2).jsValue).to.deep.equal({qwe:1});
  });


  it("default object values for property", () => {
    const T = nice.Type('Site')
      .num('size', 1)
      .obj('urls', {qwe:1})
      .arr('pages', 'qwe', 'asd')
      ();
    expect(T().size()).to.equal(1);
    expect(T().urls.get('qwe')()).to.equal(1);
    expect(T().pages.get(0)()).to.equal('qwe');
    expect(T().pages.get(1)()).to.equal('asd');
  });

//  it("includes", function() {
//    const a = Obj({qwe: 1, ads: 3});
//    expect(a.is.includes(7)).to.equal(false);
//    expect(a.is.includes(1)).to.equal(true);
//  });

});