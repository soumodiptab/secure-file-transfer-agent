const fs = require('fs');
const { parentPort } = require('worker_threads');

parentPort.on('message', function(msg) {
  console.log(`Worker ${process.pid} received message`);
  const { fileName, chunkSize, remainingBytes, chunkIndex } = msg;

  const readStream = fs.createReadStream(fileName, {
    start: chunkIndex * chunkSize,
    end: Math.min((chunkIndex + 1) * chunkSize, remainingBytes) - 1
  });

  let chunkBuffer = Buffer.alloc(0);

  readStream.on('data', function(chunk) {
    chunkBuffer = Buffer.concat([chunkBuffer, chunk]);
  });

  readStream.on('end', function() {
    parentPort.postMessage({
      data: chunkBuffer,
      index: chunkIndex
    });
  });
});