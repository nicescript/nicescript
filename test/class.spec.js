var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("class", function() {

  it("Standalone class", function() {
    var cat = nice.Class().String('name');
    expect(cat._typeTitle).to.equal('Class');
    expect(cat._typeTitle).to.equal('Class');

    var ball = cat().name('Ball');
    expect(ball.name()).to.equal('Ball');
    expect(ball.name.is('Ball')).to.equal(true);
    expect(ball.name.is('Flat')).to.equal(false);
  });


  it("Setting all data", function() {
    var type = nice.Class().String('name');
    var cat = type({name: 'Ball'});
    expect(cat.name()).to.equal('Ball');
  });


  it("named type", function() {
    nice.class('Cat').String('name');

    var cat = nice.Cat().name('Ball');
    expect(cat._typeTitle).to.equal('Cat');
    expect(cat.name()).to.equal('Ball');
  });


  it("Value", function() {
    var City = nice.Class().Item('price');
    var city = City();
    city({price: "50$"});
    expect(city.price()).to.equal('50$');
    city({price: 50});
    expect(city.price()).to.equal(50);
  });


  it("initBy", function() {
    var Cat = nice.Class()
      .String('name')
      .initBy((z, name) => z.name(name));

    var cat = Cat('Ball');
    expect(cat.name()).to.equal('Ball');
  });


  it("named type initBy", function() {
    nice.class('Plane')
      .String('name')
      .initBy((z, name) => z.name(name));

    expect(nice.Plane('Ball').name()).to.equal('Ball');
  });


  it("Method", function() {
    var spy = chai.spy();
    var City = nice.Class().Method('go', function(a){spy(a, this);});
    var city = City();
    city.go(3);
    expect(spy).to.have.been.called.once().with(3, city);
  });


  it("Constant", function(){
    var City = nice.Class()
      .Constant('size', 1001);
    var city = City();
    expect(city.size).to.equal(1001);
  });


  it("Inheritance", function() {
    var A = nice.Class().Number('x');

    var B = nice.Class()
      .Number('y')
      .extends(A);

    var b = B().x(5).y(10);
    expect(b.y()).to.equal(10);
    expect(b.x()).to.equal(5);
  });


  it("Named inheritance", function() {
    nice.class('Pet')
      .String('name')
      .Number('weight')
      .initBy((z, name) => z.name(name));

    nice.class('Dog')
      .Number('size')
      .extends('Pet');

    expect(nice.Pet().size).to.equal(undefined);
    expect(nice.Pet('qwe').name()).to.equal('qwe');

    var dog = nice.Dog('Ball').size(5).weight(10);
    expect(dog.name()).to.equal('Ball');
    expect(dog.weight()).to.equal(10);
    expect(dog.size()).to.equal(5);
  });


  it("instances should not interfire", function() {
    nice.class('Gate')
      .Array('items')
      .initBy(z => z.items(1));
    var g1 = nice.Gate().items(2, 4);
    var g2 = nice.Gate();

    expect(g1.items === g2.items).to.equal(false);
    expect(g1.items()).to.deep.equal([1, 2,4]);
    expect(g2.items()).to.deep.equal([1]);
  });


  it("itemBy", function() {
    var City = nice.Class()
      .Number('height')
      .itemBy(z => z.height(20));
    var city = City();
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ height: 20 });
  });


  it("child's by", function() {
    var City = nice.Class()
      .String('title', z => z('Rome'))
      .Number('size', z => z(50))
      .Number('height');
    var city = City();
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ title: 'Rome', size: 50 });
  });


  it("child's by should unresolve container", function() {
    var City = nice.Class()
      .String('title', z => z('Rome'))
      .Number('size', z => z(50))
      .Number('height')
      .itemBy(z => z.height(20));
    var city = City();
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ title: 'Rome', size: 50, height: 20 });
  });


  it("child's child's by should unresolve container", function() {
    var City = nice.Class()
      .Object('mayor', z => z.Number('age', z => z(50)))
      .Number('height')
      .itemBy(z => z.height(20));
    var city = City();
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ mayor: { age: 50}, height: 20 });
  });
});
