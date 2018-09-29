let nice = require('../index.js')();
let chai = require('chai');
chai.use(require('chai-spies'));
let expect = chai.expect;
const { Box, is, Num, Arr } = nice;

describe("Box", function() {

  it("simple", function(){
    let s = Box();

    expect(is.Box(s)).to.equal(true);
    expect(s().is.Pending()).to.equal(true);

    expect(s(15)).to.equal(s);
    expect(s()).to.equal(15);
  });


  it("default value", function(){
    let s = Box(13);

    expect(is.Box(s)).to.equal(true);
    expect(s()).to.equal(13);
    expect(s(15)).to.equal(s);
    expect(s()).to.equal(15);
  });


  it("listen", function(){
    const a = Box();
    let res;
    a.listen(v => res = v);

    a(6);
    expect(res).to.equal(6);
    expect(a()).to.equal(6);
  });

  it("listen reactive unique", function(){
    const spy = chai.spy();
    const a = Num();
    const b = Box.by(a, n => n / 2 | 0);
    b.listen(spy);
    a(1);
    expect(spy).to.have.been.called.once();
  });


  it("listen old", function(){
    const a = Box();
    let res;
    a.listen((v, old) => res = old);
    expect(res).to.equal(undefined);
    a(6);
    expect(res.is.Pending()).to.equal(true);

    a(7);
    expect(res).to.equal(6);
  });


//  it("listenDiff", function(){
//    let a = Box();
//    let spy = chai.spy();
//    a.listenDiff(v => spy(v));
//    expect(spy).to.not.have.been.called();
//
//    a(6);
//    expect(spy).to.have.been.called.with({ add:6, del:nice.PENDING });
//    a(7);
//    expect(spy).to.have.been.called.with({ add:7, del:6 });
//  });


//  it("listenOnce on resolved", function(){
//    let a = Box(1);
//    let spy = chai.spy();
//    a.listenOnce(v => spy(v));
//    expect(spy).to.have.been.called.once();
//    a(6);
//    expect(spy).to.have.been.called.once.with(1);
//    expect(a()).to.equal(6);
//  });
//
//
//  it("listenOnce", function(){
//    let a = Box();
//    let spy = chai.spy();
//    a.listenOnce(v => spy(v));
//    expect(spy).to.not.have.been.called();
//    a(5);
//    expect(spy).to.have.been.called.once();
//    a(6);
//    expect(spy).to.have.been.called.once.with(5);
//    expect(a()).to.equal(6);
//  });
//
//
//  it("unsubscribe", function(){
//    let spy = chai.spy();
//    let a = Box(5);
//    a.listen(spy);
//
//    expect(spy).to.have.been.called.once();
//
//    a.unsubscribe(spy);
//    a(2);
//    expect(spy).to.have.been.called.once();
//  });
//
//
//  it("unsubscribe chain", function(){
//    let spy = chai.spy();
//    let a = Box();
//    let b = Box.use(a);
//    let c = Box.use(b);
//    expect(a._subscribers.length).to.equal(0);
//    c.listen(spy);
//    expect(b._subscribers.length).to.equal(1);
//    expect(a._subscribers.length).to.equal(1);
//    a(1);
//    c.unsubscribe(spy);
//    expect(b._subscribers.length).to.equal(0);
//    expect(a._subscribers.length).to.equal(0);
//    a(2);
//  });
//
//
//  it("transaction", function(){
//    let a = Box();
//    let spy = chai.spy();
//    a.listen(spy);
//
//    a.transaction(() => a(5)(6));
//
//    expect(spy).to.have.been.called.once();
//    expect(a()).to.equal(6);
//  });
//
//
//  it("transactionRollback", function(){
//    let a = Box(4);
//    let spy = chai.spy();
//    a.listen(spy);
//
//    a.transactionStart();
//    a(5);
//    expect(a()).to.equal(5);
//    a.transactionRollback();
//
//    expect(spy).to.have.been.called.once();
//    expect(a()).to.equal(4);
//  });
//
//
//  it("lock", function(){
//    let a = Box(5);
//
//    a.lock();
//    expect(() => a(6)).to.throw();
//    expect(a()).to.equal(5);
//
//    a.unlock();
//    expect(() => a(7)).not.to.throw();
//    expect(a()).to.equal(7);
//  });
//
//
//  it("inputs", function(){
//    let square = Box()
//      .num('x', 5)
//      .num('y')
//      .by((x, y) => x * y);
//
//    let res;
//    square.listen(v => res = v);
//
//    expect(res).to.equal(undefined);
//
//    square.y(5);
//    expect(res).to.equal(25);
//    square.x(10).y(2);
//    expect(square.x()).to.equal(10);
//    expect(res).to.equal(20);
//  });
//
//
//  it("follow Box input", function(){
//    let square = Box()
//      .num('x', 5)
//      .num('y', 5)
//      .by((x, y) => x * y);
//
//    let a = Box(2);
//    let b = Box(0);
//    let res;
//    square.listen(v => res = v);
//
//    expect(res).to.equal(25);
//    square.x.follow(a);
//    expect(res).to.equal(10);
//    a(3);
//    expect(res).to.equal(15);
//
//    square.x.follow(b);
//    expect(res).to.equal(0);
//    a(4);
//    expect(res).to.equal(0);
//  });
//
//
//  it("named input chain", function(){
//    let b = Box();
//    let b2 = Box.use(b).by(n => n * 2);
//
//    let square = Box()
//      .num('x', 5)
//      .by(x => x * x);
//
//    square.x(b2);
//
//    b(3);
//
//    expect(square()).to.equal(36);
//  });
//
//
  it("resolve children 1", function(done){
    nice.resolveChildren(Arr(1, 2), function (v) {
      expect(v.json).to.deep.equal([1, 2]);
      done();
    });
  });


  it("resolve children 2", function(done){
    let a = Box.by(() => 2);

    nice.resolveChildren(Arr(1, a), function (v) {
      expect(v.json).to.deep.equal([1, 2]);
      done();
    });
  });

  it("resolve children 3", function(done){
    let a = Box(2);
    let b = Box.async(z => setTimeout(() => z(Arr(3, 4)), 1));
    let c = Box.async(z => setTimeout(() => z(4), 1));

    nice.resolveChildren(Arr(1, a, b), function (v) {
      const j = v.json;
      expect(j).to.deep.equal([1, 2, [3, 4]]);
      done();
    });
  });


  it("resolve children 4", function(done){
    nice.resolveChildren({}, function (v) {
      expect(v).to.deep.equal({});
      done();
    });
  });


////  it("values's transformation", function(){
////    let a = Box(2);
////    let b = a.pow(2);
////
////    expect(b._type).to.equal(Box);
////    expect(b()()).to.equal(4);
////
////    a(3);
////    expect(b()()).to.equal(9);
////  });
////
////
////  it("values's action", function(){
////    let a = Box(nice(2));
////
////    expect(a.negate()).to.equal(a);
////    expect(a()()).to.equal(-2);
////  });
//
//
//  it("single time", function(){
//    let f = z => { spy(); return 15; };
//    let spy = chai.spy();
//    let v = Box.by(f);
//
//    expect(v()).to.equal(15);
//    expect(spy).to.have.been.called.once();
//  });
//
//
//  it("use", function(){
//    let spy = chai.spy();
//    let a = Box();
//    let a2 = Box.use(a).by(a => a * 2);
//
//    a2.listen(spy);
//    expect(spy).not.to.have.been.called();
//    a(5);
//    expect(spy).to.have.been.called.once.with(10);
//    expect(a2()).to.equal(10);
//  });
//
//
  it("async", function(done){
    Box
      .async(z => z.timeout(() => z(5), 1))
      .listen(v => {
        expect(v).to.equal(5);
        done();
      });
  });
//
//
//  it("basic sync chain", function(){
//    let a = Box(9);
//    let a2 = Box.use(a).by( v => v * 2 );
//    let spy = chai.spy();
//    a2.listen(spy);
//    expect(spy).to.have.been.called.once().with(18);
//    expect(a2()).to.equal(18);
//  });
//
//
//  it("follow Promise", function(done){
//    let p = new Promise((resolve, reject) => resolve(3));
//    let b = Box.follow(p);
//    b.listen(v => {
//      expect(v).to.equal(3);
//      expect(b()).to.equal(3);
//      done();
//    });
//  });
//
//
//  it("get Promise", function(done){
//    let b = Box();
//    let p = b.getPromise();
//
//    p.then(v => {
//      expect(v).to.equal(3);
//      done();
//    });
//
//    b(3);
//  });
//
//
//  it("Promise input", done => {
//    let p = new Promise((resolve, reject) => resolve(3));
//    let b = Box.use(p).by( v => v * 2 );
//    b.listen(v => {
//      expect(v).to.equal(6);
//      expect(b()).to.equal(6);
//      done();
//    });
//  });
//
//
////  it("states property", () => {
////    const T = nice.Type().num('age')();
////    const a = T().age(10);
////    const box = Box(a);
////
////    expect(box.age()).to.equal(10);
////    expect(box.age(20)).to.equal(box);
////    expect(box.age()).to.equal(20);
////  });
});
