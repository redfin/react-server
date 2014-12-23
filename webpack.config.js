
var DedupePlugin = require("webpack/lib/optimize/DedupePlugin");
//var AggressiveMergingPlugin = require("webpack/lib/optimize/AggressiveMergingPlugin");
var DefinePlugin = require("webpack/lib/DefinePlugin");
var NewWatchingPlugin = require("webpack/lib/NewWatchingPlugin");


module.exports = {
    target: "web",
    debug: true,
    devtool: "source-map",
    entry: "./client.js",
    output: {
        path: "./dist",
        filename: "triton-client.js",
        libraryTarget: 'commonjs2'
    },
    externals: ["react"],
    resolve: {
        extensions: ["", ".js", ".jsx"]
    },
    module: {
        loaders: [            
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" }
        ]
    },
    plugins: [
        new DedupePlugin(),
        new DefinePlugin({
            SERVER_SIDE: false
        }),
        new NewWatchingPlugin()
    ]
};
