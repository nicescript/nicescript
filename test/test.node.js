//const nice = require('../index.js')();

//CPU USAGE:
//console.log(process.cpuUsage());
//const previousUsage = process.cpuUsage();
//// { user: 38579, system: 6986 }
//
//// spin the CPU for 500 milliseconds
//const startDate = Date.now();
//while (Date.now() - startDate < 50000);
//
//// At this moment you can expect result 100%
//// Time is *1000 because cpuUsage is in us (microseconds)
//const usage = process.cpuUsage(previousUsage);
//const result = 100 * (usage.user + usage.system) / ((Date.now() - startDate) * 1000)
//console.log(result);
//console.log(process.cpuUsage());
//
//// set 2 sec "non-busy" timeout
//setInterval(function() {
//    console.log(process.cpuUsage(previousUsage));
//    // { user: 514883, system: 11226 }    ~ 0,5 sec
//    // here you can expect result about 20% (0.5s busy of 2.5s total runtime, relative to previousUsage that is first value taken about 2.5s ago)
//}, 1000);

//NETWORK:
var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(1337, '127.0.0.1');


base.create();
base.open();
base.clone();

stream.add(message);
stream.on(f);

[{type: "add", recordId:133, field:"Title", valueType:"string", value:"42 parrots"}];
//compact:
// maps: {
//  1: type:add|field:Title|valueType:string|recordId|value,
//  2: type:update|field:Title|valueType:string|recordId|value,
// }
// values: [
//  [1, 133, "42 parrots"],
//  [2, 133, "42 pigs"]
// ]

// trs: {
//  0: 0 | 0 | extend
//  1: 0 | 0 | value,
//  2: 0 | 1 | recordId,
//  3: 0 | 2 | field:Title,
//  4: 0 | 3 | valueType:string
//  5: 0 | 4 | type:add
//  6: 0 | 5 | recordId
//  7: 5 | "42 parrots" | 133
//  8: 0 | 4 | type:update
//  9: 0 | 8 | recordId
// 10: 9 | "42 pigs" | 133
// }


//?? update or remove|add