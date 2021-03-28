# MusicCast "repair kit"

[![Docker Hub](https://github.com/nicolabs/musiccast-repairkit/actions/workflows/dockerhub.yml/badge.svg)](https://hub.docker.com/r/nicolabs/musiccast-repairkit)

This program will automatically implement missing features for your [Yamaha MusicCast©](https://usa.yamaha.com/products/contents/audio_visual/musiccast/index.html) devices for you by watching events (e.g. volume or source change) and updating the settings according to your scenarios.

Scenarios are pluggable scripts that you can implement in [NodeJs](https://nodejs.org/). Scripts are already provided for the following use cases :

- change the sound program when you're switching from e.g. TV to Spotify and vice verse
- synchronize the volume of two devices


## Command line usage

When running the program you need to specify which scenarios to run.
The scenarios are `.js` scripts which implement the use cases above. More details in the next sections.

Use the `-s` command line option to specify which script to load :

  node . -s ./scripts/sync-volume.js ./scripts/debug.js --source=192.168.1.42 --target=192.168.1.43 --target=192.168.1.44

Or in a configuration file :

```json
{
  "conf": {
    "sync-volume": {
      "source": "192.168.1.43",
      "target": [
        "192.168.1.43",
        "192.168.1.44"
      ]
    }
  }
}
```

Then use the `--config` option :

  node . -s ./scripts/sync-volume.js ./scripts/debug.js --config config.json

You can define generic options at the top level and scenario-specific options under a prefix named after the script's name (its filename without extension).
For instance with `--source 1.2.3.4 --conf.sync-volume.source 5.6.7.8`, `1.2.3.4` will be used as the *source* parameter by default but `5.6.7.8` will override its value for the *sync-volume* scenario only.

You can pass those arguments multiple times or give several values if you need to.

The following environment variables may be specified before running `index.js` :

    LOCAL_IP # Your local ip address to use, 0.0.0.0 could work in some setups
    PORT # Port listening for events from the receiver, defaults to 41100

Example

    PORT=44444 LOCAL_IP=192.168.1.187 node .


## Scenarios

### Automatic sound program depending on the source

When the input source of your Yamaha receiver changes, the sound program and clear voice settings are automatically changed.

Currently the following mappings from source to sound program are hard coded

    tv => tv_program with clear_voice enabled
    bd_dvd => tv_program with clear_voice enabled
    spotify => music with clear_voice disabled
    airplay => music with clear_voice disabled

On the command line, use `-s scripts/sync-volume.js` to enable this script and use the `--conf-sync-volume-source` option to set the hostname or IP address of the receiver.

Top-level options (e.g. `--source`) and configuration file are also valid.


### Sync volume of two devices

If you have a Yamaha MusicCast receiver (like *CRX N470D*) *wirelessly* connected to Yamaha MusicCast speakers (like a MusicCast 20 stereo pair), you may have noticed that using the front volume button or the IR remote from the CRX will not update the volume of the linked speakers. Those hardware buttons only work with speakers wired to the CRX receiver. Your only option to set the same volume to all connected devices is to use the Yahama MusicCast mobile app, which is far less user-friendly than the physical remote.

This program will solve this by listening to a source device and applying any volume change to a target one.

On the command line, use `-s scripts/audio-profile.js` to enable this script and use the following options :
- `--conf-audio-profile-source` sets the hostname or IP address of the *master* receiver
- `--conf-audio-profile-target` is a space-separated list of *slave* devices that will be updated with the master's volume

Top-level options (e.g. `--source`) and configuration file are also valid.



## Docker build & run

Update `docker-compose.yml` to reflect the IP addresses of your setup (or use a `.env` file or set environment variables).

Build :

    docker-compose build

Run locally :

    docker-compose up --detach

Deploy on a swarm :

    docker stack deploy -c docker-compose.yml musiccast-repairkit



## Logging and debugging

This will log network activity :

    NODE_DEBUG="net" node index.js ...


# References

- http://habitech.s3.amazonaws.com/PDFs/YAM/MusicCast/Yamaha%20MusicCast%20HTTP%20simplified%20API%20for%20ControlSystems.pdf
- https://www.pdf-archive.com/2017/04/21/yxc-api-spec-advanced/yxc-api-spec-advanced.pdf
- https://github.com/samvdb/php-musiccast-api
- [musiccast2mqtt, another implementation with MQTT, but old](https://github.com/ppt000/musiccast2mqtt) ([doc](https://musiccast2mqtt.readthedocs.io/en/latest/))
