const log = require('winston');

module.exports = class Scenario {

  constructor( configuration ) {
    log.debug("Debug configuration :",configuration);
  }

  onEvent( event ) {
    log.debug("<<<",event);
  }
}
