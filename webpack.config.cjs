const path = require("path");

module.exports = {
    entry: './src/index.js',
    //watch: true,
    output: {
        filename: './secst.js',
        path: __dirname,
        chunkFormat: "module"
    },
    resolve: {
        //extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss'],
        modules: ['./node_modules']
    },
    experiments: {
        topLevelAwait: true
    }
};