
var path = require('path');

var DefinePlugin = require("webpack/lib/DefinePlugin");


module.exports = {
    target: "node",
    debug: true,
    devtool: "source-map",
    entry: "./server",
    output: {
        path: "./target",
        filename: "triton-server.js",
        libraryTarget: 'commonjs2'
    },
    externals: [
        // Every non-relative module is external
        // abc -> require("abc").
        // This prevents webpack from unnecessarily processing
        // third-party modules that are just going to run in node anyway
        // (RG: pulled from webpack config docs)
        ///^[A-Za-z\-0-9]+$/,
        "body-parser",
        "bundle-loader",
        "debug",
        "q",
        "react",
        "react/addons",
        "react-tools",
        "routr",
        "superagent",
        "webpack",
        "rimraf",
        "fs"
    ],
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx" ,".bars"]
    },
    module: {
        loaders: [
            // { test: /(\.less)|(\.css)$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" },

            // for server-side, we don't need style files
            //{ test: /\.less$/, loader: "null-loader" },

            //{ test: /\.bars$/, loader: "handlebars-loader" }

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
