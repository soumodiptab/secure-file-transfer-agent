const fs = require('fs');
const io = require('socket.io-client');

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  let total_chunks=0;
  console.log('Receiver connected');
  socket.on('init', ({ chunks }) => {
    console.log(`Number of chunks: ${chunks}`);
    total_chunks=chunks;
  });
  socket.emit('start');

  let receivedChunks = 0;
  const chunks = [];

  socket.on('chunk', ({ index, data }) => {
    console.log(`Received chunk ${index}`);
    chunks[index] = data;
    receivedChunks++;

    if (total_chunks === chunks.length) {
      // All chunks received, write the file
      const filePath = './download.mkv';
      fs.writeFileSync(filePath, Buffer.concat(chunks));
      console.log('File saved');
    }
  });

  socket.on('end', () => {
    console.log('All chunks received');
    socket.disconnect();
  });
});