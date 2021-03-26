const YamahaYXC = require('yamaha-yxc-nodejs');

module.exports = class Scenario {

  /**
    Expects a configuration in the form :

    {
      "source": <hostname/ip of the MusicCast device to listen to volume changes>,
      "target": [ <list of hostname/ip of the MC devices to reflect the volume of the source device>  ]

    E.g. { "source": "192.168.1.42", "targets": [ "192.168.1.43", "192.168.1.44" ] }
  */
  constructor( configuration ) {

    // Instanciates the source device and enrich with technical infos
    var source = new YamahaYXC(configuration.source);
    source.getDeviceInfo().
      then( result => {
        source.deviceInfo = JSON.parse(result);
        console.debug("Source :",source);
      }
    );
    this.source = source;

    // Instanciates the target devices
    this.targets = [];
    if ( Array.isArray(configuration.target) ) {
      for ( var t=0 ; t<configuration.target.length ; t++ ) {
        this.targets.push( new YamahaYXC(configuration.target[t]) );
      }
    } else {
      // We allow 'configuration.target' to be a string if only one value is given
      this.targets.push( new YamahaYXC(configuration.target) );
    }
    console.debug("Targets :",this.targets);
  }

  /**
    When the volume of the source has changed, will set the volume of all target devices to the same value.
    E.g. event = { main: { volume: 47 }, device_id: 'AC44F2852577' }
  */
  onEvent( event ) {

    // Filters out events without a volume
    if ( !event.main || typeof event.main.volume == 'undefined' ) {
      return;
    }
    // It seems that a device may report for another, linked one => we filter out those events
    if ( typeof event.device_id != undefined && event.device_id != this.source.deviceInfo.device_id ) {
      return;
    }

    // OK, let's handle this volume change
    console.log("<<<", event);

    for ( var t=0 ; t<this.targets.length ; t++ ) {
      console.log(">>>", this.targets[t].ip, ".setVolumeTo:", event.main.volume);
      this.targets[t].setVolumeTo(event.main.volume);
    }
  }

}
