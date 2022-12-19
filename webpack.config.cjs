const path = require("path");


module.exports = {
    entry: {
        index:'./src/index.js',
        runtime:'./src/runtime.js'
    },
    //watch: true,
    output: {
        filename: './[name].js',
        path: __dirname,
        chunkFormat: "module"
    },
    resolve: {
        //extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss'],
        modules: ['./node_modules']
    },
    experiments: {
        topLevelAwait: true
    },
    optimization: {
       minimize: true
    }
};