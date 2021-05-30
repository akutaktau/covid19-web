const mix = require('laravel-mix');
const command = require('node-cmd');

class ServePlugin {
    constructor(config) {
        this.serveConfig = config;
    }

    apply(compiler) {
        compiler.hooks.watchRun.tap('ServePlugin', compilation => {
            console.log(
                `Serving application at: http://${this.serveConfig.host}:${this.serveConfig.port}`,
            );
            command.get(
                `php -S ${this.serveConfig.host}:${this.serveConfig.port} -t ${__dirname}/public`,
                (err, stdout, stderr) => {
                    console.log(err ? stderr : stdout);
                },
            );
        });
    }
}

class Serve {
    name() {
        return 'serve';
    }

    register(userConfig) {
        const defaultConfig = {
            host: '127.0.0.1',
            port: '9080',
        };

        if (userConfig !== undefined) {
            this.config = {
                ...defaultConfig,
                ...userConfig
            };
        } else {
            this.config = defaultConfig;
        }
    }

    webpackPlugins() {
        return new ServePlugin(this.config);
    }
}

mix.extend('serve', new Serve());