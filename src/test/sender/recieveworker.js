const workerpool = require('workerpool');
const fs = require('fs');
async function recieveChunkedData(partIndex,filepath) {
    const socket = require('socket.io-client')('http://localhost:3000');
    await socket.connect();
    socket.emit('start', { partIndex: partIndex });    
    let receivedChunks = 0;
    const corrupted_chunks=[];
    const chunks = [];
    socket.on('chunk', ({ index, data }) => {
        console.log(`Received chunk ${index}`);
        chunks[index] = data;
        receivedChunks++;
        if (total_chunks === chunks.length) {
          socket.emit('end');
        }
      });
    socket.on('end', () => {
        console.log('All chunks received for part '+partIndex);
        writeChunkToFile(filepath, chunks, partIndex)
    });
    await socket.disconnect();
  }


  function writeChunkToFile(filepath,chunks, partIndex) {
    const chunkData = Buffer.concat(chunks);
    fs.writeFileSync(filepath, chunkData);
  }

  workerpool.worker({
    recieveChunkedData: recieveChunkedData});