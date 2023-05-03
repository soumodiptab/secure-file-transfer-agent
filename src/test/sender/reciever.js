const express = require('express');
const app = express();
const CHUNK_SIZE = 64 * 1024; // 1MB
const PART_SIZE = 1024 * CHUNK_SIZE;
const fs = require('fs');
const io = require('socket.io-client');
const workerpool = require('workerpool');
const pool = workerpool.pool('./recieveworker.js',{
  minWorkers: 1,
  maxWorkers: 1
});
worker_ports = [4001,4002,4003,4004];
worker_ports_status = [0,0,0,0];

let download_status={
  origin_path:'',
  file_path:'',
  total_parts:0,
  total_size:0,
  parts_recieved:0,
  parts_left:0,
  parts_array : [],
  status:'not started',
  progress:0
}

const startDownload = () => {
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
    download_status={
      origin_path:filename,
      file_path:downloadname,
      total_parts:total_parts,
      total_size:total_size,
      parts_recieved:0,
      parts_left:total_parts,
      parts_array : new Array(total_parts).fill(0),
      status:'downloading',
      progress:0
    }
    // fun(2,downloadname,filename,total_size);
    for (let i = 0; i < total_parts; i++) {
      pool.exec('recieveChunkedData', [i,downloadname,filename,total_size]).then(() => {
        download_status.parts_recieved++;
        download_status.parts_left--;
        download_status.parts_array[i]=1;
        download_status.progress = (download_status.parts_recieved/total_parts)*100;
        console.log('Part ' + i + ' recieved');
      }).catch((err) => {
        console.error(err);
      });
    }

  });
};


app.get('/', (req, res) => {
  res.send('Receiver');
});

app.get('/stats', (req, res) => {
  res.send(pool.stats());
});

app.get('/progress', (req, res) => {
  download_progress =download_status.progress+'%'
  res.send(download_progress);
});
app.get('/stop', (req, res) => {
  pool.terminate();
  res.send('Stopped download');
});

app.get('/restart', (req, res) => {
  startDownload();
  res.send('Restarted download');
});

app.get('/pause', (req, res) => {
  pool.pause();
  res.send('Paused download');
});
app.get('/start', (req, res) => {
  startDownload();
  res.send('Started download');
});



app.listen(5000, () => console.log('Receiver listening on port 5000!'));