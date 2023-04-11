const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('file', ({ name, data }) => {
    console.log(`File ${name} received`);
    const filePath = `./${name}`;
    fs.writeFile(filePath, data, (err) => {
      if (err) throw err;
      console.log(`File ${name} saved`);
    });
  });
});

http.listen(3000, () => {
  console.log('Destination server listening on *:3000');
});