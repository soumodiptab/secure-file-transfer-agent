const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const fs = require('fs');
const numChunks = 184;
const PORT = 1234;
const outputFilePath = './downloads/xyz.pptx';

const receivedChunks = new Map();

server.on('message', (msg, rinfo) => {
  const chunkNum = msg.readInt32LE(0);
  const buffer = msg.slice(4);

  if (!receivedChunks.has(chunkNum)) {
    receivedChunks.set(chunkNum, buffer);

    const ack = Buffer.alloc(4);
    ack.writeInt32LE(chunkNum, 0);

    server.send(ack, 0, ack.length, rinfo.port, rinfo.address, (err) => {
      if (err) throw err;
      console.log(`Sent ack for chunk ${chunkNum}`);
    });

    if (receivedChunks.size === numChunks) {
      const chunks = Array.from(receivedChunks.values());
      const file = Buffer.concat(chunks);
      fs.writeFileSync(outputFilePath, file);
      console.log(`File saved to ${outputFilePath}`);
    }
  } else {
    const ack = Buffer.alloc(4);
    ack.writeInt32LE(chunkNum, 0);

    server.send(ack, 0, ack.length, rinfo.port, rinfo.address, (err) => {
      if (err) throw err;
      console.log(`Sent ack for chunk ${chunkNum}`);
    });
  }
});

server.on('error', (err) => {
  console.log(`Server error:\n${err.stack}`);
  server.close();
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Server listening ${address.address}:${address.port}`);
});

server.bind(PORT);