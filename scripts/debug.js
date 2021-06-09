const log = require('../logging');

module.exports = class Scenario {

  constructor( configuration ) {
    log.debug("Debug configuration : %o",configuration);
  }

  onEvent( event ) {
    log.debug("<<< %j",event);
  }
}
