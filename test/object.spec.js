const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = chai.expect;

describe("Obj", function() {

  it("constructor", function() {
    const a = nice({asd: 3});
    expect(a.getResult()).to.deep.equal({asd:3});
  });


  it("set / get primitive", function() {
    const a = nice();
    a.set('qwe', 1);
    expect(a('qwe')()).to.equal(1);
    expect(a.get('qwe')()).to.equal(1);
  });


  it("set / get with nice.Str as key", function() {
    const a = nice();
    a.set('qwe', 1);
    expect(a(nice('qwe'))()).to.equal(1);
    expect(a.get(nice('qwe'))()).to.equal(1);
  });


  it("set deep", function() {
    const a = nice();
    a.set(['qwe', 'asd'], 1);
    expect(a('qwe')()).to.deep.equal({asd:1});
    expect(a.get(['qwe', 'asd'])()).to.equal(1);
  });


  it("has", function() {
    const a = nice();
    a.set('qwe', 0).set('zxc', 1);
    expect(a.has('qwe')()).to.equal(true);
    expect(a.has('zxc')()).to.equal(true);
    expect(a.has('asd')()).to.equal(false);
  });


  it("has", function() {
    const a = nice();
    a.set(['qwe', 'asd'], 1);
    expect(a.has(['qwe', 'asd'])()).to.equal(true);
    expect(a.has(['zxc', 'asd'])()).to.equal(false);
  });


  it("object values", () => {
    let o = nice();
    o('qwe', {'':  1});
    expect(o.get('qwe')()).to.deep.equal({'':1});
    expect(o.get(['qwe', ''])()).to.deep.equal(1);
    o('asd', {'zxc':  {'': 2}});
    expect(o.get(['asd', 'zxc'])()).to.deep.equal({'':2});
  });


  it("set / get container", function() {
    const a = nice();
    const b = nice();
    b.set('asd', 2);
    a.set('qwe', b);
    expect(a('qwe')()).to.deep.equal({asd:2});
    expect(a.get('qwe')()).to.deep.equal({asd:2});
  });


  it("remove", function() {
    const a = nice({qwe: 1, asd: 3});
    a.remove('qwe');
    expect(a()).to.deep.equal({asd:3});
    expect(a.getResult()).to.deep.equal({asd:3});
  });


  it("removeAll", () => {
    const a = nice({qwe: 1, asd: 3});
    a.removeAll();
    expect(a.getResult()).to.deep.equal({});
  });


  it("Standalone class", function() {
    const Cat = nice.Type().Str('name')();

    const ball = Cat().name('Ball');
    expect(ball.name()).to.equal('Ball');
    expect(ball.name.is('Ball')).to.equal(true);
    expect(ball.name.is('Flat')).to.equal(false);
  });


  it("Setting all data", function() {
    const type = nice.Type().Str('name')();
    const cat = type({name: 'Ball'});
    expect(cat.name()).to.equal('Ball');
  });


  it("named type", function() {
    nice.Type('Cat').Str('name');

    const cat = nice.Cat().name('Ball');
    expect(cat._type.title).to.equal('Cat');
    expect(cat.name()).to.equal('Ball');
  });


  it("Value", function() {
    const City = nice.Type().Single('price')();
    const city = City();
    city({price: "50$"});
    expect(city.price()).to.equal('50$');
    city({price: 50});
    expect(city.price()).to.equal(50);
  });


  it("by", function() {
    const Cat = nice.Type()
      .Str('name')
      .by((z, name) => z.name(name))();

    const cat = Cat('Ball');
    expect(cat.name()).to.equal('Ball');
  });


  it("named type by", function() {
    nice.Type('Plane')
      .Str('name')
      .by((z, name) => z.name(name));

    expect(nice.Plane('Ball').name()).to.equal('Ball');
  });


  it("Inheritance", function() {
    const A = nice.Type().Num('x')();

    const B = nice.Type()
      .Num('y')
      .extends(A)();

    const b = B().x(5).y(10);
    expect(b.y()).to.equal(10);
    expect(b.get('y')()).to.equal(10);
    expect(b.x()).to.equal(5);
    expect(b.get('x')()).to.equal(5);
  });


  it("Named inheritance", function() {
    nice.Type('Pet')
      .Str('name')
      .Num('weight')
      .Num('legs')
      .by((z, name) => z.name(name));

    nice.Type('Dog')
      .Num('size')
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
      .Num('items')
      .by(z => z.items(1));

    const g1 = nice.Gate().items(2);
    const g2 = nice.Gate();

    expect(g1.items === g2.items).to.equal(false);
    expect(g1.items()).to.deep.equal(2);
    expect(g2.items()).to.deep.equal(1);
  });


  it("itemBy", function() {
    const City = nice.Type()
      .Num('height')
      .by(z => z.height(20))();
    const city = City();
    expect(city().height).to.deep.equal(20);
  });


  it("Obj property", function() {
    const City = nice.Type()
      .Obj('streets')();
    const city = City();
    city.streets('Main', 1);
    expect(city.streets('Main')()).to.equal(1);
  });


  it("values", function() {
    const a = nice();
    a.set('qwe', 3);
    a.set('ad', 2);
    expect(a.values._type).to.equal(nice.Arr);
    expect(a.values()).to.deep.equal([3, 2]);
  });


  it("reduce", function(){
    const c = nice.Obj({qwe: 1, ads: 3});
    expect(c.reduce((sum, n) => sum + n, 3)()).to.equal(7);
  });


  it("reduceTo", function() {
    const c = nice.Obj({qwe: 1, ads: 3});
    const a = nice.Num();

    expect(c.reduceTo(a, (z, v) => z.inc(v))).to.equal(a);
    expect(a()).to.equal(4);
  });


  it("reduceTo.Type", function() {
    const c = nice.Obj({qwe: 1, ads: 3});
    const a = c.reduceTo.Num((z, v) => z.inc(v));
    expect(a.is.Num()).to.equal(true);
    expect(a()).to.equal(4);
  });


  it("sum", function() {
    const a = nice.Obj({qwe: 1, ads: 3});
    expect(a.sum()()).to.equal(4);
  });


  it("some", function() {
    const o = nice.Obj({qwe: 1, ads: 3});
    expect(o.is.some(n => n > 5)).to.equal(false);
    expect(o.is.some(n => n > 2)).to.equal(true);
  });


  it("find", () => {
    const c = nice.Obj({qwe: 1, ads: 4});
    expect(c.find(n => n % 2 === 0)()).to.equal(4);
  });


  it("findKey", () => {
    const c = nice.Obj({qwe: 1, ads: 4});
    expect(c.findKey(n => n % 2 === 0)()).to.equal('ads');
  });


  it("every", function() {
    const a = nice.Obj({qwe: 1, ads: 3});
    expect(a.is.every(n => n > 2)).to.equal(false);
    expect(a.is.every(n => n > 0)).to.equal(true);
  });


  it("size", function() {
    expect(nice.Obj({qwe: 1, ads: 3}).size).to.equal(2);
    expect(nice.Obj().size).to.equal(0);
  });


  it("map", function() {
    const a = nice();
    a.set('qwe', 3);
    a.set('ad', 2);
    let b = a.map(v => v * 2);
    expect(b._type).to.equal(nice.Obj);
    expect(b()).to.deep.equal({qwe:6, ad:4});
  });


  it("itemsType", function() {
    const a = nice().itemsType(nice.Num);
    a.set('qwe', 3);
    a.set('ad', '2');
    expect(a._type).to.equal(nice.Obj);
    expect(a._itemsType).to.equal(nice.Num);
    expect(a()).to.deep.equal({qwe:3, ad:2});
  });


  it("count", () => {
    const a = nice.Arr(1, 2, 3, 4, 5);
    expect(a.count(n => n() % 2)()).to.equal(3);
  });


  it("each stop", () => {
    let sum = 0;
    nice.Obj({qwe: 1, asd: 2}).each(n => {
      sum += n;
      return nice.STOP;
    });
    expect(sum).to.equal(1);
  });


  it("filter", () => {
    const a = nice.Obj({qwe: 1, asd: 2});
    expect(a.filter(n => n() % 2)()).to.deep.equal({qwe:1});
  });


  it("default object values for property", () => {
    const t = nice.Type('Site')
      .Obj('urls', {qwe:1})
      .Arr('pages', ['qwe'])
      ();
    expect(t().urls('qwe')()).to.equal(1);
    expect(t().pages.get(0)()).to.equal('qwe');
  });

//  it("includes", function() {
//    const a = nice.Obj({qwe: 1, ads: 3});
//    expect(a.is.includes(7)).to.equal(false);
//    expect(a.is.includes(1)).to.equal(true);
//  });

});