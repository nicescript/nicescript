### Types


<!--
#### Wrapping values
Call nice with js value to wrap it with most appropriate type.
```javascript
const nice = require('nicescript')();
nice(4);        // nice.Num;
nice("");       // nice.Str;
nice(true);     // nice.Bool;
nice({});       // nice.Obj;
nice([]);       // nice.Arr;
nice(1, 2, 3);  // nice.Arr;
nice(null);     // nice.Null;
```
-->

#### Creation
```javascript
nice.Type('Animal')
  .string('name')
  .number('weight')
  .boolean('hasTail')
  .by((z, name) => z.name(name));

const jim = nice.Animal('Jim').weight(5);
jim.name();       // Jim 
jim.weight();     // 5

// by default created type extends nice.Obj
jim.isObj()   // true

```
Type name should start with capital letter.


### Inheritance
```javascript
nice.Animal.extend('Dog')
  .string('breed')
  .by((z, name) => z.super(name).hasTail(true));
  
const buddy = nice.Dog('Buddy');

buddy.hasTail();  //true
buddy.isAnimal();  //true
buddy.isDog();  //true
```

### Method overload
```javascript
nice.Func.Animal('voice', () => console.log('Hm'));
nice.Func.Dog('voice', () => console.log('Woof'));

buddy.voice();  // 'Woof'
jim.voice();    // 'Hm'
```


### Embedded types

Here are some of embedded types:  

+ Anything
  + Something
    + Value
      + Obj
        + [Html](./html.md)
      + Single
        + Str
        + Num
        + Bool
    + [Function](#functions)
    + [Box](./boxes.md)
    + Ok
  + Nothing
    + Error
    + Undefined
    + Null
    + Fail

<!--


### Functions

```javascript
// Creating anonymous function
const f = nice.Func(n => n + 1);
f(1);               // 2

// Named functions will be added to nice
const plusTwo = nice.Func('plusTwo', n => n + 2);
//or nice.Func(function plusTwo(n) { return n + 2; });
plusTwo(1);         // 3
nice.plusTwo(1);    // 3

// Check argument type
const x2 = nice.Func.Number('x2', n => n * 2);
x2(21);             // 42
nice.x2(21);        // 42
nice.Num(1).x2();// 42
x2('q');            // throws "Function  can't handle (Str)"

// now let's overload x2 for strings
x2.String(s => s + '!');
x2(21);             // 42
x2('q');            // q!

```
Function name should start with lowercase letter. 

#### Function types

##### Mapping
Clean function that do not changes it's arguments. 
NiceScript will always [wrap](#wrapping-values) result of Mapping. 

```javascript
nice.Mapping.Num.Num('times', (a, b) => a * b);
const n = nice(5);
const n2 = n.times(3).times(2); // nice.Num(30)
n()                             // 5
n2()                            // 30;
```
 
##### Check
Returns boolean. Never changes it's arguments. 
After definition named Check can be used in [Switch](#switch) and 'is' statements. 

##### Action
Changes first argument. Action always returns it's first argument so you can 
call multiple actions in a row.

```javascript
nice.Action.Num.Num('times', (a, b) => a * b);
const n = nice(5);
n.times(3).times(2);            // n
n();                            // 30;
```

-->