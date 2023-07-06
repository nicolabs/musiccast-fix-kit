const log = require('../logging');
const YamahaYXC = require('yamaha-yxc-nodejs').YamahaYXC;

module.exports = class Scenario {

  /**
    Expects a configuration in the form :

    {
      "source": <hostname/ip of the MusicCast device to listen to standby status changes>,
      "target": [ <list of hostname/ip of the MC devices to put on/off following the source device status>  ]

    E.g. { "source": "192.168.1.42", "target": [ "192.168.1.43", "192.168.1.44" ] }
  */
  constructor( configuration ) {

    // Instanciates the source device and enrich with technical infos
    var source = new YamahaYXC(configuration.source);
    source.getDeviceInfo().
      then( result => {
        // result is a JSON object
        source.deviceInfo = result;
        log.debug("Source : %s",source);
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
    log.debug("Targets : %s",this.targets);
  }

  /**
    Puts off target devices when the source one goes off/standby.
    Puts on target devices when the source one goes on.
    E.g. event = { main: { power: "standby" }, device_id: 'AC44F2852577' }
  */
  onEvent( event ) {

    // Filters out events
    if ( !event.main || typeof event.main.power == 'undefined' ) {
      return;
    }
    // It seems that a device may report for another, linked one => we filter out those events
    if ( typeof event.device_id != undefined && event.device_id != this.source.deviceInfo.device_id ) {
      return;
    }

    log.info("<<< Received power change event : %j", event);

    for ( var t=0 ; t<this.targets.length ; t++ ) {
      // Here we use YamahaYXC's API to implement our behaviour
      log.info(">>> Sending power '%s' to %s", event.main.power, this.targets[t].ip );
      // Possible values for 'power' are : 'on' or 'standby' (see https://github.com/foxthefox/yamaha-yxc-nodejs)
      this.targets[t].power(event.main.power);
    }
  }

}
