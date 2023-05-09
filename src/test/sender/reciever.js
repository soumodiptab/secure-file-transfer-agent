const express = require('express');
const app = express();
const CHUNK_SIZE = 1024 * 1024; // 1MB
const PART_SIZE = 64 * CHUNK_SIZE;
const fs = require('fs');
const workerpool = require('workerpool');
const path = require('path');
const pool = workerpool.pool('./recieveworker.js',{
  minWorkers: 2,
  maxWorkers: 4
});
// worker_ports = [4001,4002,4003,4004];
// worker_ports_status = [0,0,0,0];
const download_dir = './downloads';

let download_status={
  origin_path:'',
  file_path:'',
  total_parts:0,
  parts_recieved:0,
  parts_left:0,
  parts_array : [],
  status:'not started',
  progress:0
}


const mergeFiles = (filename, download_path,file_id,parts) => {
  if(!fs.existsSync(path.join(download_path,file_id))){
    throw new Error('Merge Folder not found');
  }
  const mergedFilePath = path.join(download_path, filename);
  if (fs.existsSync(mergedFilePath)) {
    fs.rmSync(mergedFilePath);
  }
  const fileOutStream = fs.createWriteStream(mergedFilePath);
  // fs.readdir(path.join(download_path,file_id), (err, files) => {
  //   if (err) {
  //     console.error('Error reading directory:', err);
  //     return;
  //   }
  //   const partFiles = files.filter((file) => file.endsWith('part'));
  //   partFiles.sort();
  //   mergeNextFile();
  //   partFiles.forEach((partFile) => {
  //     const partFilePath = path.join(download_path,file_id, partFile);
  //     const inputStream = fs.createReadStream(partFilePath);
  //     inputStream.pipe(fileOutStream, { end: false });
  //     inputStream.on('end', () => {
  //       fs.rmSync(partFilePath);
  //       console.log (`${partFilePath} merged into ${mergedFilePath}`);
  //     });
  //   });

  // });
  const mergeFile = (partIndex) => {
    const partFilePath = path.join(download_path, file_id,`${filename}-p-${partIndex}.part`);
    const inputStream = fs.createReadStream(partFilePath);
    inputStream.pipe(fileOutStream, { end: false });
    inputStream.on('end', () => {
      fs.rmSync(partFilePath);
      console.log (`${partFilePath} merged into ${mergedFilePath}`);
      if(partIndex<parts-1){
        mergeFile(partIndex+1);
        return;
      }
      else{
        fileOutStream.end();
        return ;
      }
    });
  };
  mergeFile(0);
  fileOutStream.on('finish', () => {
    fs.rmSync(path.join(download_path,file_id), { recursive: true });
    console.log('Merging finished');
    return;
  });
  // for(let i = 0; i< parts;i++){
  //   const inputFilePath = path.join(download_path,file_id, `${filename}-p-${i}.part`);
  //   const fileInStream = fs.createReadStream(inputFilePath);
  //   fileInStream.pipe(fileOutStream);
  // }
};

const startDownload = () => {
  // const socket = io('http://localhost:4000');
  const filename = './test2.mkv';
  const downloadname = './download.mkv';
  const download_loc = path.join(download_dir, 'uuid-value');
  if (fs.existsSync(download_loc)) {
    fs.rmSync(download_loc, { recursive: true });
  }
  fs.mkdirSync(download_loc);
  let total_parts=32;
  download_status={
    origin_path:filename,
    file_path:downloadname,
    total_parts:total_parts,
    parts_recieved:0,
    parts_left:total_parts,
    parts_array : new Array(total_parts).fill(0),
    status:'downloading',
    progress:0
  }
  // fun(2,downloadname,filename,total_size);
  for (let i = 0; i < total_parts; i++) {
    pool.exec('recieveChunkedData', [i,filename,download_loc]).then(() => {
      download_status.parts_recieved++;
      download_status.parts_left--;
      download_status.parts_array[i]=1;
      download_status.progress = (download_status.parts_recieved/total_parts)*100;
      console.log('Part ' + i + ' recieved');
      if(download_status.parts_recieved == total_parts){
        download_status.status = 'merging';
        console.log('Merging files');
        mergeFiles(filename, download_dir,'uuid-value',total_parts);
        download_status.status = 'done';
        console.log('Download complete');
      }
    }).catch((err) => {
      console.error(err);
    });
  }
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

app.get('/start', (req, res) => {
  startDownload();
  res.send('Started download');
});



app.listen(5000, () => console.log('Receiver listening on port 5000!'));