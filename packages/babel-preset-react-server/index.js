module.exports = {
  plugins: [
    require('babel-plugin-react-server').default,
    require('babel-plugin-transform-runtime'),
  ],
  presets: [
    require('babel-preset-es2015'),
    require('babel-preset-react'),
    require('babel-preset-stage-0'),
  ],
}
