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



//  it("named type", function() {
//    nice.Class('Dog').String('name');
//    var dog = nice.Dog({name: 'Bone'});
//    expect(dog.name()).to.equal('Bone');
//  });


//  it("Classs by", function() {
//    var type = nice.Class().Number('x').by(z => {console.log('By called'); return 4});
//    var x2 = type(1);
//    x2.by(z => {console.log('By called'); return 4});
//    expect(x2()).to.equal(4);
//  });


  // it("Default value", function() {
  //   nice.type('Bird').at(nice)
  //     .String('name').default('No name').up
  //     .Number('size').default(5);
  //
  //   var bird = nice.Bird();
  //   expect(bird.name()).to.equal('No name');
  //   expect(bird.size()).to.equal(5);
  //   expect(bird.size.is(5)).to.equal(true);
  //
  //   bird.size(6)
  //   expect(bird.size()).to.equal(6);
  //   expect(bird.size.is(6)).to.equal(true);
  // });
  //
  //
  //
  // it("Default key", function() {
  //   nice.type('City').at(nice)
  //     .String('title').firstKey;
  //
  //   var oslo = nice.City('Oslo');
  //   expect(oslo._type).to.equal('City');
  //   expect(oslo.title()).to.equal('Oslo');
  //   expect(oslo._keys()).to.deep.equal({title:'Oslo'});
  //   expect(oslo.title()).to.equal('Oslo');
  // });
  //
  //
  // it("Property set", function() {
  //   nice.type('City2').at(nice)
  //     .String('title');
  //
  //   var oslo = nice.City();
  //   oslo.title('Oslo');
  //   expect(oslo.title()).to.equal('Oslo');
  //   expect(oslo.title.is('Oslo')).to.equal(true);
  //   expect(oslo.title.is('Vien')).to.equal(false);
  // });
  //
  //
  // it("Keys", function() {
  //   nice.type('Car').at(nice)
  //     .String('model').key.up
  //     .String('make').key.default('No Make').up
  //     .Number('size');
  //
  //   var car = nice.Car().make('BMW').model('3').size(4);
  //   expect(car._keys()).to.deep.equal({make:'BMW',model:'3'});
  // });
  //
  //
  // it("Creator access", function() {
  //   var f2 = chai.spy();
  //   nice.type('City').at(nice);
  //   nice.type('Street').at('City');
  //   nice.type('House').at('Street');
  //   nice.type('Park').at('City').method('walk', f2);
  //
  //   var city = nice.City()
  //   var street = city.Street();
  //   var house = street.House();
  //   var park = house.Park();
  //   park.walk();
  //   expect(f2).to.have.been.called();
  //   expect(house._parent).to.equal(street);
  //   expect(house.Street).to.equal(street);
  //   expect(park._parent).to.equal(city);
  // });
  //
  //
  // it("Object property", function(){
  //   nice.type('Storage45').at(nice)
  //     .Object('items');
  //
  //   var storage = nice.Storage45();
  //   storage.items({'banana': 3});
  //   storage.items('apple', 2);
  //   expect(storage.items('apple')).to.equal(2);
  //   expect(storage.items('banana')).to.equal(3);
  // });
  //
  //
  // it("Named functions", function(){
  //   nice.type('Cat').at(nice)
  //     .NamedFunctions('actions');
  //
  //   var spy = chai.spy();
  //
  //   var ball = nice.Cat();
  //   ball.actions(function go(){spy()});
  //   ball.actions('run', spy);
  //
  //   ball.actions('go')();
  //   ball.actions('run')();
  //   expect(spy).to.have.been.called.twice;
  // });
  //
  //
  // it("cacheTime", function(){
  //   nice.type('C1').at(nice)
  //     .cacheTime(Infinity);
  //
  //   nice.type('C2').at('C1')
  //     .cacheTime(Infinity);
  //
  //   var c1 = nice.C1('qwe');
  //   expect(c1 === nice.C1('qwe')).to.equal(true);
  //   expect(c1 !== nice.C1('asd')).to.equal(true);
  //
  //   expect(c1.C2('1') === c1.C2('1')).to.be.true;
  //   expect(c1.C2('1') !== c1.C2('2')).to.be.true;
  // });





  //bad idea because need() usualy use call chain which is different for different types
//  it("inherited setups", function(f){
//    nice.type('X1').at(nice)
//      .setup(z => z.need(o.t1));
//    nice.type('X2').at(nice)
//      .extends('X1');
//
//    nice.X2().once(x2 => {
//      expect(o.t1).to.have.been.calledTimes(1);
//      f();
//    });
//  });

//  it("Default value", function() {
//    nice.type('City').at(nice)
//      .string('cityName')
//      .default.cityName('QWE1');
//    nice.type('SmallCity').at(nice).extends('City')
//      .default.cityName('qwe1');
//
//    console.log(nice.type('City').default);
//    nice.type('City').default.cityName('No name');
////    console.log(nice.type('City').properties('cityName'));
//    expect(nice.City().cityName()).toBe('QWE1');
//    expect(nice.SmallCity().cityName()).toBe('qwe1');
//  });
});
