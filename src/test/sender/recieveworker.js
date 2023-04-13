const workerpool = require('workerpool');
const fs = require('fs');
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 256 * CHUNK_SIZE;
function recieveChunkedData(partIndex,filepath,origin_path,filesize) {
  const socket = require('socket.io-client')('http://localhost:4001');
  socket.connect();
  socket.emit('request_part', { partIndex: partIndex,filepath:origin_path });
    // socket.on('part_handshake', () => {
    //   socket.emit('start');
    // });
  const part_start = partIndex * PART_SIZE;
  const part_end = Math.min(part_start + PART_SIZE, filesize);
  const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
  let receivedChunks = 0;
  const corrupted_chunks=[];
  let chunks = [];
  socket.on('${partIndex}-chunk', ({ index, data }) => {
      console.log(`Received chunk ${index} of part ${partIndex}`);
      chunks[index] = data;
      receivedChunks++;
      if (receivedChunks === numChunks) {
          socket.emit('{partIndex}-end');
      }
    });
  socket.on('{partIndex}-end', () => {
      console.log('All chunks received for part '+partIndex);
      writeChunkToFile(filepath, chunks, part_start)
      socket.disconnect();
  });
}


  function writeChunkToFile(filepath,chunks, part_start) {
    const chunkData = Buffer.concat(chunks);
    fs.open(filepath, "r+", (err, fd) => {
      if (err) {
        console.log(err);
      } else {
        // console.log(fd);
        fs.write(fd, chunkData,0,chunkData.length,part_start, (err, bytes) => {
          if (err) {
            console.log(err.message);
          } else {
            console.log(bytes + " bytes written");
          }
        });
      }
    });
  }

  workerpool.worker({
    recieveChunkedData: recieveChunkedData});