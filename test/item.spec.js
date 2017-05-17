var nice = require('../index.js')();
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;

describe("Item", function() {

  it("set/get", function(){
    var v = nice.item();
    v(2);
    expect(v()).to.equal(2);
    expect(v.is(2)).to.equal(true);
    expect(v.isAnyOf(2,3,5)).to.equal(true);
    expect(v.isAnyOf(1,3,5)).to.equal(false);
  });


  it("sync by", function(done){
    var v = nice.item().by(z => z(4));
    v.listenBy(() => {
      expect(v()).to.equal(4);
      done();
    });
  });


  it("listen item", function(){
    var a = nice.item();
    var spy = chai.spy();
    a.listenBy(spy);

    a(5);
    expect(spy).to.have.been.called.with(a);
    expect(a()).to.equal(5);
  });


  it("pending", function(){
    var a = nice.item();
    var spy = chai.spy();
    a(5).pending().listenBy(spy);
    expect(spy).not.to.have.been.called();
    a(5);
    expect(spy).to.have.been.called.once.with(a);
    expect(a()).to.equal(5);
  });


  it("setting same value shuld resolve item", function(){
    var a = nice.item();
    var spy = chai.spy();
    a(9).pending().listenBy(spy);
    expect(spy).not.to.have.been.called();
    a(9);
    expect(spy).to.have.been.called.once.with(a);
    expect(a()).to.equal(9);
  });


  it("cancel subscription", function(done){
    var spy = chai.spy();
    var item = nice.item();
    var subscription = nice.subscription(item, spy);
    subscription.cancel()
    subscription.resolve();

    item(5);
    setTimeout(() => {
      expect(spy).not.to.have.been.called();
      done();
    }, 1);
  });


  it("transaction", function(){
    var a = nice.item();
    var spy = chai.spy();
    a.listenBy(spy);

    a.transactionStart();
    a(5);
    expect(spy).to.have.been.called.once();
    expect(a()).to.equal(5);
    a.transactionRollback();

    expect(spy).to.have.been.called.once();
    expect(a()).to.equal(undefined);
  });


  it("by should use transaction", function(){
    var a = nice.item();
    var spy = chai.spy();
    a.by(z => {z(1);z(2);}).listenBy(z => spy(z()));

    expect(spy).not.to.have.been.called.with(1);
    expect(spy).to.have.been.called.with(2);
    expect(spy).to.have.been.called.once();
  });


  it("source", function(done){
    nice(f => setTimeout(() => f(5), 1))
      .listenBy(item => {
        expect(item()).to.equal(5);
        done();
      });
  });


  it("basic sync chain", function(){
    var a = nice.item();
    var a2 = nice.item().by(z => z(a() * 2) );
    var spy = chai.spy();
    a(9);
    a2.listenBy(spy);
    expect(spy).to.have.been.called.once().with(a2);
    expect(a2()).to.equal(18);
  });


  it("basic async source", function(done){
    var a = nice.Number().by(z => setTimeout(() => z(7), 1));
    var sum = nice().by(z => z(z.use(a)() * 3));

    sum.listenBy(sum => {
      expect(sum()).to.equal(21);
      done();
    });
  });


  it("basic async chain", function(){
    var a = nice.item();
    var sum = nice.item().by(z => z(z.use(a)() * 5));
    var spy = chai.spy();

    sum.listenBy(spy);
    a(7);
    expect(spy).to.have.been.called.with(sum);
    expect(sum()).to.equal(35);
  });


  it("double async chain", function(done){
    var a = nice(f => setTimeout(() => f(7), 0));
    var b = nice.item();
    var sum = nice.item().by(z => z(z.use(a)() + z.use(b)()));

    sum.listenBy(sum => {
      expect(sum()).to.equal(15);
      done();
    });
    b(8);
  });


  it("timeout", function(done){
    var a = nice.item().by(()=>{}).timeout(1);

    a.listenBy(() => {}, e => {
      expect(a.error().message).to.equal('Timeout');
      done();
    });
  });


  it("use", function(){
    var spy = chai.spy();
    var a = nice.Number();
    var b = nice().by(z => {
      b(z.use(a)() * 10);
      spy();
    });
    expect(a()).to.equal(0);
    expect(spy).to.not.have.been.called();
    expect(b()).to.equal(0);
    expect(spy).to.have.been.called.once();
    a(5);
    expect(b()).to.equal(50);
    a(6);
    expect(b()).to.equal(60);
  });


  it("delayed use", function(done){
    var a = nice().by(() => setTimeout(() => {
      a(1);
    }, 1));
    var spy = chai.spy();
    var b = nice().by(z => {
      z.use(a);
      spy();
      b(5 + a());
    });
    b.listenBy(() => {
      expect(b()).to.equal(6);
      expect(spy).to.have.been.called.once();
      done();
    });
  });


  it("use chain", function(){
    var a = nice.Number();
    var b = nice().by(z => z(z.use(a)() * 10));
    var c = nice().by(z => z(z.use(b)() + 1));
    expect(c()).to.equal(1);
    a(5);
    expect(c()).to.equal(51);
    a(6);
    expect(c()).to.equal(61);
  });


  it("useOnce", function(){
    var x = nice.Number();
    var b = nice().by(z => b(z.useOnce(x)() * 10));
    expect(b()).to.equal(0);
    x.inc();
    expect(x()).to.equal(1);
    expect(b()).to.equal(0);
  });


  it("useOnce chain", function(){
    var x = nice.Number();
    var a = nice.Number().by(z => z(5 + z.use(x)()));
    var b = nice().by(z => b(z.useOnce(a)() * 10));
    expect(b()).to.equal(50);
    a(6);
    expect(b()).to.equal(50);
    x.inc();
    expect(a()).to.equal(6);
    expect(b()).to.equal(50);
  });


  it("try", function(){
    var spy = chai.spy();
    var a = nice.Number();
    var b = nice().by(z => {
      b(z.try(a)() * 10);
      spy();
    });
    expect(a()).to.equal(0);
    expect(spy).to.not.have.been.called();
    expect(b()).to.equal(0);
    expect(spy).to.have.been.called.once();
    a(5);
    expect(b()).to.equal(50);
    a(6);
    expect(b()).to.equal(60);
  });


  it("try chain", function(done){
    var a = nice().by(() => a(1));
    var spy = chai.spy();
    var b = nice().by(z => {
      z.try(a);
      spy();
      b(5 + a());
    });
    b.listenBy(() => {
      expect(b()).to.equal(6);
      expect(spy).to.have.been.called.once();
      done();
    });
  });


  it("tryOnce", function(done){
    var a = nice().by(z => z(4));
    var spy = chai.spy();
    var b = nice().by(z => {
      z.tryOnce(a);
      spy();
      z(a.error() ? 7 : (a() + 5));
    });

    b.listenBy(() => {
      expect(a.error()).to.equal(undefined);
      expect(b.error()).to.equal(undefined);
      expect(b()).to.equal(9);
      expect(spy).to.have.been.called.once();
      done();
    });
  });




  it("try delayed", function(done){
    var a = nice().by(() => setTimeout(() => a(1), 1));
    var spy = chai.spy();
    var b = nice().by(z => {
      z.try(a);
      spy();
      b(5 + a());
    });
    b.listenBy(() => {
      expect(b()).to.equal(6);
      expect(spy).to.have.been.called.once();
      done();
    });
  });


  it("lock", function(){
    var a = nice.item(5);

    a.lock();
    expect(() => a(6)).to.throw();
    expect(a()).to.equal(5);

    a.unlock();
    expect(() => a(7)).not.to.throw();
    expect(a()).to.equal(7);
  });


  it("direct loop", function(){
    var a = nice.Number();
    var b = nice.Number();

    expect(() => {
      a.by(z => z(b()+1));
      b.by(z => z(a()+1));
    }).not.to.throw();
  });


  it("use loop", function(){
    var a = nice.Number();
    var b = nice.Number();

    expect(() => {
      a.by(z => z(z.use(b)()+1));
      b.by(z => z(z.use(a)()+1));
    }).not.to.throw();
  });


  it("expect bad subscriptions to fail", function(){
    expect(() => {
      nice.item().listenBy();
    }).to.throw();
  });


  it("transaction", function(){
    var spy = chai.spy();
    var n = nice.Item().listenBy(spy);
    n.transactionStart();
    n(3)(4)(5);
    n.transactionEnd();
    expect(spy).to.have.been.called.twice.with(n);
    expect(n()).to.equal(5);
  });


  it("resetValue", function(){
    var n = nice.Item(5);
    expect(n()).to.equal(5);
    n.resetValue();
    expect(n()).to.equal(undefined);
  });


  it("dont save default value", function(){
    var n = nice.Item();
    n._default = () => 1;
    expect(n._result).to.equal(undefined);
    expect(n()).to.equal(1);
    n(2);
    expect(n._result).to.equal(2);
    expect(n()).to.equal(2);
    n(1);
    expect(n()).to.equal(1);
  });


  it("one way subscription", function(){
    var a = nice.Item();
    var b = nice.Item();
    var spy = chai.spy();
    a.listenBy(b);
    a.listenBy(b);

    expect(a._subscribers).to.equal(undefined);
    expect(b._subscriptions.length).to.equal(1);

    b.listenBy(spy);

    expect(a._subscribers.length).to.equal(1);
    expect(b._subscriptions.length).to.equal(1);
    expect(b._subscribers.length).to.equal(1);

    nice.cancel(spy);

    expect(a._subscribers.length).to.equal(0);
    expect(b._subscriptions.length).to.equal(1);
  });

  it('should not reseive notofication while counting _by()', () => {
    var item = nice.Item();
    expect(() => {
      item.by(z => z.listenBy(console.log));
      item();
    }).not.to.throw();
  });


});
