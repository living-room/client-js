#!/usr/bin/env node

const printHelp = () => {
  console.error(`
  Assert, retract, or select facts from a living room server

  Note the backslashes are important for escaping bash quoting

  Assert a new fact

      room assert "Gorog the barbarian is at (0.5, 0.7)"

  Select a fact

      room select "\$who the \$what is at (\$x, \$y)"

  Retract a fact

      room retract "Gorog the barbarian is at (0.5, 0.7)"

  Subscribe to changes (press enter to exit)

      room subscribe "\$who the \$what is at (\$x, \$y)"
  `)
}

if (process.argv.length < 2) process.exit(printHelp())

import Room from '../src/room.js'
const room = new Room() // Defaults to http://localhost:3000

const facts = process.argv.slice(3)[0]
const verbose = ['--verbose', '-v'].some(
  arg => process.argv.indexOf(arg) !== -1
)

async function main () {
  switch (process.argv[2]) {
    case 'assert':
      return room.assert(facts).then(console.log)
    case 'retract':
      return room.retract(facts).then(console.log)
    case 'select':
      return room.select(facts).then(({assertions}) => console.dir(assertions))
    case 'subscribe':
      return new Promise(resolve => {
        let delay = 100
        const logWithDelayOnce = a => setTimeout(() => console.log(a), (delay = 0))
        room.subscribe(facts, logWithDelayOnce)
        .then(() => {
          console.error(`subscribed to "${facts}"`)
          console.error(`press any key to quit`)
        })
        process.stdin.on('data', resolve)
      })
    default:
      return printHelp()
  }
}

main()
  .catch(err => {
    let code = err.code || 'Error'
    console.error(`${code}: ${err.message}`)
    if (verbose) {
      console.error(err.stack)
    }
  })
  .then(process.exit)
