const Room = require('../build/room.js')
const room = new Room()

room.select('$a is a $b animal at ($c, $d)').then(console.dir)
room.subscribe(`$a is a $aspecies animal at ($ax, $ay)`, console.dir)
setTimeout(() => room.assert('bleep is a test animal at (0.1, 0.2)'), 500)
