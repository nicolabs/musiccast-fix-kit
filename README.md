# musiccat-repairkit

Instead of having to manually change the sound program when you're switching from e.g. TV to Spotify and vice verse, let the computer do it for you.

When the input source of your Yamaha receiver changes, the sound program and clear voice settings are automatically changed.

## Usage

Specify the following env variables before running `index.js`

    YAMAHA_IP # The ip address to your receiver
    LOCAL_IP # Your local ip address to use, 0.0.0.0 could work in some setups
    PORT # Port listening for events from the receiver, defaults to 41100

Example

    YAMAHA_IP=192.168.1.216 LOCAL_IP=192.168.1.187 node .

## Misc

Currently the following mappings from source to sound program are hard coded

    tv => tv_program with clear_voice enabled
    bd_dvd => tv_program with clear_voice enabled
    spotify => music with clear_voice disabled
    airplay => music with clear_voice disabled

## Use case : sync volume from a device to another one

1. Subscribe to events at the source device. It's UDP : the code for this part comes from [axelo/yamaha-sound-program-by-source](https://github.com/axelo/yamaha-sound-program-by-source)).

2. In the events received, identify those who define a volume update.
	# 2. Récupérer le volume sur la chaîne (controlé par télécommand IR / bouton en facade)
	GET http://192.168.1.31/YamahaExtendedControl/v1/main/getStatus
	-> contient /volume = 32

	# 3. Positionner le volume des enceintes à la même valeur
	GET http://192.168.1.33/YamahaExtendedControl/v1/main/setVolume?volume=20


## Docker build & run

Build :

  docker-compose build

Run locally, then stop :

  docker-compose up --detach
  docker-compose down

Deploy on a swarm :

  docker stack deploy -c docker-compose.yml musiccast-repairkit


## MQTT

https://github.com/ppt000/musiccast2mqtt
https://musiccast2mqtt.readthedocs.io/en/latest/

	pip install --user musicast2mqtt
	musiccast2mqtt

Marche bien, mais c'est du Python 2.
On voit bien les events de mise à jour du volume.
Le projet contient de la doc sur le protocole MusicCast également !


# References

http://habitech.s3.amazonaws.com/PDFs/YAM/MusicCast/Yamaha%20MusicCast%20HTTP%20simplified%20API%20for%20ControlSystems.pdf

https://www.pdf-archive.com/2017/04/21/yxc-api-spec-advanced/yxc-api-spec-advanced.pdf

https://github.com/samvdb/php-musiccast-api


# TODO

Rename index.js to server.js and remove the start script from package.json (server.js is the default for npm start)
