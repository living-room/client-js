import test from 'ava'
import LivingRoomService from '@living-room/service-js'
import Room from '../src/room.js'

test.before(async t => {
  const room = new LivingRoomService()
  const { port } = await room.listen()
  t.context.room = new Room(`http://localhost:${port}`)
})

test('await assert', async t => {
  t.plan(2)
  const { room } = t.context
  const { facts } = await room.assert('hello')
  t.deepEqual(facts, [{ assert: 'hello' }])

  return new Promise((resolve, reject) => {
    room.select('$word')
      .then(words => resolve(t.deepEqual(words, [{ word: { word: 'hello' } }])))
      .catch(reject)
  })
})

test('no callback subscribe', async t => {
  t.plan(2)
  const { room } = t.context
  room.assert('no callback subscribe')

  return new Promise((resolve, reject) => {
    room
      .subscribe('$what callback subscribe', ({ assertions, retractions }) => {
        t.deepEqual(assertions, [{ what: 'no' }])
        t.deepEqual(retractions, [])
        resolve()
      })
  })
})

test('no callback assert', t => {
  t.plan(1)
  const { room } = t.context
  return new Promise((resolve, reject) => {
    room.on('$what callback assert', ({ what }) => {
      t.is(what, 'no')
      resolve()
    })

    room.assert('no callback assert')
  })
})

test('multiple asserts', t => {
  t.plan(5)
  const { room } = t.context
  const animal = new Set([
    'party',
    'car',
    'animal',
    'blue',
    'me'
  ])

  return new Promise((resolve, reject) => {
    room.on('animal $what', ({ what }) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room
      .assert('animal party')
      .assert('animal car')
      .assert('animal animal')

    room
      .assert('animal blue')
      .assert('animal me')
  })
})

test('fancy callable', t => {
  t.plan(5)
  const { room } = t.context
  const animal = new Set([
    'party',
    'car',
    'animal',
    'well',
    'me'
  ])

  return new Promise((resolve, reject) => {
    room.on('animal $what', ({ what }) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room(
      { assert: 'animal party' },
      { assert: 'animal car' },
      { assert: 'animal animal' }
    )

    room(
      { assert: 'animal well' },
      { assert: 'animal me' }
    )
  })
})

test('called for all assertions', t => {
  const { room } = t.context

  return new Promise((resolve, reject) => {
    const asserts = new Set(['first', 'second', 'third'])
    t.plan(asserts.size)

    room.on('$what', ({ what }) => {
      t.true(asserts.delete(what))
      if (!asserts.size) resolve()
    })

    room
      .assert('first')
      .assert('second')

    room
      .assert('third')
  })
})
