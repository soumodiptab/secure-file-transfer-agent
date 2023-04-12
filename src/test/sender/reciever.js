const fs = require('fs');
const io = require('socket.io-client');
const pool = workerpool.pool('./myWorker.js');

const socket = io('http://localhost:3000');
const filename = './test.mkv';
const downloadname = './download.mkv';
await socket.connect();
let total_parts=0;
let total_size=0;
console.log('Receiver connected');
socket.emit('file', { file_path: filename });
socket.on('init', ({ parts,filesize }) => {
  console.log(`Number of parts: ${parts}`);
  total_parts=parts;
  total_size=filesize;
});
await socket.disconnect();
fs.writeFileSync(downloadname, Buffer.alloc(total_size));
console.log('Empty File created.. of size '+total_size);
for (let i = 0; i < total_parts; i++) {
  await pool.exec('recieveChunkedData', [i,downloadname]);
}
