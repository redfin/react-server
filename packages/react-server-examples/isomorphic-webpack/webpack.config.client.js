import path from 'path';
import webpack from 'webpack';

// https://github.com/redfin/react-server/blob/2a8fb275e0af658cdf2737f207f2bf33fb2950d7/docs/guides/react-server-cli.md#webpack-options

//This function gets called by react-server during the webpack process.

export default (webpackConfig) => {
    webpackConfig.plugins.push(new webpack.DefinePlugin({
        MY_CUSTOM_CLIENT_VARIABLE: '"custom client variable"',
    }));
    return webpackConfig;
}
