import test from 'ava'
import LivingRoomService from '@living-room/service-js'
import Room from '../src/room.js'

test.beforeEach(async t => {
  const room = new LivingRoomService()
  const { port } = await room.listen()
  t.context.room = new Room(`http://localhost:${port}`)
})

test('assertions are selectable', async t => {
  const { room } = t.context
  await room.assert('hello').send()
  const facts = await room.select('$singleword')
  t.is(facts.length, 1)
  t.deepEqual(facts, [{singleword: {word: 'hello'}}])
})

test('on() callbacks are called', t => {
  const { room } = t.context

  return new Promise(resolve => {
    room.on('on is $adjective', ({ adjective }) => {
      t.is(adjective, 'cool')
      resolve()
    })

    room.assert(`on is cool`).send()
  })
})

test('subscription() callbacks are called', async t => {
  const { room } = t.context
  const adjective = 'cool'

  return new Promise((resolve, reject) => {
    room
      .subscribe('subscription callbacks are $adjective', ({ assertions, retractions }) => {
        t.deepEqual(assertions, [{ adjective }])
        t.deepEqual(retractions, [])
        resolve()
      })
      .catch(reject)

    room.assert(`subscription callbacks are ${adjective}`).send()
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

  return new Promise(resolve => {
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
      .send()
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

  return new Promise(resolve => {
    room.on('animal $what', ({ what }) => {
      t.true(animal.delete(what))
      if (animal.size === 0) resolve()
    })

    room.assert(
      'animal party' ,
      'animal car' ,
      'animal animal',
    )

    room.assert(
      'animal well',
      'animal me',
    ).send()
  })
})