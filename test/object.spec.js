var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Object", function() {

  it("fill", function() {
    var city = nice.Object().String('title').Number('population').Number('size');
    expect(city._typeTitle).to.equal('Object');
    city.title('Oslo').population('600').population('500');
    expect(city()).to.deep.equal({title: "Oslo", population: 500});
    expect(city.title()).to.equal('Oslo');
    expect(city.size()).to.equal(0);
  });


  it("objects should not interfire", function() {
    var city = nice.Object().String('title');
    var car = nice.Object().String('title');

    city.title('Oslo');

    expect(city.title()).to.equal('Oslo');
    expect(car.title()).to.equal('');
  });


  it("create", function() {
    var city = nice.Object().String('title').Number('population');
    city({title: "Oslo", population: "500"});
    expect(city.title()).to.equal('Oslo');
    expect(city.population()).to.equal(500);
  });


  it("Value", function() {
    var city = nice.Object();
    expect(city.Item('price')).to.equal(city);
    city({price: "50$"});
    expect(city.price()).to.equal('50$');
    city({price: 50});
    expect(city.price()).to.equal(50);
  });


  it("listen property when all changed", function() {
    var city = nice.Object().String('title').Number('population');
    var spy = chai.spy();

    city.title.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with('');
    city({title: "Oslo", population: 500});

    expect(spy).to.have.been.called.twice().with('Oslo');
    expect(city.title()).to.equal('Oslo');
  });


  it("listen property when property changed", function() {
    var city = nice.Object().String('title').Number('population');
    var spy = chai.spy();

    city.title.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with('');
    city.title("Oslo").population(500);

    expect(spy).to.have.been.called.twice().with('Oslo');
    expect(city.title()).to.equal('Oslo');
  });


  it("Method", function() {
    var spy = chai.spy();
    var city = nice.Object().Method('go', function(a){spy(a, this);});
    city.go(3);
    expect(spy).to.have.been.called.once().with(3, city);
  });


  it("child's by", function() {
    var city = nice.Object().String('title', function(z){
      expect(city).to.equal(this);
      z('Rome');
    });
    var spy = chai.spy();

    city.title.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with('Rome');
  });


  it("child's use", function(done) {
    var a = nice.String().by(z => {
      setTimeout(() => z('Rome'), 1);
    });
    var city = nice.Object().String('title', function(z){
      z(z.use(a)());
    });

    city.listenBy(z => {
      expect(z.title()).to.equal('Rome');
      done();
    });
  });


  it("child's by should unresolve container", function() {
    var city = nice.Object()
      .String('title', z => z('Rome'))
      .Number('size', z => z(50))
      .Number('height')
      .by(z => z.height(20));
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ title: 'Rome', size: 50, height: 20 });
  });


  it("child's child's by should unresolve container", function() {
    var city = nice.Object()
      .Object('mayor', z => z.Number('age', z => z(50)))
      .Number('height')
      .by(z => z.height(20));
    var spy = chai.spy();

    city.listenBy(c => spy(c()));
    expect(spy).to.have.been.called.once().with({ mayor: { age: 50}, height: 20 });
  });


  it("pending", function(){
    var city = nice.Object()
      .String('name')
      .Number('size');
    var spy = chai.spy();

    city.name('Rome').pending().listenBy(c => spy(c()));
    expect(spy).not.to.have.been.called();
    city.size(6).resolve();
    expect(spy).to.have.been.called.once.with({ name: 'Rome', size: 6 });
  });


  it("child's pending", function(){
    var city = nice.Object()
      .String('name')
      .Number('size');
    var spy = chai.spy();
    city.name.pending();
    city.listenBy(c => spy(c()));

    expect(spy).not.to.have.been.called();
    city.name('Rome');
    expect(spy).to.have.been.called.once.with({ name: 'Rome' });
  });


  it("fill from", function() {
    var capital = nice.Object()
      .String('country')
      .String('name')
      .Number('size');
    var city = nice.Object()
      .String('name')
      .Number('size');
    var spy = chai.spy();

    city.pending().listenBy(c => spy(c()));

    capital.name('Oslo').country('Norway').size(5);

    expect(() => city.fillFrom(capital)).not.to.throw();
    expect(spy).to.have.been.called.once().with({ name: 'Oslo', size: 5 });
  });


  it("clear", function(done){
    var city = nice.Object()
      .String('name')
      .Number('size');
    city.name('Oslo').size(5).pending();
    city.listenBy(z => {
      expect(z.name()).to.equal("");
      expect(z.size()).to.equal(0);
      done();
    });
    city.clear();
  });


  it("dont save default value", function(){
    var n = nice.Object().String('name');

    expect(n._result).to.equal(undefined);
    expect(n()).to.deep.equal({});

    n.name('Qwe');
    expect(n._result).to.deep.equal({name:'Qwe'});
    expect(n()).to.deep.equal({name:'Qwe'});
  });


  it("objectComparer", function(){
    var oldO = {qwe: 1};
    var newO = {asd: 2};
    var add = chai.spy();
    var del = chai.spy();

    nice.objectComparer(oldO, newO, add, del);
    expect(del).to.have.been.called.once.with(1, 'qwe');
    expect(add).to.have.been.called.once.with(2, 'asd');
  });

  //TODO:
//  it("timeout", function(done){
//    var a = nice.Object().timeout(1);
//
//    a.listenBy(() => {}, e => {
//      expect(a.error().message).to.equal('Timeout');
//      done();
//    });
//  });
});
