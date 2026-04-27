// Run once with Node.js to generate tiny WAV sound effects
// node generate-sfx.js
const fs = require("fs");

function makeWav(samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);   // PCM
  buf.writeUInt16LE(1, 22);   // mono
  buf.writeUInt32LE(22050, 24);
  buf.writeUInt32LE(22050 * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  return buf;
}

const RATE = 22050;
function tone(freq, dur, env) {
  const n = Math.floor(RATE * dur);
  return Array.from({ length: n }, (_, i) => {
    const t = i / RATE;
    const e = env ? Math.exp(-env * t) : 1;
    return Math.sin(2 * Math.PI * freq * t) * e * 0.4;
  });
}

// blip — short beep
fs.writeFileSync("blip.wav", makeWav(tone(880, 0.08, 20)));
// coin — quick ascending chirp
fs.writeFileSync("coin.wav", makeWav([
  ...tone(660, 0.05, 10),
  ...tone(880, 0.07, 10),
]));
// shoot — click/zap
fs.writeFileSync("shoot.wav", makeWav(tone(440, 0.06, 40)));

console.log("Generated blip.wav, coin.wav, shoot.wav");
