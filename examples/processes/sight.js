// $name is a $species animal at ($x, $y)
// $species can see $distance

module.exports = room => {
  if (!room) {
    const Room = require('../build/room.js')
    const room = new Room()
  }

  room.subscribe(
    [
      `$a is a $aspecies animal at ($ax, $ay)`,
      `$b is a $bspecies animal at ($bx, $by)`,
      `$aspecies can see $distance`
    ],
    // why is this async?
    async ({assertions, retractions}) => {
      assertions.forEach(async ({ a, b, ax, ay, bx, by, distance }) => {
        if (a.word === b.word) return
        const [dx, dy] = [100 * (ax.value - bx.value), 100 * (ay.value - by.value)]
        const seesFact = `${a.word} sees ${b.word}`

        if ((dx * dx) + (dy * dy) < ($distance * $distance)) {
          room.assert(seesFact).then(console.dir)
        } else {
          room.retract(seesFact).then(console.dir)
        }
      })
    })
}
