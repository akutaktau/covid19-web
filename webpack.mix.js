const mix = require('laravel-mix');
require('./mix/hulk');
const tailwindcss = require('tailwindcss');

mix.sass('src/styles/app.scss', 'public/styles')
    .js('src/scripts/app.js', 'public/scripts')
    .hulk('src/templates/*.html')
    .options({
        postCss: [ tailwindcss('./tailwind.config.js') ],
    })
    .browserSync({
        proxy: 'http://covid.localtest.me/',
        files: [
            'src/**/*.*',
            'public/index.html',
            'public/templates/**/*.html',
        ]
    })
    .sourceMaps()
    ;