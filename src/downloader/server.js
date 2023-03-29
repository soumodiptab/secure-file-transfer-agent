const express = require('express'),
ejslayouts = require('express-ejs-layouts');
const path = require("path");
const app = express();
const port = 3000;
// const dfs_server_ip = 'localhost'
// const dfs_server_port = 3001
const filesendRouter = require('./routes/fileSender');
const bodyParser = require('body-parser')
// setup for express
app.use(ejslayouts);
app.set("layout", "layouts/index");
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/sendfile', filesendRouter);
app.use("/css",express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")))
app.use("/js",express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")))
app.use("/js", express.static(path.join(__dirname, "node_modules/jquery/dist")))

// routes and apis

app.get('/', (req, res) => {
  res.redirect('/login');
})

app.get('/login', (req, res) => {
  res.render('login',{title: 'Downloader Login',active : 'login'});
})
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  // Check if the username and password are correct
  // In a real app, this should be done using a database or other authentication system
  if (username === 'admin' && password === 'password') {
    res.send('Logged in successfully!');
  } else {
    res.send('Incorrect username or password');
  }
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard',{title: 'Downloader Dashboard',active : 'dashboard'});
})
app.get('/configure',(req,res)=>{
  config = {
    peerid:1234,
    downloadpath:"/home/Downloads",
  }
  res.render('configure',{title: 'Downloader Configure',active :'configure',config:config});
});
// app.post('/configure',(req,res)=>{
//   console.log('peerid:'+req.body.peerid);
//   console.log('downloadpath:'+req.body.downloadpath);
//   res.send('confguratiion saved')
// });
app.get('/upload',(req,res)=>{
  res.render('upload',{title: 'Downloader Upload',active :'upload'})
});
app.post('/upload',(req,res)=>{
  res.send('File Uploaded')
});


app.listen(port);