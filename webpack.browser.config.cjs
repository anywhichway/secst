const path = require("path");

module.exports = {
    entry: './src/index.js',
    watch: true,
    output: {
        filename: './secst.js',
        path: __dirname,
        chunkFormat: "module"
    },
    optimization: {
        minimize: false
    }
};