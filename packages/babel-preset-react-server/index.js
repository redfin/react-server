module.exports = {
  plugins: [
    require('babel-plugin-transform-es2015-arrow-functions'),
    require('babel-plugin-transform-es2015-block-scoping'),
    require('babel-plugin-transform-es2015-classes'),
    require('babel-plugin-transform-es2015-computed-properties'),
    require('babel-plugin-transform-es2015-constants'),
    require('babel-plugin-transform-es2015-destructuring'),
    require('babel-plugin-transform-es2015-modules-commonjs'),
    require('babel-plugin-transform-es2015-parameters'),
    require('babel-plugin-transform-es2015-shorthand-properties'),
    require('babel-plugin-transform-es2015-spread'),
    require('babel-plugin-transform-es2015-template-literals'),
    require('babel-plugin-transform-object-rest-spread'),
  ],
  presets: [
    require('babel-preset-react'),
  ],
}
