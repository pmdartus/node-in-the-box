import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';

export default {
  entry: 'client/index.js',
  dest: 'public/js/bundle.js',
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
    nodeResolve({
      main: true,
    }),
    commonjs({}),
    replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
  ],
  format: 'iife',
  moduleName: 'nodeInTheBox',
};
