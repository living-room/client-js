'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fetch = _interopDefault(require('node-fetch'));
var io = _interopDefault(require('socket.io-client'));
var bonjour = _interopDefault(require('nbonjour'));

function getEnv (key) {
  if (typeof process !== 'undefined') return process.env[key]
}

class Room {
  constructor (host) {
    this._host = host || getEnv('LIVING_ROOM_HOST') || 'http://localhost:3000';
    if (!this._host.startsWith('http://')) this._host = `http://${this._host}`;
    this._hosts = new Set(this._host);

    if (bonjour) {
      const serviceDefinition = { type: 'http', subtypes: ['livingroom'] };
      this._browser = bonjour.create().find(serviceDefinition, service => {
        const { type, host, port } = service;
        const uri = `${type}://${host}:${port}`;
        if (this._hosts.has(uri)) return
        this._hosts.add(uri);
        console.log(`found new host ${uri}`);
        console.log(`use \`room.nexthost()\` to cycle through hosts`);
      });
    }
    this.connect();
  }

  nexthost () {
    io.disconnect(this._host);
    const ordered = Array.from(this._hosts.values()).sort();
    const index = ordered.indexOf(this._host);
    console.write(`switching from ${this._host}`);
    this._host = ordered[(index + 1) % ordered.length];
    this.connect();
  }

  connect () {
    this._socket = io.connect(this._host);
    console.log(`connecting to ${this._host}`);
    if (typeof window === 'object') {
      this._socket.on('reconnect', () => {
        window.location.reload(true);
      });
    }
  }

  /**
   * @param {String} ...facts
   * @param {Function} callback
   */
  subscribe (...facts) {
    const callback = facts.splice(facts.length - 1)[0];
    const patternsString = JSON.stringify(facts);
    // TODO: figure out why we even get undefined here
    const isDefined = v => typeof v !== 'undefined';
    const cb = ({ assertions, retractions }) => {
      callback({
        assertions: assertions.map(this._unwrap).filter(isDefined),
        retractions: retractions.map(this._unwrap).filter(isDefined)
      });
    };
    this._socket.on(patternsString, cb);
    this._socket.emit('subscribe', patternsString);
  }

  _unwrap (fact) {
    const unwrapped = {};
    for (let key in fact) {
      const val = fact[key];
      if (typeof val === 'undefined') continue
      unwrapped[key] = val.value || val.word || val.text || val.id;
    }
    if (Object.keys(unwrapped).length === 0) return
    return unwrapped
  }

  on (...facts) {
    console.log('---');
    console.dir(facts);
    const callback = facts.splice(facts.length - 1)[0];
    console.dir(facts);
    const cb = ({ assertions }) => {
      assertions.forEach(callback);
    };
    console.dir(cb);
    this.subscribe(...facts, cb);
  }

  /**
   *
   * @param {String} endpoint assert, retract, select
   * @param {[String]} facts
   */
  _request (endpoint, facts, method) {
    if (!['assert', 'retract', 'select', 'facts'].includes(endpoint)) {
      throw new Error('Unknown endpoint, try assert, retract, select, or facts')
    }

    if (typeof facts === 'string') {
      facts = [facts];
    }

    if (!(endpoint === 'facts' || (facts && facts.length))) {
      throw new Error('Please pass at least one fact')
    }

    if (this._socket.connected) {
      return new Promise((resolve, reject) => {
        // NOTE - promises only resolve to the first value they ever return
        // so any additional emit callbacks will be ignored
        this._socket.emit(endpoint, facts, resolve);
      })
    }

    const uri = `${this._host}/${endpoint}`;

    const opts = {
      method: method || 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    if (facts !== undefined) {
      opts.body = JSON.stringify({ facts });
    }

    return fetch(uri, opts)
      .then(response => response.json())
      .catch(error => {
        if (error.code === 'ECONNREFUSED') {
          let customError = new Error(
            `No server listening on ${uri}. Try 'npm start' to run a local service.`
          );
          customError.code = 'NOTLISTENING';
          throw customError
        } else {
          throw error
        }
      })
  }

  assert (facts) {
    return this._request('assert', facts)
  }

  retract (facts) {
    return this._request('retract', facts)
  }

  select (facts) {
    return this._request('select', facts)
  }

  facts () {
    return this._request('facts', undefined, 'GET')
  }
}

module.exports = Room;
//# sourceMappingURL=room.js.map
