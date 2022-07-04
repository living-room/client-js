import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/room.browser.js',
  output: {
    file: 'src/room.browser.prod.js',
    name: 'LivingRoom',
    format: 'iife'
  },
  plugins: [
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs()
  ]
}
