const express = require('express');
const app = express();
const fs = require('fs');
const port = 3000;
const BLOCK_SIZE = 256;
const CHUNK_SIZE = 10 * BLOCK_SIZE;
// const dfs_server_ip = 'localhost'
// const dfs_server_port = 3001
async function  prepareFile(filepath) {
  const filesize = fs.stat(filepath, (err, stats) => {
    if (err) {
      console.error(err)
      return
    }
    return stats.size
  });
  const chunks = Math.ceil(filesize / CHUNK_SIZE);
}


app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/upload', (req, res) => {
  const filepath = req.query.filepath;
  prepareFile(filepath);
});

app.listen(port, () => {console.log(`Example app listening at http://localhost:${port}`)});