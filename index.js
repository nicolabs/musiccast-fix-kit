const yargs = require('yargs');
const path = require('path');
const log = require('winston');
const udp = require('dgram');
const server = udp.createSocket('udp4');
const http = require('http');
const YamahaYXC = require('yamaha-yxc-nodejs');

const LOCAL_IP = process.env.LOCAL_IP || "0.0.0.0";
const INCOMING_EVENT_SERVER_PORT = parseInt(process.env.PORT) || 41100;

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
          // console.log(data);
        });
      }
    )
    .on('error', err => {
      console.error('Error on send(',host,path,headers,') :', err.message);
    });

const sendEventServerAddress = (hostname,port) => {
    //console.debug("sendEventServerAddress",hostname,port);
    send(hostname,
      '/YamahaExtendedControl/v1', {
      'X-AppName': 'MusicCast/1',
      'X-AppPort': port
      }
    );
  };


server.on('close', () => {
  console.log('Server is closed!');
  // TODO ? Notify the device not to send events anymore ?
});

server.on('error', error => {
  console.error('Socket error (',host,path,headers,') :', error);
  server.close();
});

server.on('message', (msg, _info) => {
  let body = '';

  try {
    body = JSON.parse(msg.toString('utf8'));
    // console.log(body);
  } catch (err) {
    console.warn('Could not parse event', msg.toString());
    return;
  }

  // Runs each scenario on this event
  for ( s=0 ; s<scenarii.length ; s++ ) {
    scenarii[s].handler.onEvent(body);
  }
});

server.on('listening', () => {
  const address = server.address();
  const port = address.port;
  const ipaddr = address.address;

  console.log(
    'Incoming event server is listening at port',
    ipaddr + ':' + port
  );

  // Register at each configured 'source'
  var sourcesDict = {};
  for ( s=0 ; s<scenarii.length ; s++ ) {
    var scenario = scenarii[s];
    if ( scenario.conf && typeof scenario.conf !== 'undefined' &&
        scenario.conf.source && typeof scenario.conf.source !== 'undefined' ) {
          sourcesDict[scenario.conf.source] = true;
    }
  }
  var sourcesList = Object.keys(sourcesDict);
  for ( var s=0 ; s<sourcesList.length ; s++ ) {
    var source = sourcesList[s];
    console.log("Registering with port",port,"at ",source);
    sendEventServerAddress(source,port);

    // After 10 minutes the receiver will drop this server to be notified unless we
    // say hi again, so to be on the safe side, ask again every 5 minutes.
    setInterval(() => sendEventServerAddress(source,port), 5 * 60 * 1000);
  }
});

// Command line parsing
const argv = yargs
    .option('s', {
      alias: ['scripts'],
      describe: 'Load these .js files each implementing a scenario',
      requiresArg: true,
      type: 'array',
      demandOption: true
    })
    // --config : configuration as a whole .json file
    .config()
    .help()
    .alias('help', 'h')
    .argv;
log.debug("argv:", argv);

// Instanciates the handlers for each scenario
var scenarii = [];
const scripts = argv.scripts;
for ( var s=0 ; s<scripts.length ; s++ ) {
  var scenarioModule = scripts[s];

  console.log("Loading scenario :", scenarioModule);
  var scenarioClass = require(scenarioModule);

  var scenarioName = path.basename(scenarioModule, path.extname(scenarioModule));
  console.log("Scenario name :", scenarioName);
  // Merges top options and scenario-specific ones (specific overrides top ones)
  var conf = Object.assign({}, argv);
  if ( argv.conf !== undefined && argv.conf[scenarioName] !== undefined ) {
    conf = Object.assign(conf, argv.conf[scenarioName]);
  }
  console.log("Scenario conf. :", conf);

  scenarii.push({
    name: scenarioName,
    conf: conf,
    handler: new scenarioClass(conf)
  });
}
console.log("Scenarii :", scenarii);


server.bind(INCOMING_EVENT_SERVER_PORT, LOCAL_IP);
