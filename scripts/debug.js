module.exports = class Scenario {

  constructor( configuration ) {
    console.debug("Debug configuration :",configuration);
  }

  onEvent( event ) {
    console.debug("<<<",event);
  }
}
