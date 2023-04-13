const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 256 * CHUNK_SIZE;
const fs = require('fs');
const io = require('socket.io-client');
const workerpool = require('workerpool');
const pool = workerpool.pool('./recieveworker.js');

const socket = io('http://localhost:4000');
const filename = './test.mkv';
const downloadname = './download.mkv';
let total_parts=0;
let total_size=0;
socket.connect();
console.log('Receiver connected');
socket.emit('file', { file_path: filename });
socket.on('init', ({ parts,filesize }) => {
  console.log(`Number of parts: ${parts}`);
  total_parts=parts;
  total_size=filesize;
  fs.writeFileSync(downloadname, Buffer.alloc(total_size));
  console.log('Empty File created.. of size '+total_size);
  // fun(2,downloadname,filename,total_size);
  for (let i = 0; i < total_parts; i++) {
    pool.exec('recieveChunkedData', [i,downloadname,filename,total_size]).then(() => {
      console.log('Part ' + i + ' recieved');
    }).catch((err) => {
      console.error(err);
    });
  }

});


// function fun(partIndex,filepath,origin_path,filesize){

//   const socket = require('socket.io-client')('http://localhost:4001');
//     socket.on('connect', () => {
//       socket.emit('request_part', { partIndex: partIndex,filepath:origin_path });
//       // socket.on('part_handshake', () => {
//       //   socket.emit('start');
//       // });
//       const part_start = partIndex * PART_SIZE;
//       const part_end = Math.min(part_start + PART_SIZE, filesize);
//       const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
//       let receivedChunks = 0;
//       const corrupted_chunks=[];
//       let chunks = [];
//       socket.on('${partIndex}-chunk', ({ index, data }) => {
//           console.log(`Received chunk ${index} of part ${partIndex}`);
//           chunks[index] = data;
//           receivedChunks++;
//           if (receivedChunks === numChunks) {
//               socket.emit('{partIndex}-end');
//           }
//         });
//       socket.on('{partIndex}-end', () => {
//           console.log('All chunks received for part '+partIndex);
//           writeChunkToFile(filepath, chunks, part_start)
//           socket.disconnect();
//       });
//     });
// }


// socket.disconnect();
