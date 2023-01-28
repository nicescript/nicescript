Example application: To Do list
============


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
[JS Bin](https://jsbin.com/setizekuqu/edit?html,output) TODO: update source

Let's look at it step by step:
```javascript
const { Box, RBox, Div, Input, wrapMatches } = nice;
```
Import some functions from NiceScript. 
Functions that starts with capital letter are constructors.

`Box` is simple observable component. 
`RBox` (reactive box) keeps track of other states and updates it's state with given function when inputs do.

`Div` and `Input` for creating Dom elements.

`wrapMatches` takes a string and a patern, and then... // TODO: use ebbedded help to explain

```javascript
const tasks = Box(['Feed the fish', 'Buy milk']);
```
Initial task list.

```javascript
const taskView = t => Div()
  .A(() => tasks.removeValue(t), 'x').float('right').textDecoration('none').up
  .add(wrapMatches(t, input.boxValue()))
  .margin('1em 0').padding('.5em').borderRadius('.3em').backgroundColor('#DEF');
```

Function that takes string and return single task representaion. 
Here we create div element, attach link that deletes task,
add task text with search input highlighted, and give styling.

Adding elements with capital letter will shift focus to that element. 
We need to use `.up` to go back to `Div` defenition.
If we don't need styling for link, we can go with `Div().a(link, text)`.
Focus will stay on the `Div`.


```javascript
const input = Input().padding('.5em').width('100%').boxSizing('border-box')
  .on('keyup', e => e.key === 'Enter' 
      && (tasks.push(e.target.value), e.target.value = ''));
```
Input element for search and create tasks.


```javascript
const list = RBox(tasks, input.boxValue, (tt, s) => 
  Div(tt.filter(t => t.toLowerCase().includes(s.toLowerCase())), taskView));
```
Reactive box for task list view. It updates every time `tasks` or input value changes.


`Div` takes children as arguments. 
You can also call it with array to add all elements. 
`Div([])` is short for `Div(...[])`.
`Div([], function)` is short for `Div(...[].map(function))`.


```javascript
Div(input, list).font('1.2rem Arial').show();
```
Final step. 
Create element with `input` and `list`, give it some styling, and show it.
`.show()` will create DOM node and attach it `document.body` or another provided node.

You can also use `Div().html` to render on server.
