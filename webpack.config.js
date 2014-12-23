module.exports = {
    target: "web",
//    debug: true,
//    devtool: "source-map",
    entry: "./main.js",
    output: {
        path: "./target",
        filename: "triton-route-loader.js",
        libraryTarget:"commonjs2"
    },
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".js", ".jsx", ".bars"],
        alias: {
        }
    },
    externals: [
        "fs"
    ],
    module: {
        loaders: [            
            { test: /\.jsx?$/, loader: "jsx-loader?harmony" },
            { test: /\.bars$/, loader: "handlebars-loader" }

        ]
    },
    plugins: [
    ]
};
