const yargs = require('yargs');
const nodes = require('./nodes');

yargs.command({
    command: 'sort',
    describe: 'Vytvoření cesty',

    handler: function (argv) {
        nodes.sort(argv.clusters).forEach(x=>{
            console.log(x.address);
        })
    }
})

yargs.command({
    command: 'list',
    describe: 'Vypsání všech bodů',

    handler: function () {
        nodes.listNodes()
    }
})


yargs.parse();