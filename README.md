NiceScript
=========

Set of JavaScript functions that provide following features without compilation 
or configuration:

* [Reactive state management](./doc/boxes.md)
* [Type System](./doc/types.md)
* [HTML and CSS](./doc/html.md)
* [Unit tests](./doc/tests.md)
* Utility functions and control structues


You can use any of them independently or as a whole in any JS project. 


## Rationale
Create web applications with 
* less code overall
* much less imperative code
* only JS syntax (less build code)

NiceScript encourage use of component approach, functional programming, and unit tests.
But doesn't force you to do so. 

## Example application: To Do list

Here you can search, add, and remove tasks. 
Notice how little imperative code does it have.


```javascript
const { Box, RBox, Div, Input, wrapMatches } = nice;

const tasks = Box(['Feed the fish', 'Buy milk', 'Walk the dog']);

const taskView = t => Div()
  .A(() => tasks.removeValue(t), 'x').float('right').textDecoration('none').up
  .add(wrapMatches(t, input.boxValue()))
  .margin('1em 0').padding('.5em').borderRadius('.3em').backgroundColor('#DEF');

const input = Input().padding('.5em').width('100%').boxSizing('border-box')
  .on('keyup', e => e.key === 'Enter' 
      && (tasks.push(e.target.value), e.target.value = ''));
  
const list = RBox(tasks, input.boxValue, (tt, s) => 
  Div(tt.filter(t => t.toLowerCase().includes(s.toLowerCase())), taskView));
  
Div(input, list).font('1.2rem Arial').show();
```
[JS Bin](https://jsbin.com/gajowevuvo/edit?html,output) |
[Detailed explanation](./doc/todo_example.md)







<!--
More examples:

* [Ball game](./examples/ball.html) ( [JS Bin](https://jsbin.com/wimayanovu/1/edit?html,output) )
* [Todo list](./examples/todo.html) ( [JS Bin](https://jsbin.com/yetufekopi/1/edit?html,output) )
* [Tic Tac Toe](./examples/tictactoe.html) 
  ( [JS Bin](https://jsbin.com/yozupufaci/edit?html,output) )
  ( [Tutorial](https://medium.com/@sergey.kashulin/creating-web-applications-with-nicescript-338184d18331) )
-->

## Install
Node.js:

`npm install nicescript`

use:

`const nice = require('nicescript')();`

&nbsp;

Browser:
<!--//TODO: check sourse-->
`<script src="https://unpkg.com/nicescript/nice.js"></script>`

or

`<script src="https://cdn.jsdelivr.net/npm/nicescript/nice.js"></script>`
