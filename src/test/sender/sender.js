const fs = require('fs');
const {Server} = require('socket.io');
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 256 * CHUNK_SIZE; // 10MB
const io = new Server({});
let filepath;
let PARTS;
io.on('connection', (socket) => {
    console.log('Sender connected');
    socket.on('file', ({ file_path }) => {
        filepath = file_path;
        fileSize = fs.statSync(filePath).size;
        PARTS = Math.ceil(fileSize / PART_SIZE);
        socket.emit('init',{parts : PARTS,filesize:fileSize});
    });

});

io.listen(3000);