const Parser = require("icecast-parser");
const lame = require('@suldashi/lame');
const Speaker = require('speaker');

const radioStation = new Parser({ url: "http://stream.srg-ssr.ch/m/regi_be_fr_vs/mp3_128", keepListen: true });

const decoder = new lame.Decoder();

const speaker = new Speaker({
  channels: 2,
  bitDepth: 16,
  sampleRate: 44100,
});

radioStation.on('metadata', metadata => console.log(metadata));

radioStation.on('stream', stream => stream.pipe(decoder).pipe(speaker)
);


