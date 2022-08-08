/**
 * Creates a new client to a roomdb instance
 * This client will try and communicate over socket.io or http
 *
 * @param {host} host of living room server (defaults to http://localhost:3000)
 */
import fetch from 'node-fetch'
import bonjour from 'nbonjour'
import io from 'socket.io-client'

export default class Room {
  constructor (host) {
    this._subscribeTimeout = 2500 // ms
    this._messages = []
    this._host = host || process.env.LIVING_ROOM_HOST || 'localhost:3000'
    if (!this._host.startsWith('http://')) this._host = `http://${this._host}`
    this._hosts = new Set([this._host])
    this.connect()

    const serviceDefinition = { type: 'http', subtypes: ['livingroom'] }
    this._browser = bonjour.create().find(serviceDefinition, service => {
      const { type, host, port } = service
      const uri = `${type}://${host}:${port}`
      this._hosts.add(uri)
    })
  }

  nexthost () {
    io.disconnect(this._host)
    const ordered = Array.from(this._hosts.values()).sort()
    const index = ordered.indexOf(this._host)
    console.write(`switching from ${this._host}`)
    this._host = ordered[(index + 1) % ordered.length]
    this.connect()
  }

  connect () {
    this._socket = io(this._host)
    this._socket.on('error', (error) => console.error(error))
    if (typeof window === 'object') {
      this._socket.on('reconnect', () => {
        window.location.reload(true)
      })
    }
  }

  /**
   * @param {String} ...facts
   * @param {Function} callback
   */
  unsubscribe (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const patternsString = JSON.stringify(facts)

    const unwrapped = results => {
      const unwrappedResults = this._unwrap(results)
      callback(unwrappedResults)
    }
    this._socket.off(patternsString, unwrapped)

    return new Promise(resolve => {
      this._socket.emit('unsubscribe', patternsString, resolve)
    })
  }

  /**
   * Subscribe lets a callback listen to all assertions and retractions
   * Compare to .on() which fires off only for assertions
   *
   * @param {String} ...facts
   * @param {Function} callback
   */
  subscribe (...facts) {
    const callback = facts.splice(facts.length - 1)[0]

    return new Promise((resolve, reject) => {
      this._socket.on('error', reject)
      this._socket.on('subscribe', resolve)

      this._socket.on(facts, results => {
        // this.facts().then(f => console.log(f))
        // console.log({ results })
        const unwrappedResults = this._unwrap(results)
        callback(unwrappedResults)
      })
      this._socket.emit('subscribe', facts)
    })
  }

  _unwrap ({ assertions, retractions }) {
    const unwrap = fact => {
      const unwrapped = {}
      for (const key in fact) {
        const val = fact[key]
        if (typeof val === 'undefined') continue
        unwrapped[key] = val.value || val.word || val.text || val.id
      }
      return unwrapped
    }

    return {
      assertions: assertions.map(unwrap),
      retractions: retractions.map(unwrap)
    }
  }

  on (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const cb = ({ assertions }) => assertions.forEach(callback)
    this.subscribe(...facts, cb)
  }

  off (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const cb = ({ assertions }) => assertions.forEach(callback)
    this.unsubscribe(...facts, cb)
  }

  _fetch (endpoint, facts) {
    const uri = `${this._host}/${endpoint}`

    const opts = {
      method: endpoint === 'facts' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts })
    }

    return fetch(uri, opts)
      .then(response => response.json())
      .then(response => {
        if (response) {
          const mapped = response?.facts?.map(JSON.stringify)
          this._messages = this._messages.filter(
            message => !mapped.includes(JSON.stringify(message))
          )
        }
        return response
      })
      .catch(error => {
        if (error.code === 'ECONNREFUSED') {
          const customError = new Error(
            `No server listening on ${uri}. Try 'npm start' to run a local service.`
          )
          customError.code = 'NOTLISTENING'
          throw customError
        } else {
          throw error
        }
      })
  }

  _emit(endpoint, facts) {
    return new Promise(resolve => {
      const cb = result => {
        const mapped = result.map(JSON.stringify)
        this._messages = this._messages.filter(
          message => !mapped.includes(JSON.stringify(message))
        )
        resolve(result)
      }

      this._socket.emit(endpoint, facts, cb)
    })
  }

  /**
   * @param {String: messages | facts | select } endpoint
   * @param {String[]} facts array of messages to send
   */
  send (endpoint = 'messages', facts = this._messages) {
    if (endpoint !== 'facts' && !(facts.length > 0))
      throw new Error(`Please pass at least one fact for ${endpoint}`)

    if (this._socket.connected)
      return this._emit(endpoint, facts)

    return this._fetch(endpoint, facts)
  }

  _enqueue (...facts) {
    this._messages.push(...facts)
    return this
  }

  facts () {
    return this.send('facts')
  }

  assert (...facts) {
    return this._enqueue(...facts.map(assert => ({ assert })))
  }

  retract (...facts) {
    return this._enqueue(...facts.map(retract => ({ retract })))
  }

  select (...facts) {
    return this.send('select', facts)
  }

  count (...facts) {
    return this.select(...facts).then(assertions => assertions.length)
  }

  exists (...facts) {
    return this.count(...facts).then(count => count > 0)
  }
}
