# MusicCast "repair kit" 🩹

[![Docker Hub](https://github.com/nicolabs/musiccast-repairkit/actions/workflows/dockerhub.yml/badge.svg)](https://hub.docker.com/r/nicolabs/musiccast-repairkit) [![GitHub repo](https://img.shields.io/badge/GitHub-repo-pink.svg?logo=github)](https://github.com/nicolabs/musiccast-repairkit) [![Buy us a tree](https://img.shields.io/badge/Plant%20trees-%F0%9F%8C%B3-lightgreen)](https://plant.treeware.earth/nicolabs/musiccast-repairkit)

This software implements missing features for your [Yamaha MusicCast©](https://usa.yamaha.com/products/contents/audio_visual/musiccast/index.html) devices by using their embedded Application Programming Interface (API).

You will have to run this program on an always-on machine, connected to the same WiFi / Ethernet nertwork as your MusicCast devices so that it can communicate with them.

The behavior is managed by enabling and configuring scenarios, each doing a specific task. You can even code your own scenarios.


## Scenarios

Each scenario is implemented as a script, written in JavaScript (run with [NodeJs](https://nodejs.org/)).

There is no guide on how to develop your own scenario, but you should look at the existing scripts, which are easy to understand for any JavaScript programmer.
Basically they work by watching events over the network (e.g. volume or source change) and calling accordingly the API of the MusicCast devices.

Scenarios are already provided in the [scripts](./scripts) directory in this project, for the following use cases :

- [change the sound program when the source changes](#scenario-automatic-sound-program-depending-on-the-source)
- [synchronize the volume of several devices](#scenario-synchronize-volume-of-several-devices)
- [standby several devices together](scenario-standby-several-devices-together)


### Scenario : Automatic sound program depending on the source

![Illustration : source buttons on remote](doc/source-buttons.png)

*This is the script that comes from the original project, [axelo/yamaha-sound-program-by-source](https://github.com/axelo/yamaha-sound-program-by-source).*

#### What it does

When the input source of your Yamaha receiver changes, the sound program and clear voice settings are automatically changed.

#### How to configure

Currently the following mappings from source to sound program are hard coded. You can change them by editing the script directly.

    tv => tv_program with clear_voice enabled
    bd_dvd => tv_program with clear_voice enabled
    spotify => music with clear_voice disabled
    airplay => music with clear_voice disabled

On the command line, use `-s scripts/audio-profile.js` to enable this script and use the `--audio-profile.source=<source_IP>` option to set the hostname or IP address of the receiver.

Top-level options (e.g. `--source`) and configuration file are also valid (see instructions below).


### Scenario : Synchronize volume of several devices

![Illustration : volume buttons on remote](doc/volume-buttons.png)

#### What it does

If you have a Yamaha MusicCast receiver (like *CRX N470D*) connected to ***wireless*** Yamaha MusicCast speakers (like a MusicCast 20 stereo pair), you may have noticed that **using the device's physical volume button or the IR remote will not update the volume of the wireless speakers**. Those hardware buttons only work with speakers physically wired to the CRX receiver.

Your only option to set the same volume to all connected devices is to use the Yahama MusicCast mobile app, which is far less user-friendly than the physical remote.

This script will solve this by listening to volume changes on a source device and applying them on one or more target devices.

#### How to configure

On the command line, use `-s scripts/sync-volume.js` to enable this script and use the following options :
- `--sync-volume.source=<source_IP>` sets the hostname or IP address of the *master* receiver
- `--sync-volume.target=<target_IP [target_IP [...]]>` lists the *slave* devices that will reflect the master's volume changes. You can separate them with a space or pass the option several times.

Top-level options (e.g. `--source`) and configuration file are also valid (see instructions below).


### Scenario : Standby several devices together

#### What it does

It sometimes happens that wirelessly-linked devices don't go to standby mode or don't awake together with the main one.
It may be a bug or a network reliability issue or whatever, but it forces you to physically put them on/off.

This script will automatically force a given list of devices to power on or off together with the main device.

#### How to configure

On the command line, use `-s scripts/standby-together.js` to enable this script and use the following options :
- `--standby-together.source=<source_IP>` sets the hostname or IP address of the *master* receiver
- `--standby-together.target=<target_IP [target_IP [...]]>` lists the *slave* devices that will follow the master's power status. You can separate them with a space or pass the option several times.

Top-level options (e.g. `--source`) and configuration file are also valid (see instructions below).


## Command line usage

This program requires [Node.js](https://nodejs.org) to run.

Previously to running it, you need to install dependencies by running the following command in the source directory :

    npm install

When running the program you need to specify which scenarios to run.
The scenarios are `.js` scripts which implement the use cases above. More details in the next sections.

Use the **`-s` command line option to specify which script(s) to load** ; for example :

    node . -s ./scripts/sync-volume.js --source=192.168.1.42 --target=192.168.1.43 --target=192.168.1.44

You can pass all options on the command line, or use the **`--config` option to store them in a JSON file** ; example :

    node . -s ./scripts/sync-volume.js --config config.json

Contents of config.json :

```json
{
  "sync-volume": {
    "source": "192.168.1.42",
    "target": [
      "192.168.1.43",
      "192.168.1.44"
    ]
  }
}
```

You can define **generic options** at the top level and **scenario-specific options** under a prefix named after the script's name (its filename without extension).
For instance with `--source 1.2.3.4 --sync-volume.source 5.6.7.8`, `1.2.3.4` will be used as the *source* parameter by default but `5.6.7.8` will be used for the *sync-volume* scenario only.

You can pass those arguments multiple times or provide space-separated values if you need to.

The following **environment variables** may be specified before running `index.js` :

    LOCAL_IP  # The local IP address of this program, 0.0.0.0 could work in some setups
    PORT      # Port listening for events from the receiver, defaults to 41100

Example

    PORT=44444 LOCAL_IP=192.168.1.187 node . [...]



## Docker usage

Instead of installing _Node.js_ and running this program from sources you can run it directly from a [Docker](https://www.docker.com/) image :

    docker run -d --network=host nicolabs/musiccast-repairkit:1.1 -s ./scripts/standby-together.js --source 192.168.1.42 --target 192.168.1.43

See also [docker-compose.yml](docker-compose.yml) for a deployment template.

This sample contains an example *command* that you shall override to fit your needs.
You can edit it locally to reflect the IP addresses of your setup (or use a `.env` file or set environment variables).
It should not be necessary to define a `LOCAL_IP` environment variable as IP addresses inside the container will likely don't match the one of the host.


### Build & deploy Docker image

Build :

    docker-compose build

Or build for multiple platforms :

    docker buildx build --platform linux/amd64,linux/arm/v6,linux/arm/v7,linux/arm64/v8,linux/ppc64le,linux/s390x -t nicolabs/musiccast-repairkit .

Run locally :

    docker-compose up --detach

Deploy on a swarm cluster :

    docker stack deploy -c docker-compose.yml musiccast-repairkit



## Logging and debugging

There is an option `-l` to change the default logging level ; the most useful option might be `-l debug`.

Otherwise, logging is set in the [`logging.js`](logging.js) module : feel free to override it locally or in your custom Docker image.

There is a special `scripts/debug.js` script that does nothing but print debug informations. It is simply loaded as a scenario (you need to set log level to *debug* at least) :

    node . -s ./scripts/sync-volume.js ./scripts/debug.js -l debug --source=192.168.1.42 ...


Note : Node.Js natively allows to log network activity :

    NODE_DEBUG="net" node index.js ...


## References

- http://habitech.s3.amazonaws.com/PDFs/YAM/MusicCast/Yamaha%20MusicCast%20HTTP%20simplified%20API%20for%20ControlSystems.pdf
- https://www.pdf-archive.com/2017/04/21/yxc-api-spec-advanced/yxc-api-spec-advanced.pdf
- https://github.com/samvdb/php-musiccast-api
- [musiccast2mqtt, another implementation with MQTT, but old](https://github.com/ppt000/musiccast2mqtt) ([doc](https://musiccast2mqtt.readthedocs.io/en/latest/))


## Licence

This package is [Treeware](https://treeware.earth). If you use it in production, then we ask that you [**buy the world a tree**](https://plant.treeware.earth/nicolabs/musiccast-repairkit) to thank us for our work. By contributing to the Treeware forest you’ll be creating employment for local families and restoring wildlife habitats.
