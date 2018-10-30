 const nice = require('../index.js')();
 const Div = nice.Div;
 const expect = require('chai').expect;

 describe("Tags", function() {

  it("Div Span", function() {
    const div = nice.Span('qwe');
    expect(div.html).to.equal('<span>qwe</span>');
  });

  it("Div B", function() {
    const div = nice.B('qwe');
    expect(div.html).to.equal('<b>qwe</b>');
  });

  it("Div I", function() {
    const div = nice.I('qwe');
    expect(div.html).to.equal('<i>qwe</i>');
  });

  it("Div A", function() {
    const div = nice.A('/qwe').add('click');
    expect(div.html).to.equal('<a href="/qwe">click</a>');
  });

  it("Div Img", function() {
    const div = nice.Img('qwe.jpg');
    expect(div.html).to.equal('<img src="qwe.jpg"></img>');
  });

  it("Div Img", function() {
    const div = nice.Img('qwe.jpg');
    expect(div.html).to.equal('<img src="qwe.jpg"></img>');
  });

  it("Checkbox", function() {
    const c = nice.Checkbox(true);
    expect(c.html).to.equal('<input type="checkbox" checked="true"></input>');
    expect(c.checked()).to.equal(true);
  });

  it("Submit", function() {
    const c = nice.Submit('Go');
    expect(c.html).to.equal('<input type="submit" value="Go"></input>');
  });

  it("Button", function() {
    const c = nice.Button('Go');
    expect(c.html).to.equal('<input type="button" value="Go"></input>');
  });

  it("Textarea", function() {
    const t = nice.Textarea('qwe');
    expect(t.html).to.equal('<textarea>qwe</textarea>');
    t.value('asd');
    expect(t.html).to.equal('<textarea>asd</textarea>');
  });
});
