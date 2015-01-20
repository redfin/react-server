
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
        "superagent",
        "winston"
    ],
    resolve: {
        extensions: ["", ".js", ".jsx"]
    },
    resolveLoader: {
        root: __dirname // For the logger-loader, which is relative.
    },
    module: {
        loaders: [            
            { test: /\.jsx?$/, loader: "buildutils/logger-loader" },
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
