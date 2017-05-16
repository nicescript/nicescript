var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("error", function() {

  it("direct call with handler", function(){
    var spy = chai.spy();
    var errorSpy = chai.spy();
    var item = nice.item().pending().listenBy(spy, errorSpy);
    item.error('zxc');

    expect(errorSpy).to.have.been.called();
    expect(spy).not.to.have.been.called();
    expect(item.error().message).to.equal('zxc');
  });


  it("accidental error with handler", function(done){
    var spy = chai.spy();
    var errorSpy = chai.spy();
    var item = nice.item().by(z => qwe.asd()).listenBy(spy, errorSpy);

    setTimeout(() => {
      expect(errorSpy).to.have.been.called();
      expect(spy).not.to.have.been.called();
      expect(item.error().message.length > 1).to.equal(true);
      done();
    }, 1);
  });


  it("cancel subscription", function(done){
    var spy = chai.spy();
    var errorSpy = chai.spy();
    var item = nice.item().by(z => qwe.asd());

    var subscription = nice.subscription(item, spy).onError(errorSpy);
    subscription.cancel();

    setTimeout(() => {
      expect(errorSpy).not.to.have.been.called();
      expect(spy).not.to.have.been.called();
      done();
    }, 1);
  });


  it("subscribe to item with error", function(done){
    var spy = chai.spy();
    var errorSpy = chai.spy();
    var item = nice.item();

    item.error('qwe');
    item.listenBy(spy, errorSpy);

    setTimeout(() => {
      expect(spy).not.to.have.been.called();
      expect(errorSpy).to.have.been.called();
      done();
    }, 1);
  });


  it("use", function(){
    var a = nice().pending();
    var spy1 = chai.spy();
    var spy2 = chai.spy();
    var b = nice().by(z => {
      spy1();
      z.use(a);
      spy2();
      b(5);
    });
    expect(() => a.error('qwe')).not.to.throw();
    expect(a.error().message).to.equal('qwe');
    b();
    expect(b.error().message.length > 1).to.equal(true);
    expect(b()).to.equal(undefined);
    expect(spy1).to.have.been.called.once();
    expect(spy2).to.not.have.been.called();
  });


  it("try", function(done){
    var a = nice().pending();
    var spy = chai.spy();
    var b = nice().by(z => {
      z.try(a);
      spy();
      z(a.error() ? 7 : (a() + 5));
    });

    b.listenBy(() => {
      expect(a.error().message).to.equal('qwe');
      expect(b.error()).to.equal(undefined);
      expect(b()).to.equal(7);
      expect(spy).to.have.been.called.once();
      done();
    });
    a.error('qwe');
  });


  it("try listen after error", function(){
    var a = nice().pending();
    var b = nice().by(z => {
      z.try(a);
      spy2();
      z(a.error() ? 7 : (a() + 5));
    });
    var spy = chai.spy();
    var spy2 = chai.spy();
    var errorSpy = chai.spy();
    expect(() => a.error('qwe')).not.to.throw();

    b.listenBy(spy, errorSpy);
    expect(a.error().message).to.equal('qwe');
    expect(b.error()).to.equal(undefined);
    expect(b()).to.equal(7);
    expect(spy).to.have.been.called.once();
    expect(spy2).to.have.been.called.once();
    expect(errorSpy).not.to.have.been.called();
  });


  it("tryOnce", function(done){
    var a = nice().by(z => z.error('qwe'));
    var spy = chai.spy();
    var b = nice().by(z => {
      z.tryOnce(a);
      spy();
      z(a.error() ? 7 : (a() + 5));
    });

    b.listenBy(() => {
      expect(a.error().message).to.equal('qwe');
      expect(b.error()).to.equal(undefined);
      expect(b()).to.equal(7);
      expect(spy).to.have.been.called.once();
      done();
    });
  });


  it("format", function(done){
    var a = nice().pending();
    var b = nice().by(z => {
      z.use(a);
    });
    var spy = chai.spy();

    b.listenBy(spy, error => {
      expect(a.error().message).to.equal('qwe');
      expect(error.message).to.equal('qwe');
      done();
    });
    a.error('qwe');
  });


  it("setting value voids error", function(){
    var a = nice();
    a.error('qwe');
    expect(a.error().message).to.equal('qwe');
    a(5);
    expect(a.error()).to.equal(undefined);
    expect(a()).to.equal(5);
  });


  it("voids error", function(){
    var a = nice.Object().Number('size');
    var spy = chai.spy();
    a.error('qwe');
    a.listenBy(() => {
      spy();
    });
    expect(a.error().message).to.equal('qwe');
    a.error(null).size(5);
    expect(a.error()).to.equal(undefined);
    expect(a.size()).to.equal(5);
  });

  it('propagate to container', () => {
    var city = nice.Object().String('title');
    city.title.error('qwe');
    expect(city.error().message).to.equal('qwe');
  });
});
