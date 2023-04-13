const workerpool = require('workerpool');
const fs = require('fs');
async function recieveChunkedData(partIndex,filepath,origin_path) {
    const socket = require('socket.io-client')('http://localhost:4001');
    socket.on('connect', () => {
      socket.emit('request_part', { partIndex: partIndex,filepath:origin_path });
      // socket.on('part_handshake', () => {
      //   socket.emit('start');
      // });
      
      let receivedChunks = 0;
      const corrupted_chunks=[];
      const chunks = [];
      socket.on('${partIndex}-chunk', ({ index, data }) => {
          console.log(`Received chunk ${index} of part ${partIndex}`);
          chunks[index] = data;
          receivedChunks++;
          if (total_chunks === chunks.length) {
            socket.emit('{partIndex}-end');
          }
        });
      socket.on('{partIndex}-end', () => {
          console.log('All chunks received for part '+partIndex);
          writeChunkToFile(filepath, chunks, partIndex)
          socket.disconnect();
      });
    });
  }


  function writeChunkToFile(filepath,chunks, partIndex) {
    const chunkData = Buffer.concat(chunks);
    fs.writeFileSync(filepath, chunkData);
  }

  workerpool.worker({
    recieveChunkedData: recieveChunkedData});