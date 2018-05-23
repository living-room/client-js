/**
 * Creates a new http client to a roomdb instance
 *
 * @param {host} host of living room server (defaults to http://localhost:3000)
 */
import fetch from 'node-fetch'
import io from 'socket.io-client'
import bonjour from 'nbonjour'
import EventEmitter from 'events'

function getEnv (key) {
  if (typeof process !== 'undefined') return process.env[key]
}

export default class Room {
  constructor (host) {
    this._messages = []
    this._host = host || getEnv('LIVING_ROOM_HOST') || 'http://localhost:3000'
    if (!this._host.startsWith('http://')) this._host = `http://${this._host}`
    this._hosts = new Set([this._host])

    if (bonjour) {
      const serviceDefinition = { type: 'http', subtypes: ['livingroom'] }
      this._browser = bonjour.create().find(serviceDefinition, service => {
        const { type, host, port } = service
        const uri = `${type}://${host}:${port}`
        if (this._hosts.has(uri)) return
        this._hosts.add(uri)
      })
    }
    this.connect()
  }

  then (onResolve, onReject) {
    clearImmediate(this._immediate)
    return this._request().then(onResolve, onReject)
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
    this._socket.on('connect', () => {
      if (!this._socket.connected) return
      console.error(`connected to ${this._socket.io.uri}`)
    })
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
    const cb = ({ assertions, retractions }) => {
      callback({
        assertions: assertions.map(this._unwrap),
        retractions: retractions.map(this._unwrap)
      })
    }
    this._socket.off(patternsString, cb)
    return new Promise((resolve, reject) => {
      this._socket.emit('unsubscribe', patternsString, resolve)
    })
  }

  /**
   * @param {String} ...facts
   * @param {Function} callback
   */
  subscribe (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const patternsString = JSON.stringify(facts)
    const cb = ({ assertions, retractions }) => {
      callback({
        assertions: assertions.map(this._unwrap),
        retractions: retractions.map(this._unwrap)
      })
    }
    this._socket.on(patternsString, cb)
    return new Promise((resolve, reject) => {
      this._socket.emit('subscribe', patternsString, resolve)
    })
  }

  _unwrap (fact) {
    const unwrapped = {}
    for (let key in fact) {
      const val = fact[key]
      if (typeof val === 'undefined') continue
      unwrapped[key] = val.value || val.word || val.text || val.id
    }
    if (Object.keys(unwrapped).length === 0) return
    return unwrapped
  }

  on (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const cb = ({ assertions }) => {
      assertions.forEach(callback)
    }
    this.subscribe(...facts, cb)
  }

  off (...facts) {
    const callback = facts.splice(facts.length - 1)[0]
    const cb = ({ assertions }) => {
      assertions.forEach(callback)
    }
    this.unsubscribe(...facts)
  }

  /**
   *
   * @param {[String]} facts array of messages to send
   * @param {String: messages | facts | select } endpoint
   * @param {String: GET | POST} method http method to use
   */
  _request (facts, endpoint = 'messages', method = 'POST') {
    facts = facts || this._messages
    if (endpoint !== 'facts' && !facts.length) {
      throw new Error(`Please pass at least one fact for ${endpoint}`)
    }

    if (this._socket.connected) {
      return new Promise((resolve, reject) => {
        const cb = (facts) => {
          this._messages = []
          resolve(facts)
        }

        this._socket.emit(endpoint, facts, cb)
      })
    }

    const uri = `${this._host}/${endpoint}`

    const opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts })
    }

    return fetch(uri, opts)
      .then(response => {
        this._messages = []
        return response.json()
      })
      .catch(error => {
        if (error.code === 'ECONNREFUSED') {
          let customError = new Error(
            `No server listening on ${uri}. Try 'npm start' to run a local service.`
          )
          customError.code = 'NOTLISTENING'
          throw customError
        } else {
          throw error
        }
      })
  }

  _enqueue (facts) {
    clearImmediate(this._immediate)
    this._messages.push(...facts)
    setImmediate(this._request.bind(this))
    return this
  }

  assert (...facts) {
    return this._enqueue(facts.map(assert => ({ assert })))
  }

  retract (...facts) {
    return this._enqueue(facts.map(retract => ({ retract })))
  }

  select (facts) {
    return this._request(facts, 'select').then(({ assertions }) =>
      assertions.map(this._unwrap)
    )
  }

  count (facts) {
    return this._request(facts, 'select').then(assertions => assertions.length)
  }

  exists (facts) {
    return this.count(facts).then(count => count > 0)
  }

  facts () {
    return this._request('facts', undefined, 'GET')
  }
}
