 var nice = require('../index.js')();
 var Div = nice.Div;
 var expect = require('chai').expect;

 describe("Tags", function() {

  it("Div Span", function() {
    var div = nice.Span('qwe');
    expect(div.html).to.equal('<span>qwe</span>');
  });

  it("Div B", function() {
    var div = nice.B('qwe');
    expect(div.html).to.equal('<b>qwe</b>');
  });

  it("Div I", function() {
    var div = nice.I('qwe');
    expect(div.html).to.equal('<i>qwe</i>');
  });

  it("Div A", function() {
    var div = nice.A('/qwe').add('click');
    expect(div.html).to.equal('<a href="/qwe">click</a>');
  });

  it("Div Img", function() {
    var div = nice.Img('qwe.jpg');
    expect(div.html).to.equal('<img src="qwe.jpg"></img>');
  });

  it("Div Img", function() {
    var div = nice.Img('qwe.jpg');
    expect(div.html).to.equal('<img src="qwe.jpg"></img>');
  });

  it("Checkbox", function() {
    var c = nice.Checkbox(true);
//    var c = nice.Input('checkbox').checked(true);
    expect(c.html).to.equal('<input type="checkbox" checked="true"></input>');
    expect(c.checked()).to.equal(true);
  });

  it("Textarea", function() {
    var t = nice.Textarea('qwe');
    expect(t.html).to.equal('<textarea>qwe</textarea>');
    t.value('asd');
    expect(t.html).to.equal('<textarea>asd</textarea>');
  });
});
