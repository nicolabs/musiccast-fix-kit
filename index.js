const udp = require('dgram');
const server = udp.createSocket('udp4');
const http = require('http');

const YAMAHA_IP = process.env.YAMAHA_IP;
const SPEAKERS_IP = process.env.SPEAKERS_IP;
const LOCAL_IP = process.env.LOCAL_IP || "0.0.0.0";
const INCOMING_EVENT_SERVER_PORT = parseInt(process.env.PORT) || 41100;

const inputSourceToSoundProgam = inputSource => {
  switch (inputSource) {
    case 'airplay':
    case 'spotify':
      return 'music';

    case 'tv':
    case 'bd_dvd':
      return 'tv_program';

    default:
      return undefined;
  }
};

const inputSourceShouldUseClearVoice = inputSource => {
  switch (inputSource) {
    case 'tv':
    case 'bd_dvd':
      return true;

    default:
      return false;
  }
};

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
      console.error('Error', err.message);
    });

const sendSetSoundProgram = soundProgram =>
  send(
    YAMAHA_IP,
    `/YamahaExtendedControl/v1/main/setSoundProgram?program=${soundProgram}`
  );

const sendSetClearVoice = enabled =>
  send(
    YAMAHA_IP,
    `/YamahaExtendedControl/v1/main/setClearVoice?enabled=${
      enabled ? 'true' : 'false'
    }`
  );

const setVolume = (host,volume) =>
  send(host,'/YamahaExtendedControl/v1/main/setVolume?volume='+volume);

const sendEventServerAddress = port =>
  send(YAMAHA_IP,
    '/YamahaExtendedControl/v1', {
    'X-AppName': 'MusicCast/1',
    'X-AppPort': port
  });

const handleIncomingEvent = event => {
  console.log(event)
  const isInputChanged = event.main && typeof event.main.input !== 'undefined';

  // e.g. { main: { volume: 47 }, device_id: 'AC44F2852577' }
  if ( event.main && typeof event.main.volume !== 'undefined' ) {
    setVolume(SPEAKERS_IP,event.main.volume);
  }

  if (isInputChanged) {
    const soundProgram = inputSourceToSoundProgam(event.main.input);
    const setClearVoice = inputSourceShouldUseClearVoice(event.main.input);

    if (soundProgram) {
      console.log('Changing sound program to', soundProgram);
      //sendSetSoundProgram(soundProgram);
    }

    console.log('Setting clear voice to', setClearVoice);
    // sendSetClearVoice(setClearVoice);
  }
};

server.on('close', () => {
  console.log('Server is closed!');
});

server.on('error', error => {
  console.error('Error', error);
  server.close();
});

server.on('message', (msg, _info) => {
  let body = '';

  try {
    body = JSON.parse(msg.toString('utf8'));
  } catch (err) {
    console.warn('Could not parse event', msg.toString());
    return;
  }

  // console.log(body);
  handleIncomingEvent(body);
});

server.on('listening', () => {
  const address = server.address();
  const port = address.port;
  const ipaddr = address.address;

  console.log(
    'Incoming event server is listening at port',
    ipaddr + ':' + port
  );

  sendEventServerAddress(port);

  // After 10 minutes the receiver will drop this server to be notified unless we
  // say hi again, so to be on the safe side, ask again every 5 minutes.
  setInterval(() => sendEventServerAddress(port), 5 * 60 * 1000);
});

server.bind(INCOMING_EVENT_SERVER_PORT, LOCAL_IP);
