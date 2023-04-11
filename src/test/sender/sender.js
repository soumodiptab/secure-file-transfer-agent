const dgram = require('dgram');
const fs = require('fs');

const socket = dgram.createSocket('udp4');
const HOST = '127.0.0.1';
const PORT = 1234;
// const FILE_PATH = './src/test/sender/testing.txt';
const FILE_PATH = './xyz.pptx';
const PACKET_SIZE = 65000;

const file = fs.readFileSync(FILE_PATH);
const numPackets = Math.ceil(file.length / PACKET_SIZE);
console.log(`Sending ${numPackets} chunks`);
let nextPacket = 0;
let retries = new Map();

function sendNextPacket(packetNum) {
    // const packetNum = nextPacket;
    const start = packetNum * PACKET_SIZE;
    const end = Math.min(start + PACKET_SIZE, file.length);
    const packet = Buffer.alloc(end - start + 4);
    packet.writeInt32LE(packetNum, 0);
    file.copy(packet, 4, start, end);

    socket.send(packet, 0, packet.length, PORT, (err) => {
      if (err) throw err;
      console.log(`Sent packet ${packetNum}`);
      retries.set(packetNum, 0); 
    //   nextPacket++;
    //   setTimeout(sendNextPacket, 50);
    
    });
}

socket.on('message', (msg) => {
  const packetNum = msg.readInt32LE(0);
  retries.delete(packetNum);
  console.log(`Received ack for packet ${packetNum}`);
  if (retries.size === 0) {
    console.log('All packets sent and acknowledged, closing socket');
    socket.close();
    }
});

socket.on('error', (err) => {
  console.log(`Socket error: ${err.message}`);
});

// socket.on('listening', () => {
//   console.log(`Sender listening on ${socket.address().address}:${socket.address().port}`);
//   sendNextPacket();
// });

setInterval(() => {
  retries.forEach((value, packetNum) => {
    if (value < 50) {
      const start = packetNum * PACKET_SIZE;
      const end = Math.min(start + PACKET_SIZE, file.length);
      const chunkBuffer = file.slice(start, end);
      const packet = Buffer.alloc(end - start + 4);
      packet.writeInt32LE(packetNum, 0);
      chunkBuffer.copy(packet, 4);
      socket.send(packet, 0, packet.length, PORT, (err) => {
        if (err) throw err;
        console.log(`Resent packet ${packetNum} (retry ${value + 1})`);
        retries.set(packetNum, value + 1);
      });
    } else {
      console.log(`Failed to send packet ${packetNum} after 5 retries, giving up.`);
      retries.delete(packetNum);
    }
  });
}, 5000);

for (let i = 0; i < numPackets; i++) {
    sendNextPacket(i);
}