#!/usr/bin/env node

const yargs = require('yargs');
const path = require('path');
const log = require('./logging');
const udp = require('dgram');
const http = require('http');
const YamahaYXC = require('yamaha-yxc-nodejs').YamahaYXC;

const LOCAL_IP = process.env.LOCAL_IP || "0.0.0.0";
const INCOMING_EVENT_SERVER_PORT = parseInt(process.env.PORT) || 41100;



// Takes signals into account (and also Ctrl+C from the console)
// See https://github.com/nodejs/node/issues/4182
function exitOnSignal(signal) {
  process.on(signal, function() {
    process.exit(1);
  });
}
exitOnSignal('SIGINT');
exitOnSignal('SIGTERM');



//
// MusicCast utility functions
//

const send = (host, path, headers) =>
  http
    .get(
      {
        localAddress: LOCAL_IP,
        host: host,
        path,
        timeout: 3000,
        headers: {
          'User-Agent': 'yamaha-sound-program-by-source',
          Accept: 'application/vnd.musiccast.v1+json',
          ...headers
        }
      },
      resp => {
        let data = '';

        resp.on('data', chunk => {
          data += chunk;
        });

        resp.on('end', () => {
          // log.info(data);
        });
      }
    )
    .on('error', err => {
      log.error('Error on send(',host,path,headers,') :', err.message);
    });

const sendEventServerAddress = (hostname,port) => {
    //log.debug("sendEventServerAddress %s %s",hostname,port);
    send(hostname,
      '/YamahaExtendedControl/v1', {
      'X-AppName': 'MusicCast/1',
      'X-AppPort': port
      }
    );
  };




//
// Instanciates the server
//

const server = udp.createSocket('udp4');

server.on('close', () => {
  log.info('Server is closed!');
  // TODO ? Notify the device not to send events anymore ?
});

server.on('error', error => {
  log.error('Socket error (',host,path,headers,') :', error);
  server.close();
});

// Executes the scenarii for each received MusicCast message
server.on('message', (msg, _info) => {
  let body = '';

  try {
    body = JSON.parse(msg.toString('utf8'));
    // log.info(body);
  } catch (err) {
    log.warn('Could not parse event', msg.toString());
    return;
  }

  // Runs each scenario on this event
  for ( s=0 ; s<scenarii.length ; s++ ) {
    scenarii[s].handler.onEvent(body);
  }
});

// Initializes the server once it is listening to the network
server.on('listening', () => {
  const address = server.address();
  const port = address.port;
  const ipaddr = address.address;

  log.info( 'Incoming event server is listening at port %s:%s', ipaddr, port );

  // Register at each configured 'source'
  var sourcesDict = {};
  for ( s=0 ; s<scenarii.length ; s++ ) {
    var scenario = scenarii[s];
    if ( scenario && typeof scenario !== 'undefined' &&
        scenario.conf.source && typeof scenario.conf.source !== 'undefined' ) {
          sourcesDict[scenario.conf.source] = true;
    }
  }
  var sourcesList = Object.keys(sourcesDict);
  for ( var s=0 ; s<sourcesList.length ; s++ ) {
    var source = sourcesList[s];
    log.info("Registering with port %s at %s",port,source);
    sendEventServerAddress(source,port);

    // After 10 minutes the receiver will drop this server to be notified unless we
    // say hi again, so to be on the safe side, ask again every 5 minutes.
    setInterval(() => sendEventServerAddress(source,port), 5 * 60 * 1000);
  }
});



//
// Command line parsing
//

const argv = yargs
    .option('s', {
      alias: ['scripts'],
      describe: 'Load these .js files each implementing a scenario',
      requiresArg: true,
      type: 'array',
      demandOption: true
    })
    .option('l', {
      alias: ['log-level'],
      describe: 'Specifies the logging level',
      choices: ['error','warn','info','http','verbose','debug','silly'],
      type: 'string'
    })
    // --config : configuration as a whole .json file
    .config('config')
    // -c : shortcut for --config
    .config('c')
    .help()
    .alias('help', 'h')
    .argv;

// Reflects log level option
if ( argv.l !== undefined ) {
  log.level = argv.l;
}

log.debug("argv: %o", argv);



//
// Bootstrap configuration : instanciates the handlers for each scenario
//

var scenarii = [];
const scripts = argv.scripts;
for ( var s=0 ; s<scripts.length ; s++ ) {
  var scenarioModule = scripts[s];

  log.debug("Loading scenario : %s", scenarioModule);
  var scenarioClass = require(scenarioModule);

  var scenarioName = path.basename(scenarioModule, path.extname(scenarioModule));
  log.debug("Scenario name : %s", scenarioName);
  // Merges top options and scenario-specific ones (specific overrides top ones)
  var conf = Object.assign({}, argv);
  if ( argv !== undefined && argv[scenarioName] !== undefined ) {
    conf = Object.assign(conf, argv[scenarioName]);
  }
  log.debug("Scenario conf : %o :", conf);

  scenarii.push({
    name: scenarioName,
    conf: conf,
    handler: new scenarioClass(conf)
  });
}
log.info("Scenarii : %o", scenarii);



//
// Starts the server
//

log.debug("server.bind(%s,%s)", INCOMING_EVENT_SERVER_PORT, LOCAL_IP);
server.bind(INCOMING_EVENT_SERVER_PORT, LOCAL_IP);
