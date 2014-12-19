
var path = require('path');

var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var DedupePlugin = require("webpack/lib/optimize/DedupePlugin");
//var AggressiveMergingPlugin = require("webpack/lib/optimize/AggressiveMergingPlugin");
var DefinePlugin = require("webpack/lib/DefinePlugin");
var NewWatchingPlugin = require("webpack/lib/NewWatchingPlugin");
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
    target: "node",
    debug: true,
    devtool: "source-map",
    entry: null,  // to be filled in by the app -sra.
    output: {
        path: "./target/node",
        publicPath: "/r3sjs/",
        filename: "compiled-app.js",
        libraryTarget: 'commonjs'
    },
    externals: [
        // Every non-relative module is external
        // abc -> require("abc").
        // This prevents webpack from unnecessarily processing
        // third-party modules that are just going to run in node anyway
        // (RG: pulled from webpack config docs)
        ///^[A-Za-z\-0-9]+$/,
        "express",
        "cookie-parser",
        "express-state",
        "superagent"

    ],
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx"],
        alias: {
            'triton': path.normalize(path.join(__dirname, "."))
        }
    },
    module: {
        loaders: [
            // { test: /(\.less)|(\.css)$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" },

            // webpack wants real bad for this to be a string, for some reason... the resolve(...) works
            { test: /\/routes\/routes\.js$/, loader: require.resolve('./buildutils/RouteHydrationLoader') }

            //{ test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
            //{ test: /\.gif/, loader: "url-loader?limit=100000&mimetype=image/gif" },
            //{ test: /\.jpg/, loader: "file-loader" }
        ]
    },
    plugins: [
        new DefinePlugin({
            SERVER_SIDE: true
        })
    ]
};
