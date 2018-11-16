//TODO: rewrite
Checks
========

Checks are functions that check if some condition is true.

```javascript
const { Check, is, Switch, expect } = nice;
 
// creation using named function
Check(function isRed(c) { return c === 'red'; });

// creation using given name
Check('isGreen', c => c === 'green');

// using with is
is.red('red');      //true
is.green(4);        //false

// using with nice
nice(42).isRed();  //false

// using with Switch
const f = Switch
  .red('#F00')
  .green('#0F0')
  .default('#666');

f('red');     //#F00  
f('blue');    //#666  
 
// using witn expect
expect('red').red()    // nice.Ok() 
expect('green').red()  // throws 'red expected' 
```
All calls to checks using `is.` and `Switch.` are wrapped in try-catch.
```javascript
Check('enoughMoney', o => o.user.balance > 100);
is.enoughMoney({user:{balance: 200}});  //true
is.enoughMoney({});                     //false
```

## Define check with signature 
By default all arguments passed to check as is. 

```javascript
Check('small', s => s === 'small');
is.small('small');            //true
is.small(nice('small'));      //false
```

To make sure you receive certain type use function signature.

```javascript
Check.Number('big', n => n > 10);   // use JS type
Check.Str('big', s => s.is('big')); // use Nice type

is.big(10);             //false
is.big(12);             //true
is.big(nice(12));       //true
nice(12).isBig();       //true
nice('big').isBig();    //true
nice('small').isBig();  //false
nice.Div().isBig();     //false
```

## Type checks

There is check for every defined type.

```javascript
const { is, Type } = nice;

nice.isString('qwe');     //true
nice.isNumber('qwe');     //false
nice.isHtml(nice.Div());  //true

Type('Mouse');
const mouse = nice.Mouse();
is(mouse).Mouse();    //true
mouse.isMouse();     //true
mouse.isString();    //false

```

## Predefined checks
