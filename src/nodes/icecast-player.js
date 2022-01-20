const Parser = require("icecast-parser");
const lame = require("@suldashi/lame");
const Speaker = require("speaker");
module.exports = function (RED) {
    function IcecastPlayer(config) {
        RED.nodes.createNode(this, config);
        this.url = config.url;
        const node = this;
        const Parser = require("icecast-parser");
        const lame = require('@suldashi/lame');
        const Speaker = require('speaker');
        let radioStation
        node.on('input', function (msg) {
            if (!radioStation && msg.payload.action === "play") {
                playing = true;
                if (!node.url) return new Error('URL not set!');
                radioStation = new Parser({url: node.url, keepListen: true, autoUpdate: false});

                const decoder = new lame.Decoder();

                const speaker = new Speaker({
                    channels: 2,
                    bitDepth: 16,
                    sampleRate: 44100,
                });

                radioStation.on('metadata', metadata => {
                    msg.payload = metadata;
                    node.send(msg);

                });

                radioStation.on('end', () => {
                    console.log('end')
                });

                radioStation.on('stream', stream => {
                    node.stream = stream;
                    stream.pipe(decoder).pipe(speaker)
                });
            }
            else if (msg.payload.action === 'stop' && !!node.stream) {
                console.log('unpipe')
                node.stream.unpipe();
                node.stream.destroy();
                node.stream = null;
                radioStation = null;
            }
        });
    }

    RED.nodes.registerType("icecast-player", IcecastPlayer);
}