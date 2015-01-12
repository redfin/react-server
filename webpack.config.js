
var DedupePlugin = require("webpack/lib/optimize/DedupePlugin");
//var AggressiveMergingPlugin = require("webpack/lib/optimize/AggressiveMergingPlugin");
var DefinePlugin = require("webpack/lib/DefinePlugin");
var NewWatchingPlugin = require("webpack/lib/NewWatchingPlugin");
var UglifyJsPlugin = require("webpack/lib/optimize/UglifyJsPlugin");


module.exports = {
    target: "web",
    debug: true,
    devtool: "source-map",
    entry: "./client.js",
    output: {
        path: "./target",
        filename: "triton-client.js",
        libraryTarget: 'commonjs2'
    },
    externals: [
        "react", 
        "react/addons",
        "superagent"
    ],
    resolve: {
        extensions: ["", ".js", ".jsx"]
    },
    module: {
        loaders: [            
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" }
        ]
    },
    node: {
        fs: "empty"
    },
    plugins: [
        new DedupePlugin(),
        new DefinePlugin({
            SERVER_SIDE: false
        }),
        new NewWatchingPlugin()
    ]
};
