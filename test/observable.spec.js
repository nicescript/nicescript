//let nice = require('../index.js')();
//let chai = require('chai');
//chai.use(require('chai-spies'));
//let expect = chai.expect;
//const { Num, Obj, Arr, is, Box, RBox } = nice;
//
//describe("Observable", function() {
//
//  it("listen single", function(){
//    let n = Num(1);
//    let res;
//
//    n.listen(v => res = v());
//
//    expect(res).to.equal(1);
//    n(2);
//
//    expect(res).to.equal(2);
//  });
//
//  it("listenChanges single", function(){
//    let n = Num(1);
//    let res;
//
//    n.listenChanges(v => res = v());
//
//    expect(res).to.equal(undefined);
//    n(2);
//
//    expect(res).to.equal(2);
//  });
//
//
//  it("listen object", function(){
//    let n = Obj();
//    let res;
//
//    n.listen(v => res = v.get('q'));
//
//    n.set('q', 2);
//
//    expect(res).to.equal(2);
//  });
//
//
//  it("listen onAdd", function(){
//    const a = nice(1), b = nice(2);
//    let o = Obj();
//    const spy = chai.spy();
//
//    o.set('a', a);
//    o.listen({ onAdd: spy});
//    expect(spy).to.have.been.called.with(a, 'a');
//    o.set('b', b);
//    expect(spy).to.have.been.called.with(b, 'b');
//    o.set('b', a);
//    expect(spy).to.have.been.called.with(a, 'b');
//  });
//
//
//  it("listen onRemove", function(){
//    const a = nice(1), b = nice(2);
//    let o = Obj();
//    const spy = chai.spy();
//
//    o.set('a', a);
//    o.listen({ onRemove: spy});
//    expect(spy).to.not.have.been.called();
//    o.set('a', b);
//    expect(spy).to.have.been.called.with(a, 'a');
//  });
//
//
//  it("Obj onChange", function() {
//    const o = Obj({'qwe': 2});
//    const spy = chai.spy();
//    o.listen({onChange: spy});
//
//    o.set('qwe', 2);
//    o.set('qwe', 3);
//    o.remove('qwe');
//
//    expect(spy).to.have.been.called.with('qwe', 2);
//    expect(spy).to.have.been.called.with('qwe', undefined, 3);
//  });
//
//
//  it("Arr onChange", function() {
//    const o = Arr(1, 2);
//    const spy = chai.spy();
//    o.listen({onChange:(...a) => {
////        console.log(a);
//        spy(...a);
//    }});
//
//    o.set(0, 2);
//    o.insertAt(1, 3);
//
//    expect(spy).to.have.been.called.with(0, 2, 1);
//    expect(spy).to.have.been.called.with(1, 3);
//  });
//
//
//  it("listen old value", function(){
//    let a = Num();
//    let res;
//    a.listen((v, old) => res = old);
//    expect(res).to.equal(undefined);
//
//    a(6);
//    expect(res).to.equal(0);
//    a(7);
//    expect(res).to.equal(6);
//  });
//
//
//  it("listen old value on object", function(){
//    let a = Obj();
//    let res;
//    a.listen((v, old) => res = old);
//    expect(res).to.equal(undefined);
//
//    a.set('q', 6);
//    expect(res).to.deep.equal({q:undefined});
//    a.set('q', 7);
//    expect(res.q).to.equal(6);
//  });
//
//
//  it("RBox", function(){
//    const n = Num();
//    const n2 = RBox(n, x => x() * 2);
//    let res;
//    n2.listen(v => res = v);
//    expect(res).to.equal(0);
//    n(4);
//    expect(res).to.equal(8);
//  });
//
////  it("listenItem", function(){
////    const a = Obj();
////    const n = Num();
////    let res;
////    a.listenItem('q', (v, old) => res = old);
////    expect(res).to.equal(undefined);
////
////    a.set('q', n);
////    expect(res).to.deep.equal({q:undefined});
////    a.set('q', 7);
////    expect(res.q()).to.equal(6);
////  });
//
//
////  it("listen diff on child", function(){
////    let a = Obj();
////    const q = a.get('q');
////    const f = v => res = v();
////    let res;
////
////    expect(!!a._isHot()).to.equal(false);
////    expect(!!q._isHot()).to.equal(false);
////    q.listen(f);
////    expect(!!a._isHot()).to.equal(true);
////    expect(!!q._isHot()).to.equal(true);
////
////    expect(res).to.equal(undefined);
////
////    a.set('q', 6);
////    expect(res).to.equal(6);
////    a.set('q', 7);
////    expect(res).to.equal(7);
////
////    q.unsubscribe(f);
////    expect(!!a._isHot()).to.equal(false);
////    expect(!!q._isHot()).to.equal(false);
////  });
//
//
//  it("listen 2 targets", function(){
//    let a = Num();
//    let spy1 = chai.spy();
//    let spy2 = chai.spy();
//    a.listen(v => spy1(v()));
//    a.listen(v => spy2(v()));
//    expect(spy1).to.have.been.called.once.with(0);
//    expect(spy2).to.have.been.called.once.with(0);
//
//    a(6);
//    expect(spy1).to.have.been.called.with(6);
//    expect(spy2).to.have.been.called.with(6);
//    expect(a()).to.equal(6);
//  });
//
//
////  it("listenOnce on resolved", function(){
////    let a = Box(1);
////    let spy = chai.spy();
////    a.listenOnce(v => spy(v));
////    expect(spy).to.have.been.called.once();
////    a(6);
////    expect(spy).to.have.been.called.once.with(1);
////    expect(a()).to.equal(6);
////  });
////
////
////  it("listenOnce", function(){
////    let a = Box();
////    let spy = chai.spy();
////    a.listenOnce(v => spy(v));
////    expect(spy).to.not.have.been.called();
////    a(5);
////    expect(spy).to.have.been.called.once();
////    a(6);
////    expect(spy).to.have.been.called.once.with(5);
////    expect(a()).to.equal(6);
////  });
//
//
//  it("unsubscribe", function(){
//    let spy = chai.spy();
//    let a = nice(5);
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
//  it("listenChildren", function(){
//    let spy = chai.spy();
//    let a = nice.Obj();
//    a.listenChildren(spy);
//
//    expect(spy).not.to.have.been.called();
//
//    a.set('qwe', 1);
//    expect(spy).to.have.been.called.with(1, ['qwe']);
//
//    const num = Num(2);
//    a.set('qwe', num);
//    expect(spy).to.have.been.called.with(num, ['qwe']);
//    num(3);
//    expect(spy).to.have.been.called.with(num, ['qwe']);
//
//    a.set('asd', Obj());
//    a.get('asd').set('zxc', 2);
//    expect(spy).to.have.been.called.with(2, ['asd', 'zxc']);
//  });
//
////  it("unsubscribe chain", function(){
////    let spy = chai.spy();
////    let a = Box();
////    let b = Box.use(a);
////    let c = Box.use(b);
////    expect(a._subscribers.length).to.equal(0);
////    c.listen(spy);
////    expect(b._subscribers.length).to.equal(1);
////    expect(a._subscribers.length).to.equal(1);
////    a(1);
////    c.unsubscribe(spy);
////    expect(b._subscribers.length).to.equal(0);
////    expect(a._subscribers.length).to.equal(0);
////    a(2);
////  });
////
////
////  it("transaction", function(){
////    let a = Box();
////    let spy = chai.spy();
////    a.listen(spy);
////
////    a.transaction(() => a(5)(6));
////
////    expect(spy).to.have.been.called.once();
////    expect(a()).to.equal(6);
////  });
////
////
////  it("transactionRollback", function(){
////    let a = Box(4);
////    let spy = chai.spy();
////    a.listen(spy);
////
////    a.transactionStart();
////    a(5);
////    expect(a()).to.equal(5);
////    a.transactionRollback();
////
////    expect(spy).to.have.been.called.once();
////    expect(a()).to.equal(4);
////  });
////
////
////  it("lock", function(){
////    let a = Box(5);
////
////    a.lock();
////    expect(() => a(6)).to.throw();
////    expect(a()).to.equal(5);
////
////    a.unlock();
////    expect(() => a(7)).not.to.throw();
////    expect(a()).to.equal(7);
////  });
////
////
////  it("inputs", function(){
////    let square = Box()
////      .num('x', 5)
////      .num('y')
////      .by((x, y) => x * y);
////
////    let res;
////    square.listen(v => res = v);
////
////    expect(res).to.equal(undefined);
////
////    square.y(5);
////    expect(res).to.equal(25);
////    square.x(10).y(2);
////    expect(square.x()).to.equal(10);
////    expect(res).to.equal(20);
////  });
////
////
////  it("follow Box input", function(){
////    let square = Box()
////      .num('x', 5)
////      .num('y', 5)
////      .by((x, y) => x * y);
////
////    let a = Box(2);
////    let b = Box(0);
////    let res;
////    square.listen(v => res = v);
////
////    expect(res).to.equal(25);
////    square.x.follow(a);
////    expect(res).to.equal(10);
////    a(3);
////    expect(res).to.equal(15);
////
////    square.x.follow(b);
////    expect(res).to.equal(0);
////    a(4);
////    expect(res).to.equal(0);
////  });
////
////
////  it("named input chain", function(){
////    let b = Box();
////    let b2 = Box.use(b).by(n => n * 2);
////
////    let square = Box()
////      .num('x', 5)
////      .by(x => x * x);
////
////    square.x(b2);
////
////    b(3);
////
////    expect(square()).to.equal(36);
////  });
////
////
////
//////  it("values's transformation", function(){
//////    let a = Box(2);
//////    let b = a.pow(2);
//////
//////    expect(b._type).to.equal(Box);
//////    expect(b()()).to.equal(4);
//////
//////    a(3);
//////    expect(b()()).to.equal(9);
//////  });
//////
//////
//////  it("values's action", function(){
//////    let a = Box(nice(2));
//////
//////    expect(a.negate()).to.equal(a);
//////    expect(a()()).to.equal(-2);
//////  });
////
////
////  it("single time", function(){
////    let f = z => { spy(); return 15; };
////    let spy = chai.spy();
////    let v = RBox(f);
////
////    expect(v()).to.equal(15);
////    expect(spy).to.have.been.called.once();
////  });
////
////
////  it("use", function(){
////    let spy = chai.spy();
////    let a = Box();
////    let a2 = Box.use(a).by(a => a * 2);
////
////    a2.listen(spy);
////    expect(spy).not.to.have.been.called();
////    a(5);
////    expect(spy).to.have.been.called.once.with(10);
////    expect(a2()).to.equal(10);
////  });
////
////
////  it("follow Promise", function(done){
////    let p = new Promise((resolve, reject) => resolve(3));
////    let b = Box.follow(p);
////    b.listen(v => {
////      expect(v).to.equal(3);
////      expect(b()).to.equal(3);
////      done();
////    });
////  });
////
////
////  it("get Promise", function(done){
////    let b = Box();
////    let p = b.getPromise();
////
////    p.then(v => {
////      expect(v).to.equal(3);
////      done();
////    });
////
////    b(3);
////  });
////
////
////  it("Promise input", done => {
////    let p = new Promise((resolve, reject) => resolve(3));
////    let b = Box.use(p).by( v => v * 2 );
////    b.listen(v => {
////      expect(v).to.equal(6);
////      expect(b()).to.equal(6);
////      done();
////    });
////  });
////
//});
