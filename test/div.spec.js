 var nice = require('../index.js')();
 var Div = nice.Div;
 var expect = require('chai').expect;

 describe("Div", function() {

   it("Div html", function(done) {
     Div().add('qwe').html.listenBy(function (html) {
       expect(html()).to.equal('<div>qwe</div>');
       done();
     });
   });


  it("sync Div", function() {
    var div = Div('li').add('qwe');
    expect(div.html()).to.equal('<li>qwe</li>');
  });


  it("item child", function() {
    var n = nice.Number();
    var n2 = nice.Number();
    var div = Div('ol').add(n, n2);
    n(5);
    n2(7);
    expect(div.html()).to.equal('<ol>57</ol>');
  });


  it("insert Div", function() {
    var div = Div('li');
    var div2 = nice.B('qwe');
    div.add(div2);
    expect(div.html()).to.equal('<li><b>qwe</b></li>');
  });


  it("insert in one line", function() {
    var div = Div('li').add('asd').B('qwe').up;
    expect(div.html()).to.equal('<li>asd<b>qwe</b></li>');
  });


  it("style", function() {
    var div = Div().margin('6px').borderColor('#DEF');
    expect(div.html()).to.equal('<div style="margin:6px;border-color:#DEF"></div>');
   });


  it("style object", function() {
    var div = nice.Div().border({Width: '1px', color:'red'});
    expect(div.html()).to.equal('<div style="border-width:1px;border-color:red"></div>');
  });


  it("Style by", function() {
    var n = nice.Number();
    var div = Div().topBy(z => z(z.use(n)() + 'px')).add('qwe');
    n(6);
    expect(div.html()).to.equal('<div style="top:6px">qwe</div>');
  });


  it("children", function(done) {
     Div()
      .childrenBy(z => {
        return [1, 2];
      })
      .html.listenBy(z => {
        expect(z()).to.equal('<div>12</div>');
        done();
      });
  });


  it("async", function(done) {
    var a = nice().pending();
    Div()
      .by(z => {
        z.add(z.use(a)());
      })
      .listenBy(z => {
        expect(z.html()).to.equal('<div>qwe</div>');
        done();
      });
    a('qwe', 'asd');
  });


  it("async children", function(done) {
    var a = nice.Array().pending();
    Div()
      .childrenBy(z => z.use(a)())
      .html.listenBy(z => {
        expect(z()).to.equal('<div>qweasd</div>');
        done();
      });
    a('qwe', 'asd');
  });


  it("text", function(done) {
    Div().add('asd')
     .B(' zxc2').up
     .listenBy(function (z) {
       expect(z.text()).to.equal('asd zxc2');
       done();
     });
  });


  it("error", function(done) {
    Div().childrenBy(z => [qwe.asd])
     .html.listenBy(function (z) {
       expect(z()).to.contain('ReferenceError: qwe is not defined');
       done();
     });
  });
});