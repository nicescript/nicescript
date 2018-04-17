var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Object", function() {

  it("constructor", function() {
    var a = nice({asd: 3});
    expect(nice.fromItem(a)).to.deep.equal({asd:3});
  });


  it("set / get primitive", function() {
    var a = nice();
    a.set('qwe', 1);
    expect(a('qwe')()).to.equal(1);
    expect(a.get('qwe')()).to.equal(1);
  });


  it("set deep", function() {
    var a = nice();
    a.set(['qwe', 'asd'], 1);
    expect(a('qwe')()).to.deep.equal({asd:1});
    expect(a.get(['qwe', 'asd'])()).to.equal(1);
  });


  it("has", function() {
    var a = nice();
    a.set('qwe', 0).set('zxc', 1);
    expect(a.has('qwe')()).to.equal(true);
    expect(a.has('zxc')()).to.equal(true);
    expect(a.has('asd')()).to.equal(false);
  });


  it("has", function() {
    var a = nice();
    a.set(['qwe', 'asd'], 1);
    expect(a.has(['qwe', 'asd'])()).to.equal(true);
    expect(a.has(['zxc', 'asd'])()).to.equal(false);
  });


  it("object values", () => {
    let o = nice();
    o('qwe', {'':  1});
//    expect(o.get('qwe')()).to.deep.equal({'':1});
//    expect(o.get(['qwe', ''])()).to.deep.equal(1);
//    o('asd', {'zxc':  {'': 2}});
//    expect(o.get(['asd', 'zxc'])()).to.deep.equal({'':2});
  });


  it("set / get container", function() {
    var a = nice();
    var b = nice();
    b.set('asd', 2);
    a.set('qwe', b);
    expect(a('qwe')()).to.deep.equal({asd:2});
    expect(a.get('qwe')()).to.deep.equal({asd:2});
  });


  it("remove", function() {
    var a = nice({qwe: 1, asd: 3});
    a.remove('qwe');
    expect(a()).to.deep.equal({asd:3});
    expect(nice.fromItem(a)).to.deep.equal({asd:3});
  });


  it("removeAll", () => {
    var a = nice({qwe: 1, asd: 3});
    a.removeAll();
    expect(a.getResult()).to.deep.equal({});
  });


  it("Standalone class", function() {
    var Cat = nice.Type().String('name')();

    var ball = Cat().name('Ball');
    expect(ball.name()).to.equal('Ball');
    expect(ball.name.is('Ball')).to.equal(true);
    expect(ball.name.is('Flat')).to.equal(false);
  });


  it("Setting all data", function() {
    var type = nice.Type().String('name')();
    var cat = type({name: 'Ball'});
    expect(cat.name()).to.equal('Ball');
  });


  it("named type", function() {
    nice.Type('Cat').String('name');

    var cat = nice.Cat().name('Ball');
    expect(cat._type.title).to.equal('Cat');
    expect(cat.name()).to.equal('Ball');
  });


  it("Value", function() {
    var City = nice.Type().Single('price')();
    var city = City();
    city({price: "50$"});
    expect(city.price()).to.equal('50$');
    city({price: 50});
    expect(city.price()).to.equal(50);
  });


  it("by", function() {
    var Cat = nice.Type()
      .String('name')
      .by((z, name) => z.name(name))();

    var cat = Cat('Ball');
    expect(cat.name()).to.equal('Ball');
  });


  it("named type by", function() {
    nice.Type('Plane')
      .String('name')
      .by((z, name) => z.name(name));

    expect(nice.Plane('Ball').name()).to.equal('Ball');
  });


  it("Inheritance", function() {
    var A = nice.Type().Number('x')();

    var B = nice.Type()
      .Number('y')
      .extends(A)();

    var b = B().x(5).y(10);
    expect(b.y()).to.equal(10);
    expect(b.x()).to.equal(5);
  });


  it("Named inheritance", function() {
    nice.Type('Pet')
      .String('name')
      .Number('weight')
      .Number('legs')
      .by((z, name) => z.name(name));

    nice.Type('Dog')
      .Number('size')
      .extends('Pet')
      .by((z, name) => z.name(name).size(5).legs(4));

    expect(nice.Pet('qwe').name()).to.equal('qwe');

    var dog = nice.Dog('Ball').weight(10);
    expect(dog.name()).to.equal('Ball');
    expect(dog.weight()).to.equal(10);
    expect(dog.size()).to.equal(5);
    expect(dog.legs()).to.equal(4);
  });


  it("instances should not interfire", function() {
    nice.Type('Gate')
      .Number('items')
      .by(z => z.items(1));

    var g1 = nice.Gate().items(2);
    var g2 = nice.Gate();

    expect(g1.items === g2.items).to.equal(false);
    expect(g1.items()).to.deep.equal(2);
    expect(g2.items()).to.deep.equal(1);
  });


  it("itemBy", function() {
    var City = nice.Type()
      .Number('height')
      .by(z => z.height(20))();
    var city = City();
    expect(city()).to.deep.equal({ height: 20 });
  });


  it("Object property", function() {
    var City = nice.Type()
      .Object('streets')();
    var city = City();
    city.streets('Main', 1);
    expect(city.streets('Main')()).to.equal(1);
  });


  it("values", function() {
    var a = nice();
    a.set('qwe', 3);
    a.set('ad', 2);
    expect(a.values._type).to.equal(nice.Array);
    expect(a.values()).to.deep.equal([3, 2]);
  });


  it("reduce", function(){
    var c = nice.Object({qwe: 1, ads: 3});
    expect(c.reduce((sum, n) => sum + n, 3)()).to.equal(7);
  });


  it("reduceTo", function() {
    var c = nice.Object({qwe: 1, ads: 3});
    var a = nice.Number();

    expect(c.reduceTo(a, (z, v) => z.inc(v))).to.equal(a);
    expect(a()).to.equal(4);
  });


  it("reduceTo.Type", function() {
    var c = nice.Object({qwe: 1, ads: 3});
    var a = c.reduceTo.Number((z, v) => z.inc(v));
    expect(a.is.Number()).to.equal(true);
    expect(a()).to.equal(4);
  });


  it("sum", function() {
    var a = nice.Object({qwe: 1, ads: 3});
    expect(a.sum()()).to.equal(4);
  });


  it("some", function() {
    var o = nice.Object({qwe: 1, ads: 3});
    expect(o.is.some(n => n > 5)).to.equal(false);
    expect(o.is.some(n => n > 2)).to.equal(true);
  });


  it("find", () => {
    var c = nice.Object({qwe: 1, ads: 4});
    expect(c.find(n => n % 2 === 0)()).to.equal(4);
  });


  it("findKey", () => {
    var c = nice.Object({qwe: 1, ads: 4});
    expect(c.findKey(n => n % 2 === 0)()).to.equal('ads');
  });


  it("every", function() {
    var a = nice.Object({qwe: 1, ads: 3});
    expect(a.is.every(n => n > 2)).to.equal(false);
    expect(a.is.every(n => n > 0)).to.equal(true);
  });


  it("size", function() {
    expect(nice.Object({qwe: 1, ads: 3}).size).to.equal(2);
    expect(nice.Object().size).to.equal(0);
  });


  it("map", function() {
    var a = nice();
    a.set('qwe', 3);
    a.set('ad', 2);
    let b = a.map(v => v * 2);
    expect(b._type).to.equal(nice.Object);
    expect(b()).to.deep.equal({qwe:6, ad:4});
  });


  it("itemsType", function() {
    var a = nice().itemsType(nice.Number);
    a.set('qwe', 3);
    a.set('ad', '2');
    expect(a._type).to.equal(nice.Object);
    expect(a._itemsType).to.equal(nice.Number);
    expect(a()).to.deep.equal({qwe:3, ad:2});
  });


  it("count", () => {
    var a = nice.Array(1, 2, 3, 4, 5);
    expect(a.count(n => n() % 2)()).to.equal(3);
  });


  it("each stop", () => {
    let sum = 0;
    nice.Object({qwe: 1, asd: 2}).each(n => {
      sum += n;
      return nice.STOP;
    });
    expect(sum).to.equal(1);
  });


  it("filter", () => {
    var a = nice.Object({qwe: 1, asd: 2});
    expect(a.filter(n => n() % 2)()).to.deep.equal({qwe:1});
  });



//  it("includes", function() {
//    var a = nice.Object({qwe: 1, ads: 3});
//    expect(a.includes(7)).to.equal(false);
//    expect(a.includes(1)).to.equal(true);
//  });

});