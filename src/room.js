/**
 * Creates a new http client to a roomdb instance
 *
 * @param {host} host of living room server (defaults to http://localhost:3000)
 */
import fetch from 'node-fetch'
import bonjour from 'nbonjour'
import io from 'socket.io-client'
import CallableInstance from 'callable-instance'

export default class Room extends CallableInstance {
  constructor (host) {
    super('_enqueue')
    this._subscribeTimeout = 2500 // ms
    this._messages = []
    this._host =
      host || process.env.LIVING_ROOM_HOST || 'http://localhost:3000'
    if (!this._host.startsWith('http://')) this._host = `http://${this._host}`
    this._hosts = new Set([this._host])
    this.connect()

    const serviceDefinition = { type: 'http', subtypes: ['livingroom'] }
    this._browser = bonjour.create().find(serviceDefinition, service => {
      const { type, host, port } = service
      const uri = `${type}://${host}:${port}`
      if (this._hosts.has(uri)) return
      this._hosts.add(uri)
    })
  }

  reset () {
    clearTimeout(this._timeout)
  }

  then (onResolve, onReject) {
    this.reset()
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

    return new Promise((resolve, reject) => {
      this._socket.emit('unsubscribe', patternsString, resolve)
    })
  }

  /**
   * @param {String} ...facts
   * @param {Function} callback
   */
  subscribe (...facts) {
    return new Promise((resolve, reject) => {
      const callback = facts.splice(facts.length - 1)[0]
      const subscription = JSON.stringify(facts)

      const subscribed = _ => {
        clearTimeout(timeout)
        resolve()
      }

      const unwrapped = results => {
        const unwrappedResults = this._unwrap(results)
        callback(unwrappedResults)
      }

      const timeout = setTimeout(() => {
        this._socket.off(subscription, unwrapped)
        reject(new Error(`subscribe timed out after ${this._subscribeTimeout}`))
      }, this._subscribeTimeout)

      this._socket.on(subscription, unwrapped)
      this._socket.emit('subscribe', facts, subscribed)
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

    const uri = `${this._host}/${endpoint}`

    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts })
    }

    return fetch(uri, opts)
      .then(response => response.json())
      .then(response => {
        if (response) {
          const mapped = response.facts.map(JSON.stringify)
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

  _enqueue (...facts) {
    this.reset()
    this._messages.push(...facts)
    this._timeout = setTimeout(this.then.bind(this))
    return this
  }

  assert (...facts) {
    return this._enqueue(...facts.map(assert => ({ assert })))
  }

  retract (...facts) {
    return this._enqueue(...facts.map(retract => ({ retract })))
  }

  select (...facts) {
    return this._request(facts, 'select')
  }

  count (...facts) {
    return this.select(...facts).then(assertions => assertions.length)
  }

  exists (...facts) {
    return this.count(...facts).then(count => count > 0)
  }

  facts () {
    return this._request('facts', undefined, 'GET')
  }
}
