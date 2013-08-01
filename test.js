var reporter = require('./nr-reporter');
console.log(reporter)

console.log('starting');

//reporter.signal("Component/TV-State", function() {return 1.02});
reporter.signal("Component/InfraredSensor[Events]", function() {console.log(123); return 123});
reporter.signal("Component/RandomNumber[Fraction]", function() {console.log('random'); return 200*Math.random()});


function doit () {
  console.log('doit');
  reporter.stat("Component/RandomEvent", Math.random()*300);
}

setInterval(doit, 1234);

console.log('ready');
