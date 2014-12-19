
var path = require('path');

var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var DedupePlugin = require("webpack/lib/optimize/DedupePlugin");
//var AggressiveMergingPlugin = require("webpack/lib/optimize/AggressiveMergingPlugin");
var DefinePlugin = require("webpack/lib/DefinePlugin");
var NewWatchingPlugin = require("webpack/lib/NewWatchingPlugin");

var ExtractTextPlugin = require("extract-text-webpack-plugin");

var bundleNameUtil = require("./core/util/bundleNameUtil");

//generate entrypoint files.
var entry = require("./buildutils/EntryPointGenerator")("./routes/routes.js");

/*entry.HomeDetailsPage = "./app/entrypoints/HomeDetailsPage";

entry.IndexPage = "./app/entrypoints/IndexPage.js";
entry.AboutPage = "./app/entrypoints/AboutPage.js";*/

module.exports = {
    target: "web",
//    debug: true,
//    devtool: "source-map",
    entry: entry,
    output: {
        path: "./target/browser",
        publicPath: "/r3sjs/",
        filename: "[name]" + bundleNameUtil.JS_BUNDLE_SUFFIX
    },
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx"],
        alias: {
        }
    },
    module: {
        loaders: [            
            { test: /(\.less)|(\.css)$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" },

            // webpack wants real bad for this to be a string, for some reason... the resolve(...) works
            { test: /\/routes\/routes\.js$/, loader: require.resolve('./buildutils/RouteHydrationLoader') }

            //{ test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
            //{ test: /\.gif/, loader: "url-loader?limit=100000&mimetype=image/gif" },
            //{ test: /\.jpg/, loader: "file-loader" }
        ]
    },
    plugins: [
        new CommonsChunkPlugin("common.js"),
        new DedupePlugin(),
        new DefinePlugin({
            SERVER_SIDE: false
        }),
        new NewWatchingPlugin(),
        new ExtractTextPlugin("[name]" + bundleNameUtil.CSS_ROLLUP_SUFFIX)
        //new AggressiveMergingPlugin({moveToParents: true}),
    ]
};
