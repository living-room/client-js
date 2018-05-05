(function (global, factory) {
            typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('node-fetch'), require('socket.io-client')) :
            typeof define === 'function' && define.amd ? define(['node-fetch', 'socket.io-client'], factory) :
            (global.room = factory(global.fetch,global.io));
}(this, (function (fetch,io) { 'use strict';

            fetch = fetch && fetch.hasOwnProperty('default') ? fetch['default'] : fetch;
            io = io && io.hasOwnProperty('default') ? io['default'] : io;

            var global$1 = typeof global !== "undefined" ? global :
                        typeof self !== "undefined" ? self :
                        typeof window !== "undefined" ? window : {}

            // shim for using process in browser
            // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

            function defaultSetTimout() {
                throw new Error('setTimeout has not been defined');
            }
            function defaultClearTimeout () {
                throw new Error('clearTimeout has not been defined');
            }
            var cachedSetTimeout = defaultSetTimout;
            var cachedClearTimeout = defaultClearTimeout;
            if (typeof global$1.setTimeout === 'function') {
                cachedSetTimeout = setTimeout;
            }
            if (typeof global$1.clearTimeout === 'function') {
                cachedClearTimeout = clearTimeout;
            }

            function runTimeout(fun) {
                if (cachedSetTimeout === setTimeout) {
                    //normal enviroments in sane situations
                    return setTimeout(fun, 0);
                }
                // if setTimeout wasn't available but was latter defined
                if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                    cachedSetTimeout = setTimeout;
                    return setTimeout(fun, 0);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedSetTimeout(fun, 0);
                } catch(e){
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                        return cachedSetTimeout.call(null, fun, 0);
                    } catch(e){
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                        return cachedSetTimeout.call(this, fun, 0);
                    }
                }


            }
            function runClearTimeout(marker) {
                if (cachedClearTimeout === clearTimeout) {
                    //normal enviroments in sane situations
                    return clearTimeout(marker);
                }
                // if clearTimeout wasn't available but was latter defined
                if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                    cachedClearTimeout = clearTimeout;
                    return clearTimeout(marker);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedClearTimeout(marker);
                } catch (e){
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                        return cachedClearTimeout.call(null, marker);
                    } catch (e){
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                        return cachedClearTimeout.call(this, marker);
                    }
                }



            }
            var queue = [];
            var draining = false;
            var currentQueue;
            var queueIndex = -1;

            function cleanUpNextTick() {
                if (!draining || !currentQueue) {
                    return;
                }
                draining = false;
                if (currentQueue.length) {
                    queue = currentQueue.concat(queue);
                } else {
                    queueIndex = -1;
                }
                if (queue.length) {
                    drainQueue();
                }
            }

            function drainQueue() {
                if (draining) {
                    return;
                }
                var timeout = runTimeout(cleanUpNextTick);
                draining = true;

                var len = queue.length;
                while(len) {
                    currentQueue = queue;
                    queue = [];
                    while (++queueIndex < len) {
                        if (currentQueue) {
                            currentQueue[queueIndex].run();
                        }
                    }
                    queueIndex = -1;
                    len = queue.length;
                }
                currentQueue = null;
                draining = false;
                runClearTimeout(timeout);
            }
            function nextTick(fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                }
                queue.push(new Item(fun, args));
                if (queue.length === 1 && !draining) {
                    runTimeout(drainQueue);
                }
            }
            // v8 likes predictible objects
            function Item(fun, array) {
                this.fun = fun;
                this.array = array;
            }
            Item.prototype.run = function () {
                this.fun.apply(null, this.array);
            };
            var title = 'browser';
            var platform = 'browser';
            var browser = true;
            var env = {};
            var argv = [];
            var version = ''; // empty string to avoid regexp issues
            var versions = {};
            var release = {};
            var config = {};

            function noop() {}

            var on = noop;
            var addListener = noop;
            var once = noop;
            var off = noop;
            var removeListener = noop;
            var removeAllListeners = noop;
            var emit = noop;

            function binding(name) {
                throw new Error('process.binding is not supported');
            }

            function cwd () { return '/' }
            function chdir (dir) {
                throw new Error('process.chdir is not supported');
            }function umask() { return 0; }

            // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
            var performance = global$1.performance || {};
            var performanceNow =
              performance.now        ||
              performance.mozNow     ||
              performance.msNow      ||
              performance.oNow       ||
              performance.webkitNow  ||
              function(){ return (new Date()).getTime() };

            // generate timestamp or delta
            // see http://nodejs.org/api/process.html#process_process_hrtime
            function hrtime(previousTimestamp){
              var clocktime = performanceNow.call(performance)*1e-3;
              var seconds = Math.floor(clocktime);
              var nanoseconds = Math.floor((clocktime%1)*1e9);
              if (previousTimestamp) {
                seconds = seconds - previousTimestamp[0];
                nanoseconds = nanoseconds - previousTimestamp[1];
                if (nanoseconds<0) {
                  seconds--;
                  nanoseconds += 1e9;
                }
              }
              return [seconds,nanoseconds]
            }

            var startTime = new Date();
            function uptime() {
              var currentTime = new Date();
              var dif = currentTime - startTime;
              return dif / 1000;
            }

            var process = {
              nextTick: nextTick,
              title: title,
              browser: browser,
              env: env,
              argv: argv,
              version: version,
              versions: versions,
              on: on,
              addListener: addListener,
              once: once,
              off: off,
              removeListener: removeListener,
              removeAllListeners: removeAllListeners,
              emit: emit,
              binding: binding,
              cwd: cwd,
              chdir: chdir,
              umask: umask,
              hrtime: hrtime,
              platform: platform,
              release: release,
              config: config,
              uptime: uptime
            };

            var r = /[A-Z]/g;

            var dnsEqual = function (a, b) {
              a = a.replace(r, replacer);
              b = b.replace(r, replacer);
              return a === b
            };

            function replacer (m) {
              return m.toLowerCase()
            }

            /**
             * Expose `arrayFlatten`.
             */
            var arrayFlatten = flatten;
            var from = flattenFrom;
            var depth = flattenDepth;
            var fromDepth = flattenFromDepth;

            /**
             * Flatten an array.
             *
             * @param  {Array} array
             * @return {Array}
             */
            function flatten (array) {
              if (!Array.isArray(array)) {
                throw new TypeError('Expected value to be an array')
              }

              return flattenFrom(array)
            }

            /**
             * Flatten an array-like structure.
             *
             * @param  {Array} array
             * @return {Array}
             */
            function flattenFrom (array) {
              return flattenDown(array, [])
            }

            /**
             * Flatten an array-like structure with depth.
             *
             * @param  {Array}  array
             * @param  {number} depth
             * @return {Array}
             */
            function flattenDepth (array, depth) {
              if (!Array.isArray(array)) {
                throw new TypeError('Expected value to be an array')
              }

              return flattenFromDepth(array, depth)
            }

            /**
             * Flatten an array-like structure with depth.
             *
             * @param  {Array}  array
             * @param  {number} depth
             * @return {Array}
             */
            function flattenFromDepth (array, depth) {
              if (typeof depth !== 'number') {
                throw new TypeError('Expected the depth to be a number')
              }

              return flattenDownDepth(array, [], depth)
            }

            /**
             * Flatten an array indefinitely.
             *
             * @param  {Array} array
             * @param  {Array} result
             * @return {Array}
             */
            function flattenDown (array, result) {
              for (var i = 0; i < array.length; i++) {
                var value = array[i];

                if (Array.isArray(value)) {
                  flattenDown(value, result);
                } else {
                  result.push(value);
                }
              }

              return result
            }

            /**
             * Flatten an array with depth.
             *
             * @param  {Array}  array
             * @param  {Array}  result
             * @param  {number} depth
             * @return {Array}
             */
            function flattenDownDepth (array, result, depth) {
              depth--;

              for (var i = 0; i < array.length; i++) {
                var value = array[i];

                if (depth > -1 && Array.isArray(value)) {
                  flattenDownDepth(value, result, depth);
                } else {
                  result.push(value);
                }
              }

              return result
            }
            arrayFlatten.from = from;
            arrayFlatten.depth = depth;
            arrayFlatten.fromDepth = fromDepth;

            /*
            The MIT License (MIT)

            Copyright (c) 2016 CoderPuppy

            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:

            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.

            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.

            */
            var _endianness;
            function endianness() {
              if (typeof _endianness === 'undefined') {
                var a = new ArrayBuffer(2);
                var b = new Uint8Array(a);
                var c = new Uint16Array(a);
                b[0] = 1;
                b[1] = 2;
                if (c[0] === 258) {
                  _endianness = 'BE';
                } else if (c[0] === 513){
                  _endianness = 'LE';
                } else {
                  throw new Error('unable to figure out endianess');
                }
              }
              return _endianness;
            }

            function hostname() {
              if (typeof global$1.location !== 'undefined') {
                return global$1.location.hostname
              } else return '';
            }

            function loadavg() {
              return [];
            }

            function uptime$1() {
              return 0;
            }

            function freemem() {
              return Number.MAX_VALUE;
            }

            function totalmem() {
              return Number.MAX_VALUE;
            }

            function cpus() {
              return [];
            }

            function type() {
              return 'Browser';
            }

            function release$1 () {
              if (typeof global$1.navigator !== 'undefined') {
                return global$1.navigator.appVersion;
              }
              return '';
            }

            function networkInterfaces(){}
            function getNetworkInterfaces(){}

            function arch() {
              return 'javascript';
            }

            function platform$1() {
              return 'browser';
            }

            function tmpDir() {
              return '/tmp';
            }
            var tmpdir = tmpDir;

            var EOL = '\n';
            var os = {
              EOL: EOL,
              tmpdir: tmpdir,
              tmpDir: tmpDir,
              networkInterfaces:networkInterfaces,
              getNetworkInterfaces: getNetworkInterfaces,
              release: release$1,
              type: type,
              cpus: cpus,
              totalmem: totalmem,
              freemem: freemem,
              uptime: uptime$1,
              loadavg: loadavg,
              hostname: hostname,
              endianness: endianness,
            }

            var os$1 = /*#__PURE__*/Object.freeze({
                        endianness: endianness,
                        hostname: hostname,
                        loadavg: loadavg,
                        uptime: uptime$1,
                        freemem: freemem,
                        totalmem: totalmem,
                        cpus: cpus,
                        type: type,
                        release: release$1,
                        networkInterfaces: networkInterfaces,
                        getNetworkInterfaces: getNetworkInterfaces,
                        arch: arch,
                        platform: platform$1,
                        tmpDir: tmpDir,
                        tmpdir: tmpdir,
                        EOL: EOL,
                        default: os
            });

            var lookup = [];
            var revLookup = [];
            var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
            var inited = false;
            function init () {
              inited = true;
              var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
              for (var i = 0, len = code.length; i < len; ++i) {
                lookup[i] = code[i];
                revLookup[code.charCodeAt(i)] = i;
              }

              revLookup['-'.charCodeAt(0)] = 62;
              revLookup['_'.charCodeAt(0)] = 63;
            }

            function toByteArray (b64) {
              if (!inited) {
                init();
              }
              var i, j, l, tmp, placeHolders, arr;
              var len = b64.length;

              if (len % 4 > 0) {
                throw new Error('Invalid string. Length must be a multiple of 4')
              }

              // the number of equal signs (place holders)
              // if there are two placeholders, than the two characters before it
              // represent one byte
              // if there is only one, then the three characters before it represent 2 bytes
              // this is just a cheap hack to not do indexOf twice
              placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

              // base64 is 4/3 + up to two characters of the original data
              arr = new Arr(len * 3 / 4 - placeHolders);

              // if there are placeholders, only get up to the last complete 4 chars
              l = placeHolders > 0 ? len - 4 : len;

              var L = 0;

              for (i = 0, j = 0; i < l; i += 4, j += 3) {
                tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
                arr[L++] = (tmp >> 16) & 0xFF;
                arr[L++] = (tmp >> 8) & 0xFF;
                arr[L++] = tmp & 0xFF;
              }

              if (placeHolders === 2) {
                tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
                arr[L++] = tmp & 0xFF;
              } else if (placeHolders === 1) {
                tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
                arr[L++] = (tmp >> 8) & 0xFF;
                arr[L++] = tmp & 0xFF;
              }

              return arr
            }

            function tripletToBase64 (num) {
              return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
            }

            function encodeChunk (uint8, start, end) {
              var tmp;
              var output = [];
              for (var i = start; i < end; i += 3) {
                tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
                output.push(tripletToBase64(tmp));
              }
              return output.join('')
            }

            function fromByteArray (uint8) {
              if (!inited) {
                init();
              }
              var tmp;
              var len = uint8.length;
              var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
              var output = '';
              var parts = [];
              var maxChunkLength = 16383; // must be multiple of 3

              // go through the array every three bytes, we'll deal with trailing stuff later
              for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
              }

              // pad the end with zeros, but make sure to not forget the extra bytes
              if (extraBytes === 1) {
                tmp = uint8[len - 1];
                output += lookup[tmp >> 2];
                output += lookup[(tmp << 4) & 0x3F];
                output += '==';
              } else if (extraBytes === 2) {
                tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
                output += lookup[tmp >> 10];
                output += lookup[(tmp >> 4) & 0x3F];
                output += lookup[(tmp << 2) & 0x3F];
                output += '=';
              }

              parts.push(output);

              return parts.join('')
            }

            function read (buffer, offset, isLE, mLen, nBytes) {
              var e, m;
              var eLen = nBytes * 8 - mLen - 1;
              var eMax = (1 << eLen) - 1;
              var eBias = eMax >> 1;
              var nBits = -7;
              var i = isLE ? (nBytes - 1) : 0;
              var d = isLE ? -1 : 1;
              var s = buffer[offset + i];

              i += d;

              e = s & ((1 << (-nBits)) - 1);
              s >>= (-nBits);
              nBits += eLen;
              for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

              m = e & ((1 << (-nBits)) - 1);
              e >>= (-nBits);
              nBits += mLen;
              for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

              if (e === 0) {
                e = 1 - eBias;
              } else if (e === eMax) {
                return m ? NaN : ((s ? -1 : 1) * Infinity)
              } else {
                m = m + Math.pow(2, mLen);
                e = e - eBias;
              }
              return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }

            function write (buffer, value, offset, isLE, mLen, nBytes) {
              var e, m, c;
              var eLen = nBytes * 8 - mLen - 1;
              var eMax = (1 << eLen) - 1;
              var eBias = eMax >> 1;
              var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
              var i = isLE ? 0 : (nBytes - 1);
              var d = isLE ? 1 : -1;
              var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

              value = Math.abs(value);

              if (isNaN(value) || value === Infinity) {
                m = isNaN(value) ? 1 : 0;
                e = eMax;
              } else {
                e = Math.floor(Math.log(value) / Math.LN2);
                if (value * (c = Math.pow(2, -e)) < 1) {
                  e--;
                  c *= 2;
                }
                if (e + eBias >= 1) {
                  value += rt / c;
                } else {
                  value += rt * Math.pow(2, 1 - eBias);
                }
                if (value * c >= 2) {
                  e++;
                  c /= 2;
                }

                if (e + eBias >= eMax) {
                  m = 0;
                  e = eMax;
                } else if (e + eBias >= 1) {
                  m = (value * c - 1) * Math.pow(2, mLen);
                  e = e + eBias;
                } else {
                  m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                  e = 0;
                }
              }

              for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

              e = (e << mLen) | m;
              eLen += mLen;
              for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

              buffer[offset + i - d] |= s * 128;
            }

            var toString = {}.toString;

            var isArray = Array.isArray || function (arr) {
              return toString.call(arr) == '[object Array]';
            };

            var INSPECT_MAX_BYTES = 50;

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Use Object implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * Due to various browser bugs, sometimes the Object implementation will be used even
             * when the browser supports typed arrays.
             *
             * Note:
             *
             *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
             *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
             *
             *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
             *
             *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
             *     incorrect length in some situations.

             * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
             * get the Object implementation, which is slower but behaves correctly.
             */
            Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
              ? global$1.TYPED_ARRAY_SUPPORT
              : true;

            function kMaxLength () {
              return Buffer.TYPED_ARRAY_SUPPORT
                ? 0x7fffffff
                : 0x3fffffff
            }

            function createBuffer (that, length) {
              if (kMaxLength() < length) {
                throw new RangeError('Invalid typed array length')
              }
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                // Return an augmented `Uint8Array` instance, for best performance
                that = new Uint8Array(length);
                that.__proto__ = Buffer.prototype;
              } else {
                // Fallback: Return an object instance of the Buffer class
                if (that === null) {
                  that = new Buffer(length);
                }
                that.length = length;
              }

              return that
            }

            /**
             * The Buffer constructor returns instances of `Uint8Array` that have their
             * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
             * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
             * and the `Uint8Array` methods. Square bracket notation works as expected -- it
             * returns a single octet.
             *
             * The `Uint8Array` prototype remains unmodified.
             */

            function Buffer (arg, encodingOrOffset, length) {
              if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                return new Buffer(arg, encodingOrOffset, length)
              }

              // Common case.
              if (typeof arg === 'number') {
                if (typeof encodingOrOffset === 'string') {
                  throw new Error(
                    'If encoding is specified then the first argument must be a string'
                  )
                }
                return allocUnsafe(this, arg)
              }
              return from$1(this, arg, encodingOrOffset, length)
            }

            Buffer.poolSize = 8192; // not used by this implementation

            // TODO: Legacy, not needed anymore. Remove in next major version.
            Buffer._augment = function (arr) {
              arr.__proto__ = Buffer.prototype;
              return arr
            };

            function from$1 (that, value, encodingOrOffset, length) {
              if (typeof value === 'number') {
                throw new TypeError('"value" argument must not be a number')
              }

              if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
                return fromArrayBuffer(that, value, encodingOrOffset, length)
              }

              if (typeof value === 'string') {
                return fromString(that, value, encodingOrOffset)
              }

              return fromObject(that, value)
            }

            /**
             * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
             * if value is a number.
             * Buffer.from(str[, encoding])
             * Buffer.from(array)
             * Buffer.from(buffer)
             * Buffer.from(arrayBuffer[, byteOffset[, length]])
             **/
            Buffer.from = function (value, encodingOrOffset, length) {
              return from$1(null, value, encodingOrOffset, length)
            };

            if (Buffer.TYPED_ARRAY_SUPPORT) {
              Buffer.prototype.__proto__ = Uint8Array.prototype;
              Buffer.__proto__ = Uint8Array;
            }

            function assertSize (size) {
              if (typeof size !== 'number') {
                throw new TypeError('"size" argument must be a number')
              } else if (size < 0) {
                throw new RangeError('"size" argument must not be negative')
              }
            }

            function alloc (that, size, fill, encoding) {
              assertSize(size);
              if (size <= 0) {
                return createBuffer(that, size)
              }
              if (fill !== undefined) {
                // Only pay attention to encoding if it's a string. This
                // prevents accidentally sending in a number that would
                // be interpretted as a start offset.
                return typeof encoding === 'string'
                  ? createBuffer(that, size).fill(fill, encoding)
                  : createBuffer(that, size).fill(fill)
              }
              return createBuffer(that, size)
            }

            /**
             * Creates a new filled Buffer instance.
             * alloc(size[, fill[, encoding]])
             **/
            Buffer.alloc = function (size, fill, encoding) {
              return alloc(null, size, fill, encoding)
            };

            function allocUnsafe (that, size) {
              assertSize(size);
              that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
              if (!Buffer.TYPED_ARRAY_SUPPORT) {
                for (var i = 0; i < size; ++i) {
                  that[i] = 0;
                }
              }
              return that
            }

            /**
             * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
             * */
            Buffer.allocUnsafe = function (size) {
              return allocUnsafe(null, size)
            };
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
            Buffer.allocUnsafeSlow = function (size) {
              return allocUnsafe(null, size)
            };

            function fromString (that, string, encoding) {
              if (typeof encoding !== 'string' || encoding === '') {
                encoding = 'utf8';
              }

              if (!Buffer.isEncoding(encoding)) {
                throw new TypeError('"encoding" must be a valid string encoding')
              }

              var length = byteLength(string, encoding) | 0;
              that = createBuffer(that, length);

              var actual = that.write(string, encoding);

              if (actual !== length) {
                // Writing a hex string, for example, that contains invalid characters will
                // cause everything after the first invalid character to be ignored. (e.g.
                // 'abxxcd' will be treated as 'ab')
                that = that.slice(0, actual);
              }

              return that
            }

            function fromArrayLike (that, array) {
              var length = array.length < 0 ? 0 : checked(array.length) | 0;
              that = createBuffer(that, length);
              for (var i = 0; i < length; i += 1) {
                that[i] = array[i] & 255;
              }
              return that
            }

            function fromArrayBuffer (that, array, byteOffset, length) {
              array.byteLength; // this throws if `array` is not a valid ArrayBuffer

              if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError('\'offset\' is out of bounds')
              }

              if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError('\'length\' is out of bounds')
              }

              if (byteOffset === undefined && length === undefined) {
                array = new Uint8Array(array);
              } else if (length === undefined) {
                array = new Uint8Array(array, byteOffset);
              } else {
                array = new Uint8Array(array, byteOffset, length);
              }

              if (Buffer.TYPED_ARRAY_SUPPORT) {
                // Return an augmented `Uint8Array` instance, for best performance
                that = array;
                that.__proto__ = Buffer.prototype;
              } else {
                // Fallback: Return an object instance of the Buffer class
                that = fromArrayLike(that, array);
              }
              return that
            }

            function fromObject (that, obj) {
              if (internalIsBuffer(obj)) {
                var len = checked(obj.length) | 0;
                that = createBuffer(that, len);

                if (that.length === 0) {
                  return that
                }

                obj.copy(that, 0, 0, len);
                return that
              }

              if (obj) {
                if ((typeof ArrayBuffer !== 'undefined' &&
                    obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
                  if (typeof obj.length !== 'number' || isnan(obj.length)) {
                    return createBuffer(that, 0)
                  }
                  return fromArrayLike(that, obj)
                }

                if (obj.type === 'Buffer' && isArray(obj.data)) {
                  return fromArrayLike(that, obj.data)
                }
              }

              throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
            }

            function checked (length) {
              // Note: cannot use `length < kMaxLength()` here because that fails when
              // length is NaN (which is otherwise coerced to zero.)
              if (length >= kMaxLength()) {
                throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                                     'size: 0x' + kMaxLength().toString(16) + ' bytes')
              }
              return length | 0
            }
            Buffer.isBuffer = isBuffer;
            function internalIsBuffer (b) {
              return !!(b != null && b._isBuffer)
            }

            Buffer.compare = function compare (a, b) {
              if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
                throw new TypeError('Arguments must be Buffers')
              }

              if (a === b) return 0

              var x = a.length;
              var y = b.length;

              for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                  x = a[i];
                  y = b[i];
                  break
                }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
            };

            Buffer.isEncoding = function isEncoding (encoding) {
              switch (String(encoding).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'latin1':
                case 'binary':
                case 'base64':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return true
                default:
                  return false
              }
            };

            Buffer.concat = function concat (list, length) {
              if (!isArray(list)) {
                throw new TypeError('"list" argument must be an Array of Buffers')
              }

              if (list.length === 0) {
                return Buffer.alloc(0)
              }

              var i;
              if (length === undefined) {
                length = 0;
                for (i = 0; i < list.length; ++i) {
                  length += list[i].length;
                }
              }

              var buffer = Buffer.allocUnsafe(length);
              var pos = 0;
              for (i = 0; i < list.length; ++i) {
                var buf = list[i];
                if (!internalIsBuffer(buf)) {
                  throw new TypeError('"list" argument must be an Array of Buffers')
                }
                buf.copy(buffer, pos);
                pos += buf.length;
              }
              return buffer
            };

            function byteLength (string, encoding) {
              if (internalIsBuffer(string)) {
                return string.length
              }
              if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
                  (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
                return string.byteLength
              }
              if (typeof string !== 'string') {
                string = '' + string;
              }

              var len = string.length;
              if (len === 0) return 0

              // Use a for loop to avoid recursion
              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case 'ascii':
                  case 'latin1':
                  case 'binary':
                    return len
                  case 'utf8':
                  case 'utf-8':
                  case undefined:
                    return utf8ToBytes(string).length
                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return len * 2
                  case 'hex':
                    return len >>> 1
                  case 'base64':
                    return base64ToBytes(string).length
                  default:
                    if (loweredCase) return utf8ToBytes(string).length // assume utf8
                    encoding = ('' + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            }
            Buffer.byteLength = byteLength;

            function slowToString (encoding, start, end) {
              var loweredCase = false;

              // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
              // property of a typed array.

              // This behaves neither like String nor Uint8Array in that we set start/end
              // to their upper/lower bounds if the value passed is out of range.
              // undefined is handled specially as per ECMA-262 6th Edition,
              // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
              if (start === undefined || start < 0) {
                start = 0;
              }
              // Return early if start > this.length. Done here to prevent potential uint32
              // coercion fail below.
              if (start > this.length) {
                return ''
              }

              if (end === undefined || end > this.length) {
                end = this.length;
              }

              if (end <= 0) {
                return ''
              }

              // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
              end >>>= 0;
              start >>>= 0;

              if (end <= start) {
                return ''
              }

              if (!encoding) encoding = 'utf8';

              while (true) {
                switch (encoding) {
                  case 'hex':
                    return hexSlice(this, start, end)

                  case 'utf8':
                  case 'utf-8':
                    return utf8Slice(this, start, end)

                  case 'ascii':
                    return asciiSlice(this, start, end)

                  case 'latin1':
                  case 'binary':
                    return latin1Slice(this, start, end)

                  case 'base64':
                    return base64Slice(this, start, end)

                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return utf16leSlice(this, start, end)

                  default:
                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = (encoding + '').toLowerCase();
                    loweredCase = true;
                }
              }
            }

            // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
            // Buffer instances.
            Buffer.prototype._isBuffer = true;

            function swap (b, n, m) {
              var i = b[n];
              b[n] = b[m];
              b[m] = i;
            }

            Buffer.prototype.swap16 = function swap16 () {
              var len = this.length;
              if (len % 2 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 16-bits')
              }
              for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1);
              }
              return this
            };

            Buffer.prototype.swap32 = function swap32 () {
              var len = this.length;
              if (len % 4 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 32-bits')
              }
              for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3);
                swap(this, i + 1, i + 2);
              }
              return this
            };

            Buffer.prototype.swap64 = function swap64 () {
              var len = this.length;
              if (len % 8 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 64-bits')
              }
              for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7);
                swap(this, i + 1, i + 6);
                swap(this, i + 2, i + 5);
                swap(this, i + 3, i + 4);
              }
              return this
            };

            Buffer.prototype.toString = function toString () {
              var length = this.length | 0;
              if (length === 0) return ''
              if (arguments.length === 0) return utf8Slice(this, 0, length)
              return slowToString.apply(this, arguments)
            };

            Buffer.prototype.equals = function equals (b) {
              if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
              if (this === b) return true
              return Buffer.compare(this, b) === 0
            };

            Buffer.prototype.inspect = function inspect () {
              var str = '';
              var max = INSPECT_MAX_BYTES;
              if (this.length > 0) {
                str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
                if (this.length > max) str += ' ... ';
              }
              return '<Buffer ' + str + '>'
            };

            Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
              if (!internalIsBuffer(target)) {
                throw new TypeError('Argument must be a Buffer')
              }

              if (start === undefined) {
                start = 0;
              }
              if (end === undefined) {
                end = target ? target.length : 0;
              }
              if (thisStart === undefined) {
                thisStart = 0;
              }
              if (thisEnd === undefined) {
                thisEnd = this.length;
              }

              if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                throw new RangeError('out of range index')
              }

              if (thisStart >= thisEnd && start >= end) {
                return 0
              }
              if (thisStart >= thisEnd) {
                return -1
              }
              if (start >= end) {
                return 1
              }

              start >>>= 0;
              end >>>= 0;
              thisStart >>>= 0;
              thisEnd >>>= 0;

              if (this === target) return 0

              var x = thisEnd - thisStart;
              var y = end - start;
              var len = Math.min(x, y);

              var thisCopy = this.slice(thisStart, thisEnd);
              var targetCopy = target.slice(start, end);

              for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                  x = thisCopy[i];
                  y = targetCopy[i];
                  break
                }
              }

              if (x < y) return -1
              if (y < x) return 1
              return 0
            };

            // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
            // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
            //
            // Arguments:
            // - buffer - a Buffer to search
            // - val - a string, Buffer, or number
            // - byteOffset - an index into `buffer`; will be clamped to an int32
            // - encoding - an optional encoding, relevant is val is a string
            // - dir - true for indexOf, false for lastIndexOf
            function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
              // Empty buffer means no match
              if (buffer.length === 0) return -1

              // Normalize byteOffset
              if (typeof byteOffset === 'string') {
                encoding = byteOffset;
                byteOffset = 0;
              } else if (byteOffset > 0x7fffffff) {
                byteOffset = 0x7fffffff;
              } else if (byteOffset < -0x80000000) {
                byteOffset = -0x80000000;
              }
              byteOffset = +byteOffset;  // Coerce to Number.
              if (isNaN(byteOffset)) {
                // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                byteOffset = dir ? 0 : (buffer.length - 1);
              }

              // Normalize byteOffset: negative offsets start from the end of the buffer
              if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
              if (byteOffset >= buffer.length) {
                if (dir) return -1
                else byteOffset = buffer.length - 1;
              } else if (byteOffset < 0) {
                if (dir) byteOffset = 0;
                else return -1
              }

              // Normalize val
              if (typeof val === 'string') {
                val = Buffer.from(val, encoding);
              }

              // Finally, search either indexOf (if dir is true) or lastIndexOf
              if (internalIsBuffer(val)) {
                // Special case: looking for empty string/buffer always fails
                if (val.length === 0) {
                  return -1
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
              } else if (typeof val === 'number') {
                val = val & 0xFF; // Search for a byte value [0-255]
                if (Buffer.TYPED_ARRAY_SUPPORT &&
                    typeof Uint8Array.prototype.indexOf === 'function') {
                  if (dir) {
                    return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                  } else {
                    return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                  }
                }
                return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
              }

              throw new TypeError('val must be string, number or Buffer')
            }

            function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
              var indexSize = 1;
              var arrLength = arr.length;
              var valLength = val.length;

              if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase();
                if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                    encoding === 'utf16le' || encoding === 'utf-16le') {
                  if (arr.length < 2 || val.length < 2) {
                    return -1
                  }
                  indexSize = 2;
                  arrLength /= 2;
                  valLength /= 2;
                  byteOffset /= 2;
                }
              }

              function read$$1 (buf, i) {
                if (indexSize === 1) {
                  return buf[i]
                } else {
                  return buf.readUInt16BE(i * indexSize)
                }
              }

              var i;
              if (dir) {
                var foundIndex = -1;
                for (i = byteOffset; i < arrLength; i++) {
                  if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                    if (foundIndex === -1) foundIndex = i;
                    if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                  } else {
                    if (foundIndex !== -1) i -= i - foundIndex;
                    foundIndex = -1;
                  }
                }
              } else {
                if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
                for (i = byteOffset; i >= 0; i--) {
                  var found = true;
                  for (var j = 0; j < valLength; j++) {
                    if (read$$1(arr, i + j) !== read$$1(val, j)) {
                      found = false;
                      break
                    }
                  }
                  if (found) return i
                }
              }

              return -1
            }

            Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
              return this.indexOf(val, byteOffset, encoding) !== -1
            };

            Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
            };

            Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
              return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
            };

            function hexWrite (buf, string, offset, length) {
              offset = Number(offset) || 0;
              var remaining = buf.length - offset;
              if (!length) {
                length = remaining;
              } else {
                length = Number(length);
                if (length > remaining) {
                  length = remaining;
                }
              }

              // must be an even number of digits
              var strLen = string.length;
              if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

              if (length > strLen / 2) {
                length = strLen / 2;
              }
              for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16);
                if (isNaN(parsed)) return i
                buf[offset + i] = parsed;
              }
              return i
            }

            function utf8Write (buf, string, offset, length) {
              return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
            }

            function asciiWrite (buf, string, offset, length) {
              return blitBuffer(asciiToBytes(string), buf, offset, length)
            }

            function latin1Write (buf, string, offset, length) {
              return asciiWrite(buf, string, offset, length)
            }

            function base64Write (buf, string, offset, length) {
              return blitBuffer(base64ToBytes(string), buf, offset, length)
            }

            function ucs2Write (buf, string, offset, length) {
              return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
            }

            Buffer.prototype.write = function write$$1 (string, offset, length, encoding) {
              // Buffer#write(string)
              if (offset === undefined) {
                encoding = 'utf8';
                length = this.length;
                offset = 0;
              // Buffer#write(string, encoding)
              } else if (length === undefined && typeof offset === 'string') {
                encoding = offset;
                length = this.length;
                offset = 0;
              // Buffer#write(string, offset[, length][, encoding])
              } else if (isFinite(offset)) {
                offset = offset | 0;
                if (isFinite(length)) {
                  length = length | 0;
                  if (encoding === undefined) encoding = 'utf8';
                } else {
                  encoding = length;
                  length = undefined;
                }
              // legacy write(string, encoding, offset, length) - remove in v0.13
              } else {
                throw new Error(
                  'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                )
              }

              var remaining = this.length - offset;
              if (length === undefined || length > remaining) length = remaining;

              if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                throw new RangeError('Attempt to write outside buffer bounds')
              }

              if (!encoding) encoding = 'utf8';

              var loweredCase = false;
              for (;;) {
                switch (encoding) {
                  case 'hex':
                    return hexWrite(this, string, offset, length)

                  case 'utf8':
                  case 'utf-8':
                    return utf8Write(this, string, offset, length)

                  case 'ascii':
                    return asciiWrite(this, string, offset, length)

                  case 'latin1':
                  case 'binary':
                    return latin1Write(this, string, offset, length)

                  case 'base64':
                    // Warning: maxLength not taken into account in base64Write
                    return base64Write(this, string, offset, length)

                  case 'ucs2':
                  case 'ucs-2':
                  case 'utf16le':
                  case 'utf-16le':
                    return ucs2Write(this, string, offset, length)

                  default:
                    if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                    encoding = ('' + encoding).toLowerCase();
                    loweredCase = true;
                }
              }
            };

            Buffer.prototype.toJSON = function toJSON () {
              return {
                type: 'Buffer',
                data: Array.prototype.slice.call(this._arr || this, 0)
              }
            };

            function base64Slice (buf, start, end) {
              if (start === 0 && end === buf.length) {
                return fromByteArray(buf)
              } else {
                return fromByteArray(buf.slice(start, end))
              }
            }

            function utf8Slice (buf, start, end) {
              end = Math.min(buf.length, end);
              var res = [];

              var i = start;
              while (i < end) {
                var firstByte = buf[i];
                var codePoint = null;
                var bytesPerSequence = (firstByte > 0xEF) ? 4
                  : (firstByte > 0xDF) ? 3
                  : (firstByte > 0xBF) ? 2
                  : 1;

                if (i + bytesPerSequence <= end) {
                  var secondByte, thirdByte, fourthByte, tempCodePoint;

                  switch (bytesPerSequence) {
                    case 1:
                      if (firstByte < 0x80) {
                        codePoint = firstByte;
                      }
                      break
                    case 2:
                      secondByte = buf[i + 1];
                      if ((secondByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                        if (tempCodePoint > 0x7F) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break
                    case 3:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                        if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                          codePoint = tempCodePoint;
                        }
                      }
                      break
                    case 4:
                      secondByte = buf[i + 1];
                      thirdByte = buf[i + 2];
                      fourthByte = buf[i + 3];
                      if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                        tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                        if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                          codePoint = tempCodePoint;
                        }
                      }
                  }
                }

                if (codePoint === null) {
                  // we did not generate a valid codePoint so insert a
                  // replacement char (U+FFFD) and advance only 1 byte
                  codePoint = 0xFFFD;
                  bytesPerSequence = 1;
                } else if (codePoint > 0xFFFF) {
                  // encode to utf16 (surrogate pair dance)
                  codePoint -= 0x10000;
                  res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                  codePoint = 0xDC00 | codePoint & 0x3FF;
                }

                res.push(codePoint);
                i += bytesPerSequence;
              }

              return decodeCodePointsArray(res)
            }

            // Based on http://stackoverflow.com/a/22747272/680742, the browser with
            // the lowest limit is Chrome, with 0x10000 args.
            // We go 1 magnitude less, for safety
            var MAX_ARGUMENTS_LENGTH = 0x1000;

            function decodeCodePointsArray (codePoints) {
              var len = codePoints.length;
              if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
              }

              // Decode in chunks to avoid "call stack size exceeded".
              var res = '';
              var i = 0;
              while (i < len) {
                res += String.fromCharCode.apply(
                  String,
                  codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                );
              }
              return res
            }

            function asciiSlice (buf, start, end) {
              var ret = '';
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 0x7F);
              }
              return ret
            }

            function latin1Slice (buf, start, end) {
              var ret = '';
              end = Math.min(buf.length, end);

              for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i]);
              }
              return ret
            }

            function hexSlice (buf, start, end) {
              var len = buf.length;

              if (!start || start < 0) start = 0;
              if (!end || end < 0 || end > len) end = len;

              var out = '';
              for (var i = start; i < end; ++i) {
                out += toHex(buf[i]);
              }
              return out
            }

            function utf16leSlice (buf, start, end) {
              var bytes = buf.slice(start, end);
              var res = '';
              for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
              }
              return res
            }

            Buffer.prototype.slice = function slice (start, end) {
              var len = this.length;
              start = ~~start;
              end = end === undefined ? len : ~~end;

              if (start < 0) {
                start += len;
                if (start < 0) start = 0;
              } else if (start > len) {
                start = len;
              }

              if (end < 0) {
                end += len;
                if (end < 0) end = 0;
              } else if (end > len) {
                end = len;
              }

              if (end < start) end = start;

              var newBuf;
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                newBuf = this.subarray(start, end);
                newBuf.__proto__ = Buffer.prototype;
              } else {
                var sliceLen = end - start;
                newBuf = new Buffer(sliceLen, undefined);
                for (var i = 0; i < sliceLen; ++i) {
                  newBuf[i] = this[i + start];
                }
              }

              return newBuf
            };

            /*
             * Need to make sure that buffer isn't trying to write out of bounds.
             */
            function checkOffset (offset, ext, length) {
              if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
              if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
            }

            Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }

              return val
            };

            Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                checkOffset(offset, byteLength, this.length);
              }

              var val = this[offset + --byteLength];
              var mul = 1;
              while (byteLength > 0 && (mul *= 0x100)) {
                val += this[offset + --byteLength] * mul;
              }

              return val
            };

            Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length);
              return this[offset]
            };

            Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              return this[offset] | (this[offset + 1] << 8)
            };

            Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              return (this[offset] << 8) | this[offset + 1]
            };

            Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return ((this[offset]) |
                  (this[offset + 1] << 8) |
                  (this[offset + 2] << 16)) +
                  (this[offset + 3] * 0x1000000)
            };

            Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset] * 0x1000000) +
                ((this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3])
            };

            Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var val = this[offset];
              var mul = 1;
              var i = 0;
              while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val
            };

            Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) checkOffset(offset, byteLength, this.length);

              var i = byteLength;
              var mul = 1;
              var val = this[offset + --i];
              while (i > 0 && (mul *= 0x100)) {
                val += this[offset + --i] * mul;
              }
              mul *= 0x80;

              if (val >= mul) val -= Math.pow(2, 8 * byteLength);

              return val
            };

            Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 1, this.length);
              if (!(this[offset] & 0x80)) return (this[offset])
              return ((0xff - this[offset] + 1) * -1)
            };

            Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset] | (this[offset + 1] << 8);
              return (val & 0x8000) ? val | 0xFFFF0000 : val
            };

            Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 2, this.length);
              var val = this[offset + 1] | (this[offset] << 8);
              return (val & 0x8000) ? val | 0xFFFF0000 : val
            };

            Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset]) |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
            };

            Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);

              return (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                (this[offset + 3])
            };

            Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);
              return read(this, offset, true, 23, 4)
            };

            Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 4, this.length);
              return read(this, offset, false, 23, 4)
            };

            Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 8, this.length);
              return read(this, offset, true, 52, 8)
            };

            Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
              if (!noAssert) checkOffset(offset, 8, this.length);
              return read(this, offset, false, 52, 8)
            };

            function checkInt (buf, value, offset, ext, max, min) {
              if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
              if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
            }

            Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var mul = 1;
              var i = 0;
              this[offset] = value & 0xFF;
              while (++i < byteLength && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              byteLength = byteLength | 0;
              if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
              }

              var i = byteLength - 1;
              var mul = 1;
              this[offset + i] = value & 0xFF;
              while (--i >= 0 && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
              this[offset] = (value & 0xff);
              return offset + 1
            };

            function objectWriteUInt16 (buf, value, offset, littleEndian) {
              if (value < 0) value = 0xffff + value + 1;
              for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
                buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
                  (littleEndian ? i : 1 - i) * 8;
              }
            }

            Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
              } else {
                objectWriteUInt16(this, value, offset, true);
              }
              return offset + 2
            };

            Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 8);
                this[offset + 1] = (value & 0xff);
              } else {
                objectWriteUInt16(this, value, offset, false);
              }
              return offset + 2
            };

            function objectWriteUInt32 (buf, value, offset, littleEndian) {
              if (value < 0) value = 0xffffffff + value + 1;
              for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
                buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
              }
            }

            Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset + 3] = (value >>> 24);
                this[offset + 2] = (value >>> 16);
                this[offset + 1] = (value >>> 8);
                this[offset] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, true);
              }
              return offset + 4
            };

            Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 24);
                this[offset + 1] = (value >>> 16);
                this[offset + 2] = (value >>> 8);
                this[offset + 3] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, false);
              }
              return offset + 4
            };

            Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = 0;
              var mul = 1;
              var sub = 0;
              this[offset] = value & 0xFF;
              while (++i < byteLength && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);

                checkInt(this, value, offset, byteLength, limit - 1, -limit);
              }

              var i = byteLength - 1;
              var mul = 1;
              var sub = 0;
              this[offset + i] = value & 0xFF;
              while (--i >= 0 && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                  sub = 1;
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
              }

              return offset + byteLength
            };

            Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
              if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
              if (value < 0) value = 0xff + value + 1;
              this[offset] = (value & 0xff);
              return offset + 1
            };

            Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
              } else {
                objectWriteUInt16(this, value, offset, true);
              }
              return offset + 2
            };

            Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 8);
                this[offset + 1] = (value & 0xff);
              } else {
                objectWriteUInt16(this, value, offset, false);
              }
              return offset + 2
            };

            Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value & 0xff);
                this[offset + 1] = (value >>> 8);
                this[offset + 2] = (value >>> 16);
                this[offset + 3] = (value >>> 24);
              } else {
                objectWriteUInt32(this, value, offset, true);
              }
              return offset + 4
            };

            Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
              value = +value;
              offset = offset | 0;
              if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
              if (value < 0) value = 0xffffffff + value + 1;
              if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = (value >>> 24);
                this[offset + 1] = (value >>> 16);
                this[offset + 2] = (value >>> 8);
                this[offset + 3] = (value & 0xff);
              } else {
                objectWriteUInt32(this, value, offset, false);
              }
              return offset + 4
            };

            function checkIEEE754 (buf, value, offset, ext, max, min) {
              if (offset + ext > buf.length) throw new RangeError('Index out of range')
              if (offset < 0) throw new RangeError('Index out of range')
            }

            function writeFloat (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
              }
              write(buf, value, offset, littleEndian, 23, 4);
              return offset + 4
            }

            Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
              return writeFloat(this, value, offset, true, noAssert)
            };

            Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
              return writeFloat(this, value, offset, false, noAssert)
            };

            function writeDouble (buf, value, offset, littleEndian, noAssert) {
              if (!noAssert) {
                checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
              }
              write(buf, value, offset, littleEndian, 52, 8);
              return offset + 8
            }

            Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
              return writeDouble(this, value, offset, true, noAssert)
            };

            Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
              return writeDouble(this, value, offset, false, noAssert)
            };

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function copy (target, targetStart, start, end) {
              if (!start) start = 0;
              if (!end && end !== 0) end = this.length;
              if (targetStart >= target.length) targetStart = target.length;
              if (!targetStart) targetStart = 0;
              if (end > 0 && end < start) end = start;

              // Copy 0 bytes; we're done
              if (end === start) return 0
              if (target.length === 0 || this.length === 0) return 0

              // Fatal error conditions
              if (targetStart < 0) {
                throw new RangeError('targetStart out of bounds')
              }
              if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
              if (end < 0) throw new RangeError('sourceEnd out of bounds')

              // Are we oob?
              if (end > this.length) end = this.length;
              if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start;
              }

              var len = end - start;
              var i;

              if (this === target && start < targetStart && targetStart < end) {
                // descending copy from end
                for (i = len - 1; i >= 0; --i) {
                  target[i + targetStart] = this[i + start];
                }
              } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
                // ascending copy from start
                for (i = 0; i < len; ++i) {
                  target[i + targetStart] = this[i + start];
                }
              } else {
                Uint8Array.prototype.set.call(
                  target,
                  this.subarray(start, start + len),
                  targetStart
                );
              }

              return len
            };

            // Usage:
            //    buffer.fill(number[, offset[, end]])
            //    buffer.fill(buffer[, offset[, end]])
            //    buffer.fill(string[, offset[, end]][, encoding])
            Buffer.prototype.fill = function fill (val, start, end, encoding) {
              // Handle string cases:
              if (typeof val === 'string') {
                if (typeof start === 'string') {
                  encoding = start;
                  start = 0;
                  end = this.length;
                } else if (typeof end === 'string') {
                  encoding = end;
                  end = this.length;
                }
                if (val.length === 1) {
                  var code = val.charCodeAt(0);
                  if (code < 256) {
                    val = code;
                  }
                }
                if (encoding !== undefined && typeof encoding !== 'string') {
                  throw new TypeError('encoding must be a string')
                }
                if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                  throw new TypeError('Unknown encoding: ' + encoding)
                }
              } else if (typeof val === 'number') {
                val = val & 255;
              }

              // Invalid ranges are not set to a default, so can range check early.
              if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError('Out of range index')
              }

              if (end <= start) {
                return this
              }

              start = start >>> 0;
              end = end === undefined ? this.length : end >>> 0;

              if (!val) val = 0;

              var i;
              if (typeof val === 'number') {
                for (i = start; i < end; ++i) {
                  this[i] = val;
                }
              } else {
                var bytes = internalIsBuffer(val)
                  ? val
                  : utf8ToBytes(new Buffer(val, encoding).toString());
                var len = bytes.length;
                for (i = 0; i < end - start; ++i) {
                  this[i + start] = bytes[i % len];
                }
              }

              return this
            };

            // HELPER FUNCTIONS
            // ================

            var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

            function base64clean (str) {
              // Node strips out invalid characters like \n and \t from the string, base64-js does not
              str = stringtrim(str).replace(INVALID_BASE64_RE, '');
              // Node converts strings with length < 2 to ''
              if (str.length < 2) return ''
              // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
              while (str.length % 4 !== 0) {
                str = str + '=';
              }
              return str
            }

            function stringtrim (str) {
              if (str.trim) return str.trim()
              return str.replace(/^\s+|\s+$/g, '')
            }

            function toHex (n) {
              if (n < 16) return '0' + n.toString(16)
              return n.toString(16)
            }

            function utf8ToBytes (string, units) {
              units = units || Infinity;
              var codePoint;
              var length = string.length;
              var leadSurrogate = null;
              var bytes = [];

              for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i);

                // is surrogate component
                if (codePoint > 0xD7FF && codePoint < 0xE000) {
                  // last char was a lead
                  if (!leadSurrogate) {
                    // no lead yet
                    if (codePoint > 0xDBFF) {
                      // unexpected trail
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                      continue
                    } else if (i + 1 === length) {
                      // unpaired lead
                      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                      continue
                    }

                    // valid lead
                    leadSurrogate = codePoint;

                    continue
                  }

                  // 2 leads in a row
                  if (codePoint < 0xDC00) {
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    leadSurrogate = codePoint;
                    continue
                  }

                  // valid surrogate pair
                  codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
                } else if (leadSurrogate) {
                  // valid bmp char, but last char was a lead
                  if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                }

                leadSurrogate = null;

                // encode utf8
                if (codePoint < 0x80) {
                  if ((units -= 1) < 0) break
                  bytes.push(codePoint);
                } else if (codePoint < 0x800) {
                  if ((units -= 2) < 0) break
                  bytes.push(
                    codePoint >> 0x6 | 0xC0,
                    codePoint & 0x3F | 0x80
                  );
                } else if (codePoint < 0x10000) {
                  if ((units -= 3) < 0) break
                  bytes.push(
                    codePoint >> 0xC | 0xE0,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                  );
                } else if (codePoint < 0x110000) {
                  if ((units -= 4) < 0) break
                  bytes.push(
                    codePoint >> 0x12 | 0xF0,
                    codePoint >> 0xC & 0x3F | 0x80,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                  );
                } else {
                  throw new Error('Invalid code point')
                }
              }

              return bytes
            }

            function asciiToBytes (str) {
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xFF);
              }
              return byteArray
            }

            function utf16leToBytes (str, units) {
              var c, hi, lo;
              var byteArray = [];
              for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break

                c = str.charCodeAt(i);
                hi = c >> 8;
                lo = c % 256;
                byteArray.push(lo);
                byteArray.push(hi);
              }

              return byteArray
            }


            function base64ToBytes (str) {
              return toByteArray(base64clean(str))
            }

            function blitBuffer (src, dst, offset, length) {
              for (var i = 0; i < length; ++i) {
                if ((i + offset >= dst.length) || (i >= src.length)) break
                dst[i + offset] = src[i];
              }
              return i
            }

            function isnan (val) {
              return val !== val // eslint-disable-line no-self-compare
            }


            // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
            // The _isBuffer check is for Safari 5-7 support, because it's missing
            // Object.prototype.constructor. Remove this eventually
            function isBuffer(obj) {
              return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
            }

            function isFastBuffer (obj) {
              return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
            }

            // For Node v0.10 support. Remove this eventually.
            function isSlowBuffer (obj) {
              return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
            }

            var inherits;
            if (typeof Object.create === 'function'){
              inherits = function inherits(ctor, superCtor) {
                // implementation from standard node.js 'util' module
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                  constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                  }
                });
              };
            } else {
              inherits = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function () {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
              };
            }
            var inherits$1 = inherits;

            var formatRegExp = /%[sdj%]/g;
            function format(f) {
              if (!isString(f)) {
                var objects = [];
                for (var i = 0; i < arguments.length; i++) {
                  objects.push(inspect(arguments[i]));
                }
                return objects.join(' ');
              }

              var i = 1;
              var args = arguments;
              var len = args.length;
              var str = String(f).replace(formatRegExp, function(x) {
                if (x === '%%') return '%';
                if (i >= len) return x;
                switch (x) {
                  case '%s': return String(args[i++]);
                  case '%d': return Number(args[i++]);
                  case '%j':
                    try {
                      return JSON.stringify(args[i++]);
                    } catch (_) {
                      return '[Circular]';
                    }
                  default:
                    return x;
                }
              });
              for (var x = args[i]; i < len; x = args[++i]) {
                if (isNull(x) || !isObject(x)) {
                  str += ' ' + x;
                } else {
                  str += ' ' + inspect(x);
                }
              }
              return str;
            }

            // Mark that a method should not be used.
            // Returns a modified function which warns once by default.
            // If --no-deprecation is set, then it is a no-op.
            function deprecate(fn, msg) {
              // Allow for deprecating things in the process of starting up.
              if (isUndefined(global$1.process)) {
                return function() {
                  return deprecate(fn, msg).apply(this, arguments);
                };
              }

              if (process.noDeprecation === true) {
                return fn;
              }

              var warned = false;
              function deprecated() {
                if (!warned) {
                  if (process.throwDeprecation) {
                    throw new Error(msg);
                  } else if (process.traceDeprecation) {
                    console.trace(msg);
                  } else {
                    console.error(msg);
                  }
                  warned = true;
                }
                return fn.apply(this, arguments);
              }

              return deprecated;
            }

            var debugs = {};
            var debugEnviron;
            function debuglog(set) {
              if (isUndefined(debugEnviron))
                debugEnviron = process.env.NODE_DEBUG || '';
              set = set.toUpperCase();
              if (!debugs[set]) {
                if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                  var pid = 0;
                  debugs[set] = function() {
                    var msg = format.apply(null, arguments);
                    console.error('%s %d: %s', set, pid, msg);
                  };
                } else {
                  debugs[set] = function() {};
                }
              }
              return debugs[set];
            }

            /**
             * Echos the value of a value. Trys to print the value out
             * in the best way possible given the different types.
             *
             * @param {Object} obj The object to print out.
             * @param {Object} opts Optional options object that alters the output.
             */
            /* legacy: obj, showHidden, depth, colors*/
            function inspect(obj, opts) {
              // default options
              var ctx = {
                seen: [],
                stylize: stylizeNoColor
              };
              // legacy...
              if (arguments.length >= 3) ctx.depth = arguments[2];
              if (arguments.length >= 4) ctx.colors = arguments[3];
              if (isBoolean(opts)) {
                // legacy...
                ctx.showHidden = opts;
              } else if (opts) {
                // got an "options" object
                _extend(ctx, opts);
              }
              // set default options
              if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
              if (isUndefined(ctx.depth)) ctx.depth = 2;
              if (isUndefined(ctx.colors)) ctx.colors = false;
              if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
              if (ctx.colors) ctx.stylize = stylizeWithColor;
              return formatValue(ctx, obj, ctx.depth);
            }

            // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
            inspect.colors = {
              'bold' : [1, 22],
              'italic' : [3, 23],
              'underline' : [4, 24],
              'inverse' : [7, 27],
              'white' : [37, 39],
              'grey' : [90, 39],
              'black' : [30, 39],
              'blue' : [34, 39],
              'cyan' : [36, 39],
              'green' : [32, 39],
              'magenta' : [35, 39],
              'red' : [31, 39],
              'yellow' : [33, 39]
            };

            // Don't use 'blue' not visible on cmd.exe
            inspect.styles = {
              'special': 'cyan',
              'number': 'yellow',
              'boolean': 'yellow',
              'undefined': 'grey',
              'null': 'bold',
              'string': 'green',
              'date': 'magenta',
              // "name": intentionally not styling
              'regexp': 'red'
            };


            function stylizeWithColor(str, styleType) {
              var style = inspect.styles[styleType];

              if (style) {
                return '\u001b[' + inspect.colors[style][0] + 'm' + str +
                       '\u001b[' + inspect.colors[style][1] + 'm';
              } else {
                return str;
              }
            }


            function stylizeNoColor(str, styleType) {
              return str;
            }


            function arrayToHash(array) {
              var hash = {};

              array.forEach(function(val, idx) {
                hash[val] = true;
              });

              return hash;
            }


            function formatValue(ctx, value, recurseTimes) {
              // Provide a hook for user-specified inspect functions.
              // Check that value is an object with an inspect function on it
              if (ctx.customInspect &&
                  value &&
                  isFunction(value.inspect) &&
                  // Filter out the util module, it's inspect function is special
                  value.inspect !== inspect &&
                  // Also filter out any prototype objects using the circular check.
                  !(value.constructor && value.constructor.prototype === value)) {
                var ret = value.inspect(recurseTimes, ctx);
                if (!isString(ret)) {
                  ret = formatValue(ctx, ret, recurseTimes);
                }
                return ret;
              }

              // Primitive types cannot have properties
              var primitive = formatPrimitive(ctx, value);
              if (primitive) {
                return primitive;
              }

              // Look up the keys of the object.
              var keys = Object.keys(value);
              var visibleKeys = arrayToHash(keys);

              if (ctx.showHidden) {
                keys = Object.getOwnPropertyNames(value);
              }

              // IE doesn't make error fields non-enumerable
              // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
              if (isError(value)
                  && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
                return formatError(value);
              }

              // Some type of object without properties can be shortcutted.
              if (keys.length === 0) {
                if (isFunction(value)) {
                  var name = value.name ? ': ' + value.name : '';
                  return ctx.stylize('[Function' + name + ']', 'special');
                }
                if (isRegExp(value)) {
                  return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                }
                if (isDate(value)) {
                  return ctx.stylize(Date.prototype.toString.call(value), 'date');
                }
                if (isError(value)) {
                  return formatError(value);
                }
              }

              var base = '', array = false, braces = ['{', '}'];

              // Make Array say that they are Array
              if (isArray$1(value)) {
                array = true;
                braces = ['[', ']'];
              }

              // Make functions say that they are functions
              if (isFunction(value)) {
                var n = value.name ? ': ' + value.name : '';
                base = ' [Function' + n + ']';
              }

              // Make RegExps say that they are RegExps
              if (isRegExp(value)) {
                base = ' ' + RegExp.prototype.toString.call(value);
              }

              // Make dates with properties first say the date
              if (isDate(value)) {
                base = ' ' + Date.prototype.toUTCString.call(value);
              }

              // Make error with message first say the error
              if (isError(value)) {
                base = ' ' + formatError(value);
              }

              if (keys.length === 0 && (!array || value.length == 0)) {
                return braces[0] + base + braces[1];
              }

              if (recurseTimes < 0) {
                if (isRegExp(value)) {
                  return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                } else {
                  return ctx.stylize('[Object]', 'special');
                }
              }

              ctx.seen.push(value);

              var output;
              if (array) {
                output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
              } else {
                output = keys.map(function(key) {
                  return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                });
              }

              ctx.seen.pop();

              return reduceToSingleString(output, base, braces);
            }


            function formatPrimitive(ctx, value) {
              if (isUndefined(value))
                return ctx.stylize('undefined', 'undefined');
              if (isString(value)) {
                var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                         .replace(/'/g, "\\'")
                                                         .replace(/\\"/g, '"') + '\'';
                return ctx.stylize(simple, 'string');
              }
              if (isNumber(value))
                return ctx.stylize('' + value, 'number');
              if (isBoolean(value))
                return ctx.stylize('' + value, 'boolean');
              // For some reason typeof null is "object", so special case here.
              if (isNull(value))
                return ctx.stylize('null', 'null');
            }


            function formatError(value) {
              return '[' + Error.prototype.toString.call(value) + ']';
            }


            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
              var output = [];
              for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwnProperty(value, String(i))) {
                  output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                      String(i), true));
                } else {
                  output.push('');
                }
              }
              keys.forEach(function(key) {
                if (!key.match(/^\d+$/)) {
                  output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
                      key, true));
                }
              });
              return output;
            }


            function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
              var name, str, desc;
              desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
              if (desc.get) {
                if (desc.set) {
                  str = ctx.stylize('[Getter/Setter]', 'special');
                } else {
                  str = ctx.stylize('[Getter]', 'special');
                }
              } else {
                if (desc.set) {
                  str = ctx.stylize('[Setter]', 'special');
                }
              }
              if (!hasOwnProperty(visibleKeys, key)) {
                name = '[' + key + ']';
              }
              if (!str) {
                if (ctx.seen.indexOf(desc.value) < 0) {
                  if (isNull(recurseTimes)) {
                    str = formatValue(ctx, desc.value, null);
                  } else {
                    str = formatValue(ctx, desc.value, recurseTimes - 1);
                  }
                  if (str.indexOf('\n') > -1) {
                    if (array) {
                      str = str.split('\n').map(function(line) {
                        return '  ' + line;
                      }).join('\n').substr(2);
                    } else {
                      str = '\n' + str.split('\n').map(function(line) {
                        return '   ' + line;
                      }).join('\n');
                    }
                  }
                } else {
                  str = ctx.stylize('[Circular]', 'special');
                }
              }
              if (isUndefined(name)) {
                if (array && key.match(/^\d+$/)) {
                  return str;
                }
                name = JSON.stringify('' + key);
                if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                  name = name.substr(1, name.length - 2);
                  name = ctx.stylize(name, 'name');
                } else {
                  name = name.replace(/'/g, "\\'")
                             .replace(/\\"/g, '"')
                             .replace(/(^"|"$)/g, "'");
                  name = ctx.stylize(name, 'string');
                }
              }

              return name + ': ' + str;
            }


            function reduceToSingleString(output, base, braces) {
              var length = output.reduce(function(prev, cur) {
                if (cur.indexOf('\n') >= 0) ;
                return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
              }, 0);

              if (length > 60) {
                return braces[0] +
                       (base === '' ? '' : base + '\n ') +
                       ' ' +
                       output.join(',\n  ') +
                       ' ' +
                       braces[1];
              }

              return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
            }


            // NOTE: These type checking functions intentionally don't use `instanceof`
            // because it is fragile and can be easily faked with `Object.create()`.
            function isArray$1(ar) {
              return Array.isArray(ar);
            }

            function isBoolean(arg) {
              return typeof arg === 'boolean';
            }

            function isNull(arg) {
              return arg === null;
            }

            function isNullOrUndefined(arg) {
              return arg == null;
            }

            function isNumber(arg) {
              return typeof arg === 'number';
            }

            function isString(arg) {
              return typeof arg === 'string';
            }

            function isSymbol(arg) {
              return typeof arg === 'symbol';
            }

            function isUndefined(arg) {
              return arg === void 0;
            }

            function isRegExp(re) {
              return isObject(re) && objectToString(re) === '[object RegExp]';
            }

            function isObject(arg) {
              return typeof arg === 'object' && arg !== null;
            }

            function isDate(d) {
              return isObject(d) && objectToString(d) === '[object Date]';
            }

            function isError(e) {
              return isObject(e) &&
                  (objectToString(e) === '[object Error]' || e instanceof Error);
            }

            function isFunction(arg) {
              return typeof arg === 'function';
            }

            function isPrimitive(arg) {
              return arg === null ||
                     typeof arg === 'boolean' ||
                     typeof arg === 'number' ||
                     typeof arg === 'string' ||
                     typeof arg === 'symbol' ||  // ES6 symbol
                     typeof arg === 'undefined';
            }

            function isBuffer$1(maybeBuf) {
              return isBuffer(maybeBuf);
            }

            function objectToString(o) {
              return Object.prototype.toString.call(o);
            }


            function pad(n) {
              return n < 10 ? '0' + n.toString(10) : n.toString(10);
            }


            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                          'Oct', 'Nov', 'Dec'];

            // 26 Feb 16:19:34
            function timestamp() {
              var d = new Date();
              var time = [pad(d.getHours()),
                          pad(d.getMinutes()),
                          pad(d.getSeconds())].join(':');
              return [d.getDate(), months[d.getMonth()], time].join(' ');
            }


            // log is just a thin wrapper to console.log that prepends a timestamp
            function log() {
              console.log('%s - %s', timestamp(), format.apply(null, arguments));
            }

            function _extend(origin, add) {
              // Don't do anything if add isn't an object
              if (!add || !isObject(add)) return origin;

              var keys = Object.keys(add);
              var i = keys.length;
              while (i--) {
                origin[keys[i]] = add[keys[i]];
              }
              return origin;
            }
            function hasOwnProperty(obj, prop) {
              return Object.prototype.hasOwnProperty.call(obj, prop);
            }

            var util = {
              inherits: inherits$1,
              _extend: _extend,
              log: log,
              isBuffer: isBuffer$1,
              isPrimitive: isPrimitive,
              isFunction: isFunction,
              isError: isError,
              isDate: isDate,
              isObject: isObject,
              isRegExp: isRegExp,
              isUndefined: isUndefined,
              isSymbol: isSymbol,
              isString: isString,
              isNumber: isNumber,
              isNullOrUndefined: isNullOrUndefined,
              isNull: isNull,
              isBoolean: isBoolean,
              isArray: isArray$1,
              inspect: inspect,
              deprecate: deprecate,
              format: format,
              debuglog: debuglog
            }

            var util$1 = /*#__PURE__*/Object.freeze({
                        format: format,
                        deprecate: deprecate,
                        debuglog: debuglog,
                        inspect: inspect,
                        isArray: isArray$1,
                        isBoolean: isBoolean,
                        isNull: isNull,
                        isNullOrUndefined: isNullOrUndefined,
                        isNumber: isNumber,
                        isString: isString,
                        isSymbol: isSymbol,
                        isUndefined: isUndefined,
                        isRegExp: isRegExp,
                        isObject: isObject,
                        isDate: isDate,
                        isError: isError,
                        isFunction: isFunction,
                        isPrimitive: isPrimitive,
                        isBuffer: isBuffer$1,
                        log: log,
                        inherits: inherits$1,
                        _extend: _extend,
                        default: util
            });

            var domain;

            // This constructor is used to store event handlers. Instantiating this is
            // faster than explicitly calling `Object.create(null)` to get a "clean" empty
            // object (tested with v8 v4.9).
            function EventHandlers() {}
            EventHandlers.prototype = Object.create(null);

            function EventEmitter() {
              EventEmitter.init.call(this);
            }

            // nodejs oddity
            // require('events') === require('events').EventEmitter
            EventEmitter.EventEmitter = EventEmitter;

            EventEmitter.usingDomains = false;

            EventEmitter.prototype.domain = undefined;
            EventEmitter.prototype._events = undefined;
            EventEmitter.prototype._maxListeners = undefined;

            // By default EventEmitters will print a warning if more than 10 listeners are
            // added to it. This is a useful default which helps finding memory leaks.
            EventEmitter.defaultMaxListeners = 10;

            EventEmitter.init = function() {
              this.domain = null;
              if (EventEmitter.usingDomains) {
                // if there is an active domain, then attach to it.
                if (domain.active && !(this instanceof domain.Domain)) {
                  this.domain = domain.active;
                }
              }

              if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
                this._events = new EventHandlers();
                this._eventsCount = 0;
              }

              this._maxListeners = this._maxListeners || undefined;
            };

            // Obviously not all Emitters should be limited to 10. This function allows
            // that to be increased. Set to zero for unlimited.
            EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
              if (typeof n !== 'number' || n < 0 || isNaN(n))
                throw new TypeError('"n" argument must be a positive number');
              this._maxListeners = n;
              return this;
            };

            function $getMaxListeners(that) {
              if (that._maxListeners === undefined)
                return EventEmitter.defaultMaxListeners;
              return that._maxListeners;
            }

            EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
              return $getMaxListeners(this);
            };

            // These standalone emit* functions are used to optimize calling of event
            // handlers for fast cases because emit() itself often has a variable number of
            // arguments and can be deoptimized because of that. These functions always have
            // the same number of arguments and thus do not get deoptimized, so the code
            // inside them can execute faster.
            function emitNone(handler, isFn, self) {
              if (isFn)
                handler.call(self);
              else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                  listeners[i].call(self);
              }
            }
            function emitOne(handler, isFn, self, arg1) {
              if (isFn)
                handler.call(self, arg1);
              else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                  listeners[i].call(self, arg1);
              }
            }
            function emitTwo(handler, isFn, self, arg1, arg2) {
              if (isFn)
                handler.call(self, arg1, arg2);
              else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                  listeners[i].call(self, arg1, arg2);
              }
            }
            function emitThree(handler, isFn, self, arg1, arg2, arg3) {
              if (isFn)
                handler.call(self, arg1, arg2, arg3);
              else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                  listeners[i].call(self, arg1, arg2, arg3);
              }
            }

            function emitMany(handler, isFn, self, args) {
              if (isFn)
                handler.apply(self, args);
              else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                  listeners[i].apply(self, args);
              }
            }

            EventEmitter.prototype.emit = function emit(type) {
              var er, handler, len, args, i, events, domain;
              var needDomainExit = false;
              var doError = (type === 'error');

              events = this._events;
              if (events)
                doError = (doError && events.error == null);
              else if (!doError)
                return false;

              domain = this.domain;

              // If there is no 'error' event listener then throw.
              if (doError) {
                er = arguments[1];
                if (domain) {
                  if (!er)
                    er = new Error('Uncaught, unspecified "error" event');
                  er.domainEmitter = this;
                  er.domain = domain;
                  er.domainThrown = false;
                  domain.emit('error', er);
                } else if (er instanceof Error) {
                  throw er; // Unhandled 'error' event
                } else {
                  // At least give some kind of context to the user
                  var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
                  err.context = er;
                  throw err;
                }
                return false;
              }

              handler = events[type];

              if (!handler)
                return false;

              var isFn = typeof handler === 'function';
              len = arguments.length;
              switch (len) {
                // fast cases
                case 1:
                  emitNone(handler, isFn, this);
                  break;
                case 2:
                  emitOne(handler, isFn, this, arguments[1]);
                  break;
                case 3:
                  emitTwo(handler, isFn, this, arguments[1], arguments[2]);
                  break;
                case 4:
                  emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
                  break;
                // slower
                default:
                  args = new Array(len - 1);
                  for (i = 1; i < len; i++)
                    args[i - 1] = arguments[i];
                  emitMany(handler, isFn, this, args);
              }

              if (needDomainExit)
                domain.exit();

              return true;
            };

            function _addListener(target, type, listener, prepend) {
              var m;
              var events;
              var existing;

              if (typeof listener !== 'function')
                throw new TypeError('"listener" argument must be a function');

              events = target._events;
              if (!events) {
                events = target._events = new EventHandlers();
                target._eventsCount = 0;
              } else {
                // To avoid recursion in the case that type === "newListener"! Before
                // adding it to the listeners, first emit "newListener".
                if (events.newListener) {
                  target.emit('newListener', type,
                              listener.listener ? listener.listener : listener);

                  // Re-assign `events` because a newListener handler could have caused the
                  // this._events to be assigned to a new object
                  events = target._events;
                }
                existing = events[type];
              }

              if (!existing) {
                // Optimize the case of one listener. Don't need the extra array object.
                existing = events[type] = listener;
                ++target._eventsCount;
              } else {
                if (typeof existing === 'function') {
                  // Adding the second element, need to change to array.
                  existing = events[type] = prepend ? [listener, existing] :
                                                      [existing, listener];
                } else {
                  // If we've already got an array, just append.
                  if (prepend) {
                    existing.unshift(listener);
                  } else {
                    existing.push(listener);
                  }
                }

                // Check for listener leak
                if (!existing.warned) {
                  m = $getMaxListeners(target);
                  if (m && m > 0 && existing.length > m) {
                    existing.warned = true;
                    var w = new Error('Possible EventEmitter memory leak detected. ' +
                                        existing.length + ' ' + type + ' listeners added. ' +
                                        'Use emitter.setMaxListeners() to increase limit');
                    w.name = 'MaxListenersExceededWarning';
                    w.emitter = target;
                    w.type = type;
                    w.count = existing.length;
                    emitWarning(w);
                  }
                }
              }

              return target;
            }
            function emitWarning(e) {
              typeof console.warn === 'function' ? console.warn(e) : console.log(e);
            }
            EventEmitter.prototype.addListener = function addListener(type, listener) {
              return _addListener(this, type, listener, false);
            };

            EventEmitter.prototype.on = EventEmitter.prototype.addListener;

            EventEmitter.prototype.prependListener =
                function prependListener(type, listener) {
                  return _addListener(this, type, listener, true);
                };

            function _onceWrap(target, type, listener) {
              var fired = false;
              function g() {
                target.removeListener(type, g);
                if (!fired) {
                  fired = true;
                  listener.apply(target, arguments);
                }
              }
              g.listener = listener;
              return g;
            }

            EventEmitter.prototype.once = function once(type, listener) {
              if (typeof listener !== 'function')
                throw new TypeError('"listener" argument must be a function');
              this.on(type, _onceWrap(this, type, listener));
              return this;
            };

            EventEmitter.prototype.prependOnceListener =
                function prependOnceListener(type, listener) {
                  if (typeof listener !== 'function')
                    throw new TypeError('"listener" argument must be a function');
                  this.prependListener(type, _onceWrap(this, type, listener));
                  return this;
                };

            // emits a 'removeListener' event iff the listener was removed
            EventEmitter.prototype.removeListener =
                function removeListener(type, listener) {
                  var list, events, position, i, originalListener;

                  if (typeof listener !== 'function')
                    throw new TypeError('"listener" argument must be a function');

                  events = this._events;
                  if (!events)
                    return this;

                  list = events[type];
                  if (!list)
                    return this;

                  if (list === listener || (list.listener && list.listener === listener)) {
                    if (--this._eventsCount === 0)
                      this._events = new EventHandlers();
                    else {
                      delete events[type];
                      if (events.removeListener)
                        this.emit('removeListener', type, list.listener || listener);
                    }
                  } else if (typeof list !== 'function') {
                    position = -1;

                    for (i = list.length; i-- > 0;) {
                      if (list[i] === listener ||
                          (list[i].listener && list[i].listener === listener)) {
                        originalListener = list[i].listener;
                        position = i;
                        break;
                      }
                    }

                    if (position < 0)
                      return this;

                    if (list.length === 1) {
                      list[0] = undefined;
                      if (--this._eventsCount === 0) {
                        this._events = new EventHandlers();
                        return this;
                      } else {
                        delete events[type];
                      }
                    } else {
                      spliceOne(list, position);
                    }

                    if (events.removeListener)
                      this.emit('removeListener', type, originalListener || listener);
                  }

                  return this;
                };

            EventEmitter.prototype.removeAllListeners =
                function removeAllListeners(type) {
                  var listeners, events;

                  events = this._events;
                  if (!events)
                    return this;

                  // not listening for removeListener, no need to emit
                  if (!events.removeListener) {
                    if (arguments.length === 0) {
                      this._events = new EventHandlers();
                      this._eventsCount = 0;
                    } else if (events[type]) {
                      if (--this._eventsCount === 0)
                        this._events = new EventHandlers();
                      else
                        delete events[type];
                    }
                    return this;
                  }

                  // emit removeListener for all listeners on all events
                  if (arguments.length === 0) {
                    var keys = Object.keys(events);
                    for (var i = 0, key; i < keys.length; ++i) {
                      key = keys[i];
                      if (key === 'removeListener') continue;
                      this.removeAllListeners(key);
                    }
                    this.removeAllListeners('removeListener');
                    this._events = new EventHandlers();
                    this._eventsCount = 0;
                    return this;
                  }

                  listeners = events[type];

                  if (typeof listeners === 'function') {
                    this.removeListener(type, listeners);
                  } else if (listeners) {
                    // LIFO order
                    do {
                      this.removeListener(type, listeners[listeners.length - 1]);
                    } while (listeners[0]);
                  }

                  return this;
                };

            EventEmitter.prototype.listeners = function listeners(type) {
              var evlistener;
              var ret;
              var events = this._events;

              if (!events)
                ret = [];
              else {
                evlistener = events[type];
                if (!evlistener)
                  ret = [];
                else if (typeof evlistener === 'function')
                  ret = [evlistener.listener || evlistener];
                else
                  ret = unwrapListeners(evlistener);
              }

              return ret;
            };

            EventEmitter.listenerCount = function(emitter, type) {
              if (typeof emitter.listenerCount === 'function') {
                return emitter.listenerCount(type);
              } else {
                return listenerCount.call(emitter, type);
              }
            };

            EventEmitter.prototype.listenerCount = listenerCount;
            function listenerCount(type) {
              var events = this._events;

              if (events) {
                var evlistener = events[type];

                if (typeof evlistener === 'function') {
                  return 1;
                } else if (evlistener) {
                  return evlistener.length;
                }
              }

              return 0;
            }

            EventEmitter.prototype.eventNames = function eventNames() {
              return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
            };

            // About 1.5x faster than the two-arg version of Array#splice().
            function spliceOne(list, index) {
              for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
                list[i] = list[k];
              list.pop();
            }

            function arrayClone(arr, i) {
              var copy = new Array(i);
              while (i--)
                copy[i] = arr[i];
              return copy;
            }

            function unwrapListeners(arr) {
              var ret = new Array(arr.length);
              for (var i = 0; i < ret.length; ++i) {
                ret[i] = arr[i].listener || arr[i];
              }
              return ret;
            }

            var events = /*#__PURE__*/Object.freeze({
                        default: EventEmitter,
                        EventEmitter: EventEmitter
            });

            function createCommonjsModule(fn, module) {
            	return module = { exports: {} }, fn(module, module.exports), module.exports;
            }

            var multicastDnsServiceTypes = createCommonjsModule(function (module, exports) {
            var prefix = function (name) {
              return '_' + name
            };

            var defined = function (name) {
              return name
            };

            exports.stringify = function (data) {
              if (typeof data === 'object' && data && data.name) return exports.stringify(data.name, data.protocol, data.subtypes)
              return Array.prototype.concat.apply([], arguments).filter(defined).map(prefix).join('.')
            };

            exports.parse = function (str) {
              var parts = str.split('.');

              for (var i = 0; i < parts.length; i++) {
                if (parts[i][0] !== '_') continue
                parts[i] = parts[i].slice(1);
              }

              return {
                name: parts.shift(),
                protocol: parts.shift() || null,
                subtypes: parts
              }
            };

            exports.tcp = function (name) {
              return exports.stringify(name, 'tcp', Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1)))
            };

            exports.udp = function (name) {
              return exports.stringify(name, 'udp', Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1)))
            };
            });
            var multicastDnsServiceTypes_1 = multicastDnsServiceTypes.stringify;
            var multicastDnsServiceTypes_2 = multicastDnsServiceTypes.parse;
            var multicastDnsServiceTypes_3 = multicastDnsServiceTypes.tcp;
            var multicastDnsServiceTypes_4 = multicastDnsServiceTypes.udp;

            var bindexOf = require('buffer-indexof');

            var equalSign = new Buffer('=');

            module.exports = function (opts) {
              var binary = opts ? opts.binary : false;
              var that = {};

              that.encode = function (data, buf, offset) {
                if (!data) data = {};
                if (!offset) offset = 0;
                if (!buf) buf = new Buffer(that.encodingLength(data) + offset);

                var oldOffset = offset;
                var keys = Object.keys(data);

                if (keys.length === 0) {
                  buf[offset] = 0;
                  offset++;
                }

                keys.forEach(function (key) {
                  var val = data[key];
                  var oldOffset = offset;
                  offset++;

                  if (val === true) {
                    offset += buf.write(key, offset);
                  } else if (isBuffer(val)) {
                    offset += buf.write(key + '=', offset);
                    var len = val.length;
                    val.copy(buf, offset, 0, len);
                    offset += len;
                  } else {
                    offset += buf.write(key + '=' + val, offset);
                  }

                  buf[oldOffset] = offset - oldOffset - 1;
                });

                that.encode.bytes = offset - oldOffset;
                return buf
              };

              that.decode = function (buf, offset, len) {
                if (!offset) offset = 0;
                if (!Number.isFinite(len)) len = buf.length;
                var data = {};
                var oldOffset = offset;

                while (offset < len) {
                  var b = decodeBlock(buf, offset);
                  var i = bindexOf(b, equalSign);
                  offset += decodeBlock.bytes;

                  if (b.length === 0) continue // ignore: most likely a single zero byte
                  if (i === -1) data[b.toString().toLowerCase()] = true;
                  else if (i === 0) continue // ignore: invalid key-length
                  else {
                    var key = b.slice(0, i).toString().toLowerCase();
                    if (key in data) continue // ignore: overwriting not allowed
                    data[key] = binary ? b.slice(i + 1) : b.slice(i + 1).toString();
                  }
                }

                that.decode.bytes = offset - oldOffset;
                return data
              };

              that.encodingLength = function (data) {
                if (!data) return 1 // 1 byte (single empty byte)
                var keys = Object.keys(data);
                if (keys.length === 0) return 1 // 1 byte (single empty byte)
                return keys.reduce(function (total, key) {
                  var val = data[key];
                  total += Buffer.byteLength(key) + 1; // +1 byte to store field length
                  if (isBuffer(val)) total += val.length + 1; // +1 byte to fit equal sign
                  else if (val !== true) total += Buffer.byteLength(String(val)) + 1; // +1 byte to fit equal sign
                  return total
                }, 0)
              };

              return that
            };

            function decodeBlock (buf, offset) {
              var len = buf[offset];
              var to = offset + 1 + len;
              var b = buf.slice(offset + 1, to > buf.length ? buf.length : to);
              decodeBlock.bytes = len + 1;
              return b
            }

            var dnsTxt = /*#__PURE__*/Object.freeze({

            });

            var os$2 = ( os$1 && os ) || os$1;

            var util$2 = ( util$1 && util ) || util$1;

            var require$$0 = ( events && EventEmitter ) || events;

            const EventEmitter$1 = require$$0.EventEmitter;

            const txt = dnsTxt();

            const TLD = '.local';

            var service$1 = Service;

            util$2.inherits(Service, EventEmitter$1);

            function Service(opts) {
            	if (!opts.name) throw new Error('Required name not given');
            	if (!opts.type) throw new Error('Required type not given');
            	if (!opts.port) throw new Error('Required port not given');

            	this.name = opts.name;
            	this.protocol = opts.protocol || 'tcp';
            	this.type = multicastDnsServiceTypes.stringify(opts.type, this.protocol);
            	this.host = opts.host || os$2.hostname();
            	this.port = opts.port;
            	this.addresses = opts.addresses;
            	this.fqdn = this.name + '.' + this.type + TLD;
            	this.subtypes = opts.subtypes || null;
            	this.txt = opts.txt || null;
            	this.flush = opts.flush || false;
            	this.published = false;

            	this._activated = false; // indicates intent - true: starting/started, false: stopping/stopped
            }

            Service.prototype._records = function () {
            	const records = [rrPtrServices(this), rrPtr(this), rrSrv(this), rrTxt(this)];

            	if (this.subtypes) {
            		for (let subtypeIndex = 0; subtypeIndex < this.subtypes.length; subtypeIndex += 1) {
            			records.push(rrPtr(this, subtypeIndex));
            		}
            	}

            	const self = this;
            	if (!this.addresses) {
            		const interfaces = os$2.networkInterfaces();
            		Object.keys(interfaces).forEach(function (name) {
            			interfaces[name].forEach(function (addr) {
            				if (addr.internal) return;
            				if (addr.family === 'IPv4') {
            					records.push(rrA(self, addr.address));
            				} else {
            					records.push(rrAaaa(self, addr.address));
            				}
            			});
            		});
            	} else {
            		if (this.addresses.ipv4) {
            			this.addresses.ipv4.forEach(function (addr) {
            				records.push(rrA(self, addr));
            			});
            		}
            		if (this.addresses.ipv6) {
            			this.addresses.ipv6.forEach(function (addr) {
            				records.push(rrAaaa(self, addr));
            			});
            		}
            	}

            	return records
            };

            function rrPtrServices(service) {
            	return {
            		name: '_services._dns-sd._udp.local',
            		type: 'PTR',
            		ttl: 28800,
            		flush: service.flush,
            		data: service.type + TLD
            	}
            }

            function rrPtr(service, subtypeIndex) {
            	return {
            		name: (subtypeIndex !== undefined) ? '_' + service.subtypes[subtypeIndex] + '._sub.' +
            			service.type + TLD : service.type + TLD,
            		type: 'PTR',
            		ttl: 28800,
            		flush: service.flush,
            		data: service.fqdn
            	}
            }

            function rrSrv(service) {
            	return {
            		name: service.fqdn,
            		type: 'SRV',
            		ttl: 120,
            		flush: service.flush,
            		data: {
            			port: service.port,
            			target: service.host
            		}
            	}
            }

            function rrTxt(service) {
            	return {
            		name: service.fqdn,
            		type: 'TXT',
            		ttl: 4500,
            		flush: service.flush,
            		data: txt.encode(service.txt)
            	}
            }

            function rrA(service, ip) {
            	return {
            		name: service.host,
            		type: 'A',
            		ttl: 120,
            		data: ip
            	}
            }

            function rrAaaa(service, ip) {
            	return {
            		name: service.host,
            		type: 'AAAA',
            		ttl: 120,
            		data: ip
            	}
            }

            const REANNOUNCE_MAX_MS = 60 * 60 * 1000;
            const REANNOUNCE_FACTOR = 3;

            var registry = Registry;

            function Registry(server) {
            	this._server = server;
            	this._services = [];
            }

            Registry.prototype.publish = function (opts) {
            	const service = new service$1(opts);
            	service.start = start.bind(service, this);
            	service.stop = stop.bind(service, this);
            	service.start({probe: opts.probe !== false});
            	return service
            };

            Registry.prototype.unpublishAll = function (cb) {
            	teardown(this._server, this._services, cb);
            	this._services = [];
            };

            Registry.prototype.destroy = function () {
            	this._services.forEach(function (service) {
            		service._destroyed = true;
            	});
            };

            function start(registry, opts) {
            	if (this._activated) return;
            	this._activated = true;

            	registry._services.push(this);
            	registry._server.mdns.on('error', function (err) {
            		service.emit('error', err);
            	});

            	if (opts.probe) {
            		const service = this;
            		probe(registry._server.mdns, this, function (exists) {
            			if (exists) {
            				service.stop();
            				service.emit('error', new Error('Service name is already in use on the network'));
            				return
            			}
            			announce(registry._server, service);
            		});
            	} else {
            		announce(registry._server, this);
            	}
            }

            function stop(registry, cb) {
            	if (!this._activated) return; // TODO: What about the callback?

            	teardown(registry._server, this, cb);

            	const index = registry._services.indexOf(this);
            	if (index !== -1) registry._services.splice(index, 1);
            }

            /**
             * Check if a service name is already in use on the network.
             *
             * Used before announcing the new service.
             *
             * To guard against race conditions where multiple services are started
             * simultaneously on the network, wait a random amount of time (between
             * 0 and 250 ms) before probing.
             *
             * TODO: Add support for Simultaneous Probe Tiebreaking:
             * https://tools.ietf.org/html/rfc6762#section-8.2
             */
            function probe(mdns, service, cb) {
            	let sent = false;
            	let retries = 0;
            	let timer;

            	mdns.on('response', onresponse);
            	setTimeout(send, Math.random() * 250);

            	function send() {
            		// abort if the service have or is being stopped in the meantime
            		if (!service._activated || service._destroyed) return;

            		mdns.query(service.fqdn, 'ANY', function () {
            			// This function will optionally be called with an error object. We'll
            			// just silently ignore it and retry as we normally would
            			sent = true;
            			timer = setTimeout(++retries < 3 ? send : done, 250);
            			timer.unref();
            		});
            	}

            	function onresponse(packet) {
            		// Apparently conflicting Multicast DNS responses received *before*
            		// the first probe packet is sent MUST be silently ignored (see
            		// discussion of stale probe packets in RFC 6762 Section 8.2,
            		// "Simultaneous Probe Tiebreaking" at
            		// https://tools.ietf.org/html/rfc6762#section-8.2
            		if (!sent) return;

            		if (packet.answers.some(matchRR) || packet.additionals.some(matchRR)) done(true);
            	}

            	function matchRR(rr) {
            		return dnsEqual(rr.name, service.fqdn)
            	}

            	function done(exists) {
            		mdns.removeListener('response', onresponse);
            		clearTimeout(timer);
            		cb(Boolean(exists));
            	}
            }

            /**
             * Initial service announcement
             *
             * Used to announce new services when they are first registered.
             *
             * Broadcasts right away, then after 3 seconds, 9 seconds, 27 seconds,
             * and so on, up to a maximum interval of one hour.
             */
            function announce(server, service) {
            	let delay = 1000;
            	const packet = service._records();

            	server.register(packet)

            	;(function broadcast() {
            		// abort if the service have or is being stopped in the meantime
            		if (!service._activated || service._destroyed) return;

            		server.mdns.respond(packet, function () {
            			// This function will optionally be called with an error object. We'll
            			// just silently ignore it and retry as we normally would
            			if (!service.published) {
            				service._activated = true;
            				service.published = true;
            				service.emit('up');
            			}
            			delay = delay * REANNOUNCE_FACTOR;
            			if (delay < REANNOUNCE_MAX_MS && !service._destroyed) {
            				setTimeout(broadcast, delay).unref();
            			}
            		});
            	})();
            }

            /**
             * Stop the given services
             *
             * Besides removing a service from the mDNS registry, a "goodbye"
             * message is sent for each service to let the network know about the
             * shutdown.
             */
            function teardown(server, services, cb) {
            	if (!Array.isArray(services)) services = [services];

            	services = services.filter(function (service) {
            		return service._activated // ignore services not currently starting or started
            	});

            	const records = arrayFlatten.depth(services.map(function (service) {
            		service._activated = false;
            		const records = service._records();
            		records.forEach(function (record) {
            			record.ttl = 0; // prepare goodbye message
            		});
            		return records
            	}), 1);

            	if (records.length === 0) return cb && cb();

            	server.unregister(records);

            	// send goodbye message
            	server.mdns.respond(records, function () {
            		services.forEach(function (service) {
            			service.published = false;
            		});
            		if (cb) cb.apply(null, arguments);
            	});
            }

            var packet = require('dns-packet');
            var dgram = require('dgram');
            var thunky = require('thunky');
            var events$1 = require('events');
            var os$3 = require('os');

            var noop$1 = function () {};

            module.exports = function (opts) {
              if (!opts) opts = {};

              var that = new events$1.EventEmitter();
              var port = typeof opts.port === 'number' ? opts.port : 5353;
              var type = opts.type || 'udp4';
              var ip = opts.ip || opts.host || (type === 'udp4' ? '224.0.0.251' : null);
              var me = {address: ip, port: port};
              var memberships = {};
              var destroyed = false;
              var interval = null;

              if (type === 'udp6' && (!ip || !opts.interface)) {
                throw new Error('For IPv6 multicast you must specify `ip` and `interface`')
              }

              var socket = opts.socket || dgram.createSocket({
                type: type,
                reuseAddr: opts.reuseAddr !== false,
                toString: function () {
                  return type
                }
              });

              socket.on('error', function (err) {
                if (err.code === 'EACCES' || err.code === 'EADDRINUSE') that.emit('error', err);
                else that.emit('warning', err);
              });

              socket.on('message', function (message, rinfo) {
                try {
                  message = packet.decode(message);
                } catch (err) {
                  that.emit('warning', err);
                  return
                }

                that.emit('packet', message, rinfo);

                if (message.type === 'query') that.emit('query', message, rinfo);
                if (message.type === 'response') that.emit('response', message, rinfo);
              });

              socket.on('listening', function () {
                if (!port) port = me.port = socket.address().port;
                if (opts.multicast !== false) {
                  that.update();
                  interval = setInterval(that.update, 5000);
                  socket.setMulticastTTL(opts.ttl || 255);
                  socket.setMulticastLoopback(opts.loopback !== false);
                }
              });

              var bind = thunky(function (cb) {
                if (!port) return cb(null)
                socket.once('error', cb);
                socket.bind(port, opts.interface, function () {
                  socket.removeListener('error', cb);
                  cb(null);
                });
              });

              bind(function (err) {
                if (err) return that.emit('error', err)
                that.emit('ready');
              });

              that.send = function (value, rinfo, cb) {
                if (typeof rinfo === 'function') return that.send(value, null, rinfo)
                if (!cb) cb = noop$1;
                if (!rinfo) rinfo = me;

                bind(onbind);

                function onbind (err) {
                  if (destroyed) return cb()
                  if (err) return cb(err)
                  var message = packet.encode(value);
                  socket.send(message, 0, message.length, rinfo.port, rinfo.address || rinfo.host, cb);
                }
              };

              that.response =
              that.respond = function (res, rinfo, cb) {
                if (Array.isArray(res)) res = {answers: res};

                res.type = 'response';
                res.flags = (res.flags || 0) | packet.AUTHORITATIVE_ANSWER;
                that.send(res, rinfo, cb);
              };

              that.query = function (q, type, rinfo, cb) {
                if (typeof type === 'function') return that.query(q, null, null, type)
                if (typeof type === 'object' && type && type.port) return that.query(q, null, type, rinfo)
                if (typeof rinfo === 'function') return that.query(q, type, null, rinfo)
                if (!cb) cb = noop$1;

                if (typeof q === 'string') q = [{name: q, type: type || 'ANY'}];
                if (Array.isArray(q)) q = {type: 'query', questions: q};

                q.type = 'query';
                that.send(q, rinfo, cb);
              };

              that.destroy = function (cb) {
                if (!cb) cb = noop$1;
                if (destroyed) return nextTick(cb)
                destroyed = true;
                clearInterval(interval);
                socket.once('close', cb);
                socket.close();
              };

              that.update = function () {
                var ifaces = opts.interface ? [].concat(opts.interface) : allInterfaces();
                var updated = false;

                for (var i = 0; i < ifaces.length; i++) {
                  var addr = ifaces[i];

                  if (memberships[addr]) continue
                  memberships[addr] = true;
                  updated = true;

                  try {
                    socket.addMembership(ip, addr);
                  } catch (err) {
                    that.emit('warning', err);
                  }
                }

                if (!updated || !socket.setMulticastInterface) return
                socket.setMulticastInterface(opts.interface || defaultInterface());
              };

              return that
            };

            function defaultInterface () {
              var networks = os$3.networkInterfaces();
              var names = Object.keys(networks);

              for (var i = 0; i < names.length; i++) {
                var net = networks[names[i]];
                for (var j = 0; j < net.length; j++) {
                  var iface = net[j];
                  if (iface.family === 'IPv4' && !iface.internal) return iface.address
                }
              }

              return '127.0.0.1'
            }

            function allInterfaces () {
              var networks = os$3.networkInterfaces();
              var names = Object.keys(networks);
              var res = [];

              for (var i = 0; i < names.length; i++) {
                var net = networks[names[i]];
                for (var j = 0; j < net.length; j++) {
                  var iface = net[j];
                  if (iface.family === 'IPv4') {
                    res.push(iface.address);
                    // could only addMembership once per interface (https://nodejs.org/api/dgram.html#dgram_socket_addmembership_multicastaddress_multicastinterface)
                    break
                  }
                }
              }

              return res
            }

            var multicastDns = /*#__PURE__*/Object.freeze({

            });

            var keys = createCommonjsModule(function (module, exports) {
            exports = module.exports = typeof Object.keys === 'function'
              ? Object.keys : shim;

            exports.shim = shim;
            function shim (obj) {
              var keys = [];
              for (var key in obj) keys.push(key);
              return keys;
            }
            });
            var keys_1 = keys.shim;

            var is_arguments = createCommonjsModule(function (module, exports) {
            var supportsArgumentsClass = (function(){
              return Object.prototype.toString.call(arguments)
            })() == '[object Arguments]';

            exports = module.exports = supportsArgumentsClass ? supported : unsupported;

            exports.supported = supported;
            function supported(object) {
              return Object.prototype.toString.call(object) == '[object Arguments]';
            }
            exports.unsupported = unsupported;
            function unsupported(object){
              return object &&
                typeof object == 'object' &&
                typeof object.length == 'number' &&
                Object.prototype.hasOwnProperty.call(object, 'callee') &&
                !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
                false;
            }});
            var is_arguments_1 = is_arguments.supported;
            var is_arguments_2 = is_arguments.unsupported;

            var deepEqual_1 = createCommonjsModule(function (module) {
            var pSlice = Array.prototype.slice;



            var deepEqual = module.exports = function (actual, expected, opts) {
              if (!opts) opts = {};
              // 7.1. All identical values are equivalent, as determined by ===.
              if (actual === expected) {
                return true;

              } else if (actual instanceof Date && expected instanceof Date) {
                return actual.getTime() === expected.getTime();

              // 7.3. Other pairs that do not both pass typeof value == 'object',
              // equivalence is determined by ==.
              } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
                return opts.strict ? actual === expected : actual == expected;

              // 7.4. For all other Object pairs, including Array objects, equivalence is
              // determined by having the same number of owned properties (as verified
              // with Object.prototype.hasOwnProperty.call), the same set of keys
              // (although not necessarily the same order), equivalent values for every
              // corresponding key, and an identical 'prototype' property. Note: this
              // accounts for both named and indexed properties on Arrays.
              } else {
                return objEquiv(actual, expected, opts);
              }
            };

            function isUndefinedOrNull(value) {
              return value === null || value === undefined;
            }

            function isBuffer (x) {
              if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
              if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
                return false;
              }
              if (x.length > 0 && typeof x[0] !== 'number') return false;
              return true;
            }

            function objEquiv(a, b, opts) {
              var i, key;
              if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
                return false;
              // an identical 'prototype' property.
              if (a.prototype !== b.prototype) return false;
              //~~~I've managed to break Object.keys through screwy arguments passing.
              //   Converting to array solves the problem.
              if (is_arguments(a)) {
                if (!is_arguments(b)) {
                  return false;
                }
                a = pSlice.call(a);
                b = pSlice.call(b);
                return deepEqual(a, b, opts);
              }
              if (isBuffer(a)) {
                if (!isBuffer(b)) {
                  return false;
                }
                if (a.length !== b.length) return false;
                for (i = 0; i < a.length; i++) {
                  if (a[i] !== b[i]) return false;
                }
                return true;
              }
              try {
                var ka = keys(a),
                    kb = keys(b);
              } catch (e) {//happens when one is a string literal and the other isn't
                return false;
              }
              // having the same number of owned properties (keys incorporates
              // hasOwnProperty)
              if (ka.length != kb.length)
                return false;
              //the same set of keys (although not necessarily the same order),
              ka.sort();
              kb.sort();
              //~~~cheap key test
              for (i = ka.length - 1; i >= 0; i--) {
                if (ka[i] != kb[i])
                  return false;
              }
              //equivalent values for every corresponding key, and
              //~~~possibly expensive deep test
              for (i = ka.length - 1; i >= 0; i--) {
                key = ka[i];
                if (!deepEqual(a[key], b[key], opts)) return false;
              }
              return typeof a === typeof b;
            }
            });

            var mdnsServer = Server;

            function Server(opts) {
            	this.mdns = multicastDns(opts);
            	this.mdns.setMaxListeners(0);
            	this.registry = {};
            	this.mdns.on('query', this._respondToQuery.bind(this));
            }

            Server.prototype.register = function (records) {
            	const self = this;

            	if (Array.isArray(records)) records.forEach(register);
            	else register(records);

            	function register(record) {
            		let subRegistry = self.registry[record.type];
            		if (!subRegistry) subRegistry = self.registry[record.type] = [];
            		else if (subRegistry.some(isDuplicateRecord(record))) return;
            		subRegistry.push(record);
            	}
            };

            Server.prototype.unregister = function (records) {
            	const self = this;

            	if (Array.isArray(records)) records.forEach(unregister);
            	else unregister(records);

            	function unregister(record) {
            		const type = record.type;
            		if (!(type in self.registry)) return;
            		self.registry[type] = self.registry[type].filter(function (r) {
            			return r.name !== record.name
            		});
            	}
            };

            Server.prototype._respondToQuery = function (query) {
            	const self = this;
            	query.questions.forEach(function (question) {
            		const type = question.type;
            		const name = question.name;

            		// generate the answers section
            		const answers = type === 'ANY'
            			? arrayFlatten.depth(Object.keys(self.registry).map(self._recordsFor.bind(self, name)), 1)
            			: self._recordsFor(name, type);

            		if (answers.length === 0) return;

            		// generate the additionals section
            		let additionals = [];
            		if (type !== 'ANY') {
            			answers.forEach(function (answer) {
            				if (answer.type !== 'PTR') return;
            				additionals = additionals
            					.concat(self._recordsFor(answer.data, 'SRV'))
            					.concat(self._recordsFor(answer.data, 'TXT'));
            			});

            			// to populate the A and AAAA records, we need to get a set of unique
            			// targets from the SRV record
            			additionals
            				.filter(function (record) {
            					return record.type === 'SRV'
            				})
            				.map(function (record) {
            					return record.data.target
            				})
            				.filter(unique())
            				.forEach(function (target) {
            					additionals = additionals
            						.concat(self._recordsFor(target, 'A'))
            						.concat(self._recordsFor(target, 'AAAA'));
            				});
            		}

            		self.mdns.respond({answers: answers, additionals: additionals}, function (err) {
            			if (err) throw err // TODO: Handle this (if no callback is given, the error will be ignored)
            		});
            	});
            };

            Server.prototype._recordsFor = function (name, type) {
            	if (!(type in this.registry)) return [];

            	return this.registry[type].filter(function (record) {
            		const _name = ~name.indexOf('.') ? record.name : record.name.split('.')[0];
            		return dnsEqual(_name, name)
            	})
            };

            function isDuplicateRecord(a) {
            	return function (b) {
            		return a.type === b.type &&
            			a.name === b.name &&
            			deepEqual_1(a.data, b.data)
            	}
            }

            function unique() {
            	const set = [];
            	return function (obj) {
            		if (~set.indexOf(obj)) return false;
            		set.push(obj);
            		return true
            	}
            }

            const EventEmitter$2 = require$$0.EventEmitter;




            const TLD$1 = '.local';
            const WILDCARD = '_services._dns-sd._udp' + TLD$1;

            var browser$1 = Browser;

            util$2.inherits(Browser, EventEmitter$2);

            /**
             * Start a browser
             *
             * The browser listens for services by querying for PTR records of a given
             * type, protocol and domain, e.g. _http._tcp.local.
             *
             * If no type is given, a wild card search is performed.
             *
             * An internal list of online services is kept which starts out empty. When
             * ever a new service is discovered, it's added to the list and an "up" event
             * is emitted with that service. When it's discovered that the service is no
             * longer available, it is removed from the list and a "down" event is emitted
             * with that service.
             */
            function Browser(mdns, opts, onup) {
            	if (typeof opts === 'function') return new Browser(mdns, null, opts);

            	EventEmitter$2.call(this);

            	opts = opts || {};

            	this._mdns = mdns;
            	this._onresponse = null;
            	this._serviceMap = {};
            	this._txt = dnsTxt(opts.txt);

            	let types = opts.types || [];
            	if (!Array.isArray(types)) {
            		types = [types];
            	}

            	if ((types.length === 0) && (opts.type)) {
            		if (opts.subtypes) {
            			types.push({[opts.type]: opts.subtypes});
            		} else {
            			types.push(opts.type);
            		}
            	}

            	this._wildcard = !Boolean(types.length);
            	this._names = this._wildcard ? [WILDCARD] : [];
            	if (types.length) {
            		types.filter(type => Boolean(type)).forEach(type => {
            			if (typeof type === 'string') {
            				this._names.push(multicastDnsServiceTypes.stringify(type, opts.protocol || 'tcp') + TLD$1);
            			} else if (typeof type === 'object') {
            				const names = Object.keys(type);
            				names.forEach(name => {
            					let subtypes = type[name];
            					if (!subtypes) return;
            					if (!Array.isArray(subtypes)) subtypes = [subtypes];
            					subtypes.forEach(subtype => {
            						this._names.push('_' + subtype + '._sub.' + multicastDnsServiceTypes.stringify(name, opts.protocol || 'tcp') + TLD$1);
            					});
            				});
            			}
            		});
            	}

            	this.services = [];

            	if (onup) this.on('up', onup);

            	this.start();
            }

            Browser.prototype.start = function () {
            	if (this._onresponse) return;
            	const self = this;
            	const nameMap = {};
            	const nameInMap = function (recordName) {
            		let nameMatch = false;
            		self._names.forEach(function (name) {
            			if (name === recordName) {
            				nameMatch = true;
            			}
            		});
            		return nameMatch
            	};

            	// List of names for the browser to listen for. In a normal search this will
            	// be the primary name stored on the browser. In case of a wildcard search
            	// the names will be determined at runtime as responses come in.
            	if (!this._wildcard) {
            		this._names.forEach(function (name) {
            			nameMap[name] = true;
            		});
            	}

            	this._onresponse = function (packet, rinfo) {
            		if (self._wildcard) {
            			packet.answers.forEach(function (answer) {
            				if (answer.type !== 'PTR' || nameInMap(answer.map) || answer.name in nameMap) return;
            				nameMap[answer.data] = true;
            				self._mdns.query(answer.data, 'PTR');
            			});
            		}

            		Object.keys(nameMap).forEach(function (name) {
            			// unregister all services shutting down
            			goodbyes(name, packet).forEach(self._removeService.bind(self));

            			// register all new services
            			const matches = buildServicesFor(name, packet, self._txt, rinfo);
            			if (matches.length === 0) return;

            			matches.forEach(function (service) {
            				let serviceIndex = 0;
            				if (self._serviceMap[service.fqdn]) {
            					// ignore already registered services, which exist is the new service
            					// has no subtype
            					if (service.subtypes.length === 0) return;

            					// Check to see if this includes a subtype that didn't exist previously
            					// If so, add it to the service already cached and emit a CB
            					for (serviceIndex = 0; serviceIndex < self.services.length; serviceIndex += 1) {
            						if (self.services[serviceIndex].fqdn === service.fqdn) {
            							break
            						}
            					}
            					// If the service subtype type already exists in the service, ignore it.
            					if (self.services[serviceIndex].subtypes.indexOf(service.subtypes[0]) !== -1) return;

            					self.services[serviceIndex].subtypes.push(service.subtypes[0]);
            					self.emit('up', self.services[serviceIndex]);
            				} else {
            					self._addService(service);
            				}
            			});
            		});
            	};

            	this._mdns.on('response', this._onresponse);
            	this.update();
            };

            Browser.prototype.stop = function () {
            	if (!this._onresponse) return;

            	this._mdns.removeListener('response', this._onresponse);
            	this._onresponse = null;
            };

            Browser.prototype.update = function () {
            	const self = this;
            	this._names.forEach(function (name) {
            		self._mdns.query(name, 'PTR');
            	});
            };

            Browser.prototype._addService = function (service) {
            	this.services.push(service);
            	this._serviceMap[service.fqdn] = true;
            	this.emit('up', service);
            };

            Browser.prototype._removeService = function (fqdn) {
            	let service, index;
            	this.services.some(function (s, i) {
            		if (dnsEqual(s.fqdn, fqdn)) {
            			service = s;
            			index = i;
            			return true
            		}
            	});
            	if (!service) return;
            	this.services.splice(index, 1);
            	delete this._serviceMap[fqdn];
            	this.emit('down', service);
            };

            // PTR records with a TTL of 0 is considered a "goodbye" announcement. I.e. a
            // DNS response broadcasted when a service shuts down in order to let the
            // network know that the service is no longer going to be available.
            //
            // For more info see:
            // https://tools.ietf.org/html/rfc6762#section-8.4
            //
            // This function returns an array of all resource records considered a goodbye
            // record
            function goodbyes(name, packet) {
            	return packet.answers.concat(packet.additionals)
            		.filter(function (rr) {
            			return rr.type === 'PTR' && rr.ttl === 0 && dnsEqual(rr.name, name)
            		})
            		.map(function (rr) {
            			return rr.data
            		})
            }

            function buildServicesFor(name, packet, txt, referer) {
            	const records = packet.answers.concat(packet.additionals).filter(function (rr) {
            		return rr.ttl > 0 // ignore goodbye messages
            	});

            	return records
            		.filter(function (rr) {
            			return rr.type === 'PTR' && dnsEqual(rr.name, name)
            		})
            		.map(function (ptr) {
            			const service = {
            				addresses: []
            			};

            			records
            				.filter(function (rr) {
            					return (rr.type === 'SRV' || rr.type === 'TXT') && dnsEqual(rr.name, ptr.data)
            				})
            				.forEach(function (rr) {
            					if (rr.type === 'SRV') {
            						const parts = rr.name.split('.');
            						const name = parts[0];
            						const types = multicastDnsServiceTypes.parse(parts.slice(1, -1).join('.'));
            						const subparts = ptr.name.split('.');
            						service.name = name;
            						service.fqdn = rr.name;
            						service.host = rr.data.target;
            						service.referer = referer;
            						service.port = rr.data.port;
            						service.type = types.name;
            						service.protocol = types.protocol;

            						// If the subparts length is larger than the parts length, then
            						// there does indeed exist a subtype and we add that to the main
            						// service record.
            						if (subparts.length > (parts.length - 1)) {
            							service.subtypes = [subparts[0].slice(1)];
            						} else {
            							service.subtypes = [];
            						}
            					} else if (rr.type === 'TXT') {
            						service.rawTxt = rr.data;
            						service.txt = txt.decode(rr.data);
            					}
            				});

            			if (!service.name) return;

            			records
            				.filter(function (rr) {
            					return (rr.type === 'A' || rr.type === 'AAAA') && dnsEqual(rr.name, service.host)
            				})
            				.forEach(function (rr) {
            					service.addresses.push(rr.data);
            				});

            			return service
            		})
            		.filter(function (rr) {
            			return !!rr
            		})
            }

            class Bonjour {

            	static create(opts) {
            		return new Bonjour(opts);
            	}

            	constructor(opts) {
            		this._server = new mdnsServer(opts);
            		this._registry = new registry(this._server);
            	}

            	publish(opts) {
            		return this._registry.publish(opts)
            	}

            	unpublishAll(cb) {
            		this._registry.unpublishAll(cb);
            	}

            	find(opts, onup) {
            		return new browser$1(this._server.mdns, opts, onup)
            	}

            	findOne(opts, cb) {
            		const browser = new browser$1(this._server.mdns, opts);
            		browser.once('up', function (service) {
            			browser.stop();
            			if (cb) cb(service);
            		});
            		return browser
            	}

            	destroy() {
            		this._registry.destroy();
            		this._server.mdns.destroy();
            	}
            }

            var nbonjour = Bonjour;

            function getEnv (key) {
              if (typeof process !== 'undefined') return process.env[key]
            }

            class Room {
              constructor (host) {
                this._host = host || getEnv('LIVING_ROOM_HOST') || 'http://localhost:3000';
                const serviceDefinition = { type: 'http', subtypes: ['livingroom']};

                this._browser = nbonjour.create().find(serviceDefinition, service => {
                  const {type, host, port} = service;
                  this._host = `${type}://${host}:${port}`;
                  console.log(`set new host to ${this._host}`);
                  this._socket = io.connect(this._host);
                });

                this._socket = io.connect(this._host);
              }

              /**
               * @param {String | String[]} facts
               * @param {Function} callback
               */
              subscribe (facts, callback) {
                if (typeof facts === 'string') facts = [facts];
                const patternsString = JSON.stringify(facts);
                this._socket.on(patternsString, callback);
                this._socket.emit('subscribe', patternsString);
              }

              /**
               *
               * @param {String} endpoint assert, retract, select
               * @param {[String]} facts
               */
              _request (endpoint, facts, callback) {
                if (!['assert', 'retract', 'select', 'facts'].includes(endpoint)) {
                  throw new Error('Unknown endpoint, try assert, retract, select, or facts')
                }

                if (typeof facts === 'string') facts = [facts];

                if (!(endpoint === 'facts' || facts.length)) {
                  throw new Error('Please pass at least one fact')
                }

                // Can this return a promise with the result?
                // Does that even make sense?
                if (this._socket.connected) {
                  return new Promise((resolve, reject) => {
                    this._socket.emit(endpoint, facts, resolve);
                  })
                }

                const uri = `${this._host}/${endpoint}`;

                const post = {
                  method: 'POST',
                  body: JSON.stringify({ facts }),
                  headers: { 'Content-Type': 'application/json' }
                };

                return fetch(uri, post)
                  .then(response => response.json())
                  .catch(console.error)
              }

              assert (facts, callback) {
                return this._request('assert', facts, callback)
              }

              retract (facts, callback) {
                return this._request('retract', facts, callback)
              }

              select (facts, callback) {
                return this._request('select', facts, callback)
              }

              facts () {
                return this._request('facts')
              }
            }

            return Room;

})));
//# sourceMappingURL=room.browser.js.map
