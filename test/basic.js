import test from 'ava'
import { listen } from '@living-room/service-js'
import Room from '../src/room.js'

test.beforeEach(async t => {
  const { port } = await listen({verbose: false})
  t.context.room = new Room(`http://localhost:${port}`)
})

test(`await assert`, async t => {
  t.plan(2)
  const { room } = t.context
  const { facts } = await room.assert(`hello`)
  t.deepEqual(facts, [{assert: `hello`}])

  return new Promise(async (resolve, reject) => {
    room.select(`$word`)
      .then(words => resolve(t.deepEqual(words, [{word: { word: `hello` }}])))
      .catch(reject)
  })
})

test(`no callback subscribe`, async t => {
  t.plan(2)
  const { room } = t.context
  room.assert(`no callback assert`)

  return new Promise((resolve, reject) => {
    room
      .subscribe(`$what callback assert`, ({assertions, retractions}) => {
        t.deepEqual(assertions, [{what: `no`}])
        t.deepEqual(retractions, [])
        resolve()
      })
  })
})

test(`no callback assert`, t => {
  t.plan(1)
  const { room } = t.context
  return new Promise((resolve, reject) => {
    room.on(`$what callback assert`, ({what}) => {
      t.is(what, `no`)
      resolve()
    })

    room.assert(`no callback assert`)
  })
})

test(`multiple asserts`, t => {
  t.plan(5)
  const { room } = t.context
  const animal = new Set([
    `party`,
    `car`,
    `animal`,
    `blue`,
    `me`
  ])

  return new Promise((resolve, reject) => {
    room.on(`animal $what`, ({what}) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room
      .assert(`animal party`)
      .assert(`animal car`)
      .assert(`animal animal`)

    room
      .assert(`animal blue`)
      .assert(`animal me`)
  })
})

test(`fancy callable`, t => {
  t.plan(5)
  const { room } = t.context
  const animal = new Set([
    `party`,
    `car`,
    `animal`,
    `well`,
    `me`
  ])

  return new Promise((resolve, reject) => {
    room.on(`animal $what`, ({what}) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room(
      { assert: `animal party` },
      { assert: `animal car` },
      { assert: `animal animal` }
    )

    room(
      { assert: `animal well`},
      { assert: `animal me`}
    )
  })
})

test.failing(`once only gets called for existing assertions`, t => {
  const { room } = t.context
  t.plan(2)
  let callback = false
  console.log('in callback')
  room.once(`$number`, ({ number }) => {
    console.log('ok')
    console.log({number})
    if (callback) return
    t.true([`first`, `second`].includes(number))
    callback = true
  }).then(console.log).catch(console.error)

  console.log('still')
  
  room
    .assert(`first`)
    .assert(`second`)

  console.log('still')

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('timeout hit')
      room.assert(`third`).then(resolve).catch(reject)
    }, 150)
  })
})

test(`called for all assertions`, t => {
  const { room } = t.context

  return new Promise((resolve, reject) => {
    let asserts = new Set([ `first`, `second`, `third` ])
    t.plan(asserts.size)

    room.on(`$what`, ({what}) => {
      t.true(asserts.delete(what))
      if (!asserts.size) resolve()
    })

    room
      .assert(`first`)
      .assert(`second`)

    room
      .assert(`third`)
  })
})

test.failing('setImmediate clears calls a second time', t => {
  const { room } = t.context

  let times = 0

  return new Promise((resolve, reject) => {
    const processed = response => {
      if (times === 0) {
        t.deepEqual(response, {facts: [{assert: 'this'}, {assert: 'is'}, {assert: 'cool'}]})
      } else if (times === 1) {
        t.deepEqual(response, {facts: [{assert: 'like'}, {assert: 'the'}, {assert: 'coolest'}]})
        resolve()
      }
      times++
    }

    room
      .assert('this')
      .assert('is')
      .assert('cool')
      .then(processed)

    // What is interesting, is that setTimeout with ms >= 50 works
    setImmediate(() => {
      room
        .assert('like')
        .assert('the')
        .assert('coolest')
        .then(processed)
    }, 50)
  })
})
