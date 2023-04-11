const fs = require('fs');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PORT = 1234;
const HOST = '127.0.0.1';

const file = fs.readFileSync('./xyz.pptx');
const fileSize = file.length;
const chunkSize = 65000; // Adjust this to determine the size of each packet
const numChunks = Math.ceil(fileSize / chunkSize);
console.log(`Sending ${numChunks} chunks`);
let sentChunks = new Array(numChunks).fill(false);
let lastAcked = -1;

function sendChunk(chunkNum) {
  const start = chunkNum * chunkSize;
  const end = Math.min(start + chunkSize, fileSize);
  const buffer = file.slice(start, end);

  let message = Buffer.alloc(4);
  message.writeInt32LE(chunkNum, 0);
  message = Buffer.concat([message, buffer]);

  server.send(message, 0, message.length, PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`Sent chunk ${chunkNum}`);
  });
}

server.on('message', (msg) => {
  const ackNum = msg.readInt32LE(0);

  if (ackNum > lastAcked) {
    for (let i = lastAcked + 1; i <= ackNum; i++) {
      sentChunks[i] = true;
    }
    lastAcked = ackNum;
  }

  const finished = sentChunks.every((sent) => sent);
  if (finished) {
    console.log('File sent successfully');
    server.close();
  } else {
    const unsentChunks = sentChunks.reduce((acc, sent, i) => {
      if (!sent) {
        acc.push(i);
      }
      return acc;
    }, []);
    unsentChunks.forEach((chunkNum) => {
      sendChunk(chunkNum);
    });
  }
});

for (let i = 0; i < numChunks; i++) {
  sendChunk(i);
}