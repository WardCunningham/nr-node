
var reporter = require('./nr-reporter');

reporter.setup ({
  license_key: '79f64277817661e8a5115b452f02f427a31f45b5',
  name: 'Test with Random Numbers'
});

reporter.signal("Component/InfraredSensor[Events]", function() {console.log(123); return 123});
reporter.signal("Component/RandomNumber[Fraction]", function() {console.log('random'); return 200*Math.random()});

function doit () {
  console.log('doit');
  reporter.stat("Component/RandomEvent", Math.random()*300);
}

setInterval(doit, 1234);
