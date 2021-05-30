
let Verify, Assert;
const mix = require('laravel-mix');
const FileCollection = require('laravel-mix/src/FileCollection');
const Task = require('laravel-mix/src/tasks/Task');
// laravel-mix@1.x
try { Verify = require('laravel-mix/src/Verify'); }
// laravel-mix@>=2.x
catch (e) { Assert = require('laravel-mix/src/Assert'); }

const notifier = require('node-notifier');
const glob = require('glob');
const { execSync } = require("child_process");

class HulkTask extends Task {
    run() {
        this.files = new FileCollection(glob.sync(this.data.src));
    }

    onChange(changed) {
        execSync(`npx hulk ${this.data.src} > public/scripts/templates.min.js`);
        console.log(`${changed} Changed. Templates compiled.`);
    }
}

mix.extend('hulk', function(webpackConfig, src) {
    // laravel-mix@1.x
    if (Verify != null) Verify.dependency('hogan.js', ['hogan.js'], true);
    // laravel-mix@>=2.x
    else Assert.dependencies(['hogan.js'], true);

    Mix.addTask(new HulkTask({
        src
    }));
});