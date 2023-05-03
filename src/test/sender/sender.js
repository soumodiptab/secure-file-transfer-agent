const express = require('express');
const app = express();
const fs = require('fs');
const {Server} = require('socket.io');
const workerpool = require('workerpool');
const pool = workerpool.pool('./sendworker.js');
const CHUNK_SIZE = 64 * 1024; // 1MB
const PART_SIZE = 1024 * CHUNK_SIZE;
const io = new Server({});
const io2 = new Server({});
let filepath;
let PARTS;
try{
    io.on('connection', (socket) => {
        console.log('file client connected');
        socket.on('file', ({ file_path }) => {
            console.log('File information requested for ' + file_path);
            filepath = file_path;
            fileSize = fs.statSync(filepath).size;
            PARTS = Math.ceil(fileSize / PART_SIZE);
            socket.emit('init',{parts : PARTS,filesize:fileSize});
        });
    });
    io2.on('connection', (socket) => {
        console.log('part client connected');
        socket.on('request_part', ({ partIndex,filepath }) => {
            console.log('Starting to send part '+partIndex);
            const part_start = partIndex * PART_SIZE;
            const part_end = Math.min(part_start + PART_SIZE, fileSize);
            // const fileBuffer = fs.readFileSync(filepath);
            const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
            let i=0;
            for (let chunkIndex = 0; chunkIndex < numChunks;) {
                const start = part_start + chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, part_end);
                // const chunk = fileBuffer.slice(start, end);
                const chunk = readChunk(filepath, start, end);
                socket.emit('${partIndex}-chunk', { index: i, data: chunk });
                i++;
                chunkIndex++;
                // if (chunkIndex < numChunks) {
                //     setTimeout(sendChunk, 10);
                // }
                // else {
                //     console.log('All chunks sent');
                // }
            };
            socket.on('{partIndex}-end', () => {
                console.log('All chunks sent to reciever for part '+partIndex);
                socket.emit('{partIndex}-end');
            });
        });
    });
}
catch(err){
    console.log(err);
}


async function readChunk(filepath, start, end) {
    const stream = fs.createReadStream(filepath, { start, end });
    const chunks = [];
  
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
  
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length !== end - start + 1) {
          reject(new Error(`Failed to read the entire chunk from file`));
        }
        resolve(buffer);
      });
  
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  
  
  

io.listen(4000);
io2.listen(4001);