const express = require('express');
const app = express();
const port = 3000;
const dfs_server_ip = 'localhost'
const dfs_server_port = 3001

app.set("view engine", "pug");

app.get('/', (req, res) => {
  res.redirect('/login');
})

app.get('/login', (req, res) => {
  res.render('login',{title: 'Downloader'});
})

const filesendRouter = require('./routes/fileSender');
app.use('/sendfile', filesendRouter);

app.listen(port);