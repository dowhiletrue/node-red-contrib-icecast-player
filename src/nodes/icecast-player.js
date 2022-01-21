const Parser = require("icecast-parser");
const lame = require("@suldashi/lame");
const Speaker = require("speaker");
module.exports = function (RED) {
    "use strict";
    const Parser = require("icecast-parser");
    const lame = require('@suldashi/lame');
    const Speaker = require('speaker');
    const { pipeline } = require('stream');
    console.log("export");
    function IcecastPlayer(config) {
        RED.nodes.createNode(this, config);
        this.url = config.url;
        const node = this;

        console.log("IcecastPlayer");

        RED.events.on("deploy", function(node) {
            console.log("deploy");
            stopStreaming();
        });

        function stopStreaming() {
            console.log('stopping called in onclose');
            if (!!node.stream) {
                console.log('unpipe')
                node.stream.emit('end');
                node.stream.unpipe();
                node.stream.destroy();
                node.stream = null;
            }
        }

        node.on('close', () => {
            console.log("onclose");
            stopStreaming();
        });

        node.on('input', function (msg) {
            if (!node.stream && msg.payload.action === "play") {
                if (!node.url) return new Error('URL not set!');
                const url = msg.payload.url? msg.payload.url : node.url
                let radioStation = new Parser({url: url, keepListen: true, autoUpdate: false});

                const decoder = new lame.Decoder();

                const speaker = new Speaker({
                    channels: 2,
                    bitDepth: 16,
                    sampleRate: 44100,
                });

                radioStation.on('metadata', metadata => {
                    node.status({fill:"green",shape:"dot",text:"playing" + (metadata.StreamTitle ? " " + metadata.StreamTitle : "")});
                    msg.payload = metadata;
                    node.send(msg);

                });

                radioStation.on('end', () => {
                    console.log('end')
                });

                radioStation.on('stream', stream => {
                    node.stream = stream;
                    node.status({fill:"green",shape:"dot",text:"playing"});
                    pipeline(stream, decoder, speaker, err => {
                        if (err) {
                            console.log('There is an error')
                            node.status({fill:"red",shape:"ring",text:"error"});
                        } else {
                            console.log('pipeline successful')
                            node.status({fill:"blue",shape:"ring",text:"stopped"});
                        }
                    });
                });
            }
            else if (msg.payload.action === 'stop') {
                stopStreaming();
            }
        });
    }

    RED.nodes.registerType("icecast-player", IcecastPlayer);
}