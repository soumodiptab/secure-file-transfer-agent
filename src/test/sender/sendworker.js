const workerpool = require('workerpool');
const io = require('socket.io');
const fs = require('fs');
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 1024 * CHUNK_SIZE;
async function sendChunkedData(serializedSocket) {
    const socket = io.of(serializedSocket.nsp).sockets.get(serializedSocket.id);
    socket.join(serializedSocket.rooms);
    socket.on('request_part', ({ partIndex,filepath }) => {
        console.log('Starting to send part '+partIndex);
        const part_start = partIndex * PART_SIZE;
        const part_end = Math.min(start + PART_SIZE, fileSize);
        const fileBuffer = fs.readFileSync(filepath);
        const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
        let chunkIndex = 0;
        const sendChunk = () => {
            const start = part_start + chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, part_end);
            const chunk = fileBuffer.slice(start, end);
            socket.emit('chunk', { index: start, data: chunk });
            chunkIndex++;
            if (chunkIndex < numChunks) {
                setTimeout(sendChunk, 10);
            }
            else {
                console.log('All chunks sent');
            }
        };
        sendChunk();
        socket.on('end', () => {
            console.log('All chunks received by reciever for part '+partIndex);
            socket.emit('end');
        });
    });
  };
  workerpool.worker({
    sendChunkedData: sendChunkedData});