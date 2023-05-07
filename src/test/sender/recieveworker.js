const workerpool = require('workerpool');
const path = require('path');
const fs = require('fs');
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 64 * CHUNK_SIZE;
let ss = require('socket.io-stream');
function recieveChunkedData(partIndex, filename, download_path) {
  return new Promise((resolve, reject) => {
    const socket = require('socket.io-client')('http://localhost:4000');
    socket.connect();
    socket.emit('request_part', { partIndex: partIndex, filepath: filename });
    const filebasename = path.basename(filename);
    const destination_path = path.join(download_path, `${filebasename}-p-${partIndex}.part`);
    ss(socket).on('part', (stream) => {
      stream.pipe(fs.createWriteStream(destination_path));
      stream.on('finish', () => {
        console.log('part recieved');
        socket.disconnect();
        resolve();
      });
    });
    // const part_start = partIndex * PART_SIZE;
    // const part_end = Math.min(part_start + PART_SIZE, filesize);
    // const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
    // let receivedChunks = 0;
    // const corrupted_chunks = [];
    // let chunks = [];
  
    // socket.on('${partIndex}-chunk', ({ index, data }) => {
    //   // console.log(`Received chunk ${index} of part ${partIndex}`);
    //   chunks[index] = data;
    //   receivedChunks++;
    //   if (receivedChunks === numChunks) {
    //     socket.emit('{partIndex}-end');
    //   }
    // });
  
    // socket.on('{partIndex}-end', () => {
    //   console.log('All chunks received for part ' + partIndex);
    //   writeChunkToFile(filepath, chunks, part_start)
    //     .then(() => {
    //       socket.disconnect();
    //       resolve();
    //     })
    //     .catch(reject);
    // });


  });
}

// async function writeChunkToFile(filepath, chunks, part_start) {
//   return new Promise((resolve, reject) => {
//     const chunkData = Buffer.concat(chunks);
//     fs.open(filepath, "r+", (err, fd) => {
//       if (err) {
//         reject(err);
//         console.log(err);
//       } else {
//         fs.write(fd, chunkData, 0, chunkData.length, part_start, (err, bytes) => {
//           if (err) {
//             reject(err);
//             console.log(err);
//           } else {
//             console.log(bytes + " bytes written");
//             resolve();
//           }
//         });
//       }
//     });
//   });
// }

  workerpool.worker({
    recieveChunkedData: recieveChunkedData});