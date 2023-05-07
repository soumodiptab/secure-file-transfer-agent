const express = require('express');
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
const http = require('http');
const fs = require('fs');
const path = require('path');
const server = http.createServer(app);
const {Server} = require('socket.io');
let ss = require('socket.io-stream');
const io = new Server(server);
const workerpool = require('workerpool');
const pool = workerpool.pool('./sendworker.js');
const temp_dir = './temp_dir';
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 64 * CHUNK_SIZE;
const PORT = 4000;
let filepath;
let PARTS;
io.on('connection', (socket) => {
    console.log('part client connected');
    socket.on('request_part', ({ partIndex,filepath }) => {
        console.log('Starting to send part '+partIndex);
        const filename = path.basename(filepath);
        // const part_start = partIndex * PART_SIZE;
        // const part_end = Math.min(part_start + PART_SIZE, fileSize);
        // const fileBuffer = fs.readFileSync(filepath);
        // const numChunks = Math.ceil((part_end - part_start) / CHUNK_SIZE);
        const stream_file_path = path.join(temp_dir, 'uuid-value',`${filename}-p-${partIndex}.part`);
        let stream = ss.createStream();
        ss(socket).emit('part', stream);
        fs.createReadStream(stream_file_path).pipe(stream);
    });
});

function createPartition(filepath,filename,outputDirectory,start,end,index){
    const inputFilePath = filepath;
    const outputFilePath = path.join(outputDirectory, `${filename}-p-${index}.part`);
    const inputStream = fs.createReadStream(inputFilePath,{start:start,end:end});
    let outputStream = fs.createWriteStream(outputFilePath);
    inputStream.on('data', function(chunk) {
        outputStream.write(chunk);
      });
    inputStream.on('end', function() {
        outputStream.end();
      });
}

// async function readChunk(filepath, start, end) {
//     const stream = fs.createReadStream(filepath, { start, end });
//     const chunks = [];
  
//     return new Promise((resolve, reject) => {
//       stream.on('data', (chunk) => {
//         chunks.push(chunk);
//       });
  
//       stream.on('end', () => {
//         const buffer = Buffer.concat(chunks);
//         if (buffer.length !== end - start + 1) {
//           reject(new Error(`Failed to read the entire chunk from file`));
//         }
//         resolve(buffer);
//       });
  
//       stream.on('error', (err) => {
//         reject(err);
//       });
//     });
//   }

const mergeFiles = (filename, download_path,file_id) => {
  if(!fs.existsSync(path.join(download_path,file_id))){
    throw new Error('Merge Folder not found');
  }
  const mergedFilePath = path.join(download_path, filename);
  if (fs.existsSync(mergedFilePath)) {
    fs.rmSync(mergedFilePath);
  }
  const fileOutStream = fs.createWriteStream(mergedFilePath);
  fs.readdir(path.join(download_path,file_id), (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    const partFiles = files.filter((file) => file.endsWith('part'));
    partFiles.sort();
    partFiles.forEach((partFile) => {
      const partFilePath = path.join(download_path,file_id, partFile);
      const inputStream = fs.createReadStream(partFilePath);
      inputStream.pipe(fileOutStream, { end: false });
      inputStream.on('end', () => {
        // fs.rmSync(partFilePath);
        console.log (`${partFilePath} merged into ${mergedFilePath}`);
      });
    });

  });
  
}

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/partition', (req, res) => {
  const file_path  = req.body.file_path;
  console.log('File information requested for ' + file_path);
  const fileSize = fs.statSync(file_path).size;
  const PARTS = Math.ceil(fileSize / PART_SIZE);
  const outputDirectory = path.join(temp_dir, 'uuid-value');
  if (fs.existsSync(outputDirectory)) {
    fs.rmSync(outputDirectory, { recursive: true });
  }
  fs.mkdirSync(outputDirectory);
  for (let i = 0; i < PARTS; i++) {
      createPartition(file_path,path.basename(file_path),outputDirectory,i*PART_SIZE,Math.min((i+1)*PART_SIZE,fileSize),i);
  }
  res.send({parts:PARTS,filepath:file_path});
});

app.get('/merge', (req, res) => {
    const folder_path  = req.body.folder_path;

});
  

server.listen(PORT, () => {
      console.log('listening on :'+PORT);
});