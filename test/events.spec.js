const nice = require('../index.js')();
const chai = require('chai');
chai.use(require('chai-spies'));
const expect = require('chai').expect;

describe("Events", function() {
  const newEmmiter = () => nice.eventEmitter({});

  it("add listener", function() {
    const f = () => {};
    const spy = chai.spy();
    const item = newEmmiter()._on('newListener', spy)._on('fiesta', f);
    expect(item.listeners('fiesta')).to.deep.equal([f]);
    expect(spy).to.have.been.called.with('fiesta', f);
  });


  it("remove listener", function() {
    const f = () => {};
    const spy = chai.spy();
    const item = newEmmiter()._on('removeListener', spy)._on('fiesta', f);

    expect(item.listeners('fiesta')).to.deep.equal([f]);
    expect(item.listenerCount('fiesta')).to.equal(1);

    item.removeListener('fiesta', f);
    expect(item.listeners('fiesta')).to.deep.equal([]);
    expect(spy).to.have.been.called.with('fiesta', f);
    expect(item.listenerCount('fiesta')).to.equal(0);
  });


  it("removeAll listener", function() {
    const f = () => {};
    const spy = chai.spy();
    const item = newEmmiter()._on('removeListener', spy)._on('fiesta', f);

    expect(item.listeners('fiesta')).to.deep.equal([f]);

    item.removeAllListeners('fiesta');
    expect(item._listeners['fiesta']).to.deep.equal([]);
    expect(spy).to.have.been.called.with('fiesta', f);
  });


  it("double add listener", function() {
    const f = () => {};
    const item = newEmmiter()._on('fiesta', f)._on('fiesta', f);
    expect(item.listeners('fiesta')).to.deep.equal([f]);
  });


  it("emit", function() {
    const spy = chai.spy();
    const item = newEmmiter()._on('fiesta', spy);
    item.emit('fiesta', 'today');

    expect(spy).to.have.been.called.with('today');
  });


  it("emitAndSave", function() {
    const spy = chai.spy();
    const item = newEmmiter();
    item.emitAndSave('fiesta', 'today');
    item._on('fiesta', spy);

    expect(spy).to.have.been.called.with('today');
  });


  it("inheritance", function() {
    const spy1 = chai.spy();
    const spy2 = chai.spy();
    const a = nice.eventEmitter({});
    const b = Object.setPrototypeOf({}, a);

    a._on('fiesta', function(e) { spy1(this, e); } );
    b._on('fiesta', spy2);
    b.emit('fiesta', 'today');

    expect(a.listenerCount('fiesta')).to.equal(1);
    expect(b._listeners['fiesta'].length).to.equal(1);
    expect(spy1).to.have.been.called.with(b, 'today');
    expect(spy2).to.have.been.called.with('today');
  });
});
