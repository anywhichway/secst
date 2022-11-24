const path = require('path'),
    nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/index.js',
    watch: true,
    target: "node",
    externals: [
        nodeExternals()
    ],
    output: {
        filename: './index.js',
        path: __dirname,
    },
    optimization: {
        minimize: false
    }
};