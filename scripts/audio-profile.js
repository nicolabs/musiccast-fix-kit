const YamahaYXC = require('yamaha-yxc-nodejs');

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


module.exports = class Scenario {

  /**
    Expects a single 'source' field with the hostname/ip of the MusicCast device to listen to.

    E.g. { "source": "192.168.1.42" }
  */
  constructor( configuration ) {
    this.source = new YamahaYXC(configuration.source);
    console.debug("Source : ",this.source);
  }

  /**
    When the input changed :
      - will set the sound program according to the rules defined in inputSourceToSoundProgam
      - will set "clear voice" on or off according to the rules defined in inputSourceShouldUseClearVoice
  */
  onEvent( event ) {

    const isInputChanged = event.main && typeof event.main.input !== 'undefined';

    if (isInputChanged) {
      const soundProgram = inputSourceToSoundProgam(event.main.input);
      const setClearVoice = inputSourceShouldUseClearVoice(event.main.input);

      if (soundProgram) {
        console.log('Changing sound program to', soundProgram);
        this.source.setSound(soundProgram);
      }

      console.log('Setting clear voice to', setClearVoice);
      this.source.setClearVoice(setClearVoice);
    }

  }

}
