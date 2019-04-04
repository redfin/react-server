module.exports = {
  plugins: [
    require('babel-plugin-react-server'),
    require('@babel/plugin-transform-runtime'),
  ],
  presets: [
    require('@babel/preset-env'),
    require('@babel/preset-react'),
    require('@babel/preset-stage-0'),
  ],
}
