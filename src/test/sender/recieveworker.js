const workerpool = require('workerpool');
const fs = require('fs');
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 64 * CHUNK_SIZE;
function recieveChunkedData(partIndex, filepath, origin_path, filesize) {
  return new Promise((resolve, reject) => {
    const socket = require('socket.io-client')('http://localhost:4001');
    socket.connect();
    socket.emit('request_part', { partIndex: partIndex, filepath: origin_path });
  
    const part_start = partIndex * PART_SIZE;
    const part_end = Math.min(part_start + PART_SIZE, filesize);
    const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
    let receivedChunks = 0;
    const corrupted_chunks = [];
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
      console.log('All chunks received for part ' + partIndex);
      writeChunkToFile(filepath, chunks, part_start)
        .then(() => {
          socket.disconnect();
          resolve();
        })
        .catch(reject);
    });
  });
}

function writeChunkToFile(filepath, chunks, part_start) {
  return new Promise((resolve, reject) => {
    const chunkData = Buffer.concat(chunks);
    fs.open(filepath, "r+", (err, fd) => {
      if (err) {
        reject(err);
      } else {
        fs.write(fd, chunkData, 0, chunkData.length, part_start, (err, bytes) => {
          if (err) {
            reject(err);
          } else {
            console.log(bytes + " bytes written");
            resolve();
          }
        });
      }
    });
  });
}

  workerpool.worker({
    recieveChunkedData: recieveChunkedData});