const fs = require('fs');
const express = require('express');
const ejslayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
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
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/sendfile', filesendRouter);
app.use("/css",express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")))
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")))
app.use("/js",express.static(path.join(__dirname, "node_modules/@popperjs/core/dist/umd")))
app.use("/js", express.static(path.join(__dirname, "node_modules/jquery/dist")))

const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$12$f.wiaY7rkYMeEZaOOdt/p.HXe0uS8E3zKun2iM3acGhZ5GWehhodm'
  }
];
// routes and apis
passport.use(new LocalStrategy(
  (username, password, done) => {
    const user = users.find(user => user.username === username);
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  }
));
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.find(user => user.id === id);
  done(null, user);
});
const isAuthenticated = (req, res, next) => {
  const unprotectedPaths = ['/login','/logout','/test','/dir'];
  if (req.isAuthenticated() || unprotectedPaths.includes(req.path)) {
    return next();
  }
  res.redirect('/login');
};
app.all('*',isAuthenticated);

app.get('/', (req, res) => {
  res.render('dashboard',{title: 'Downloader Dashboard',active : 'dashboard'});
})

app.get('/login', (req, res) => {
  res.render('login',{title: 'Downloader Login',active : 'login'});
})
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

app.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

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

app.get('/dir',(req,res)=>{
  const directory = req.query.path || '/home';
  const absoluteDirectory = path.join(directory);
  fs.readdir(absoluteDirectory, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }
    const filesObjects = files.map((file) => {
      const filePath = path.join(absoluteDirectory,file.name);
      const absolutePath = path.resolve(filePath);
      const stats = fs.statSync(absolutePath);
      const fileType = (file.isDirectory())? 'directory':path.extname(filePath);
      return { name: file.name,isdir:file.isDirectory(), path: absolutePath ,size:stats.size,type:fileType};
  });
  res.render('directory', { title:'Directory explorer',files:filesObjects,active :'directory' , dirpath:absoluteDirectory});
  });
});


app.get('/test',(req,res)=>{
  const directory = req.query.path || '/home';
  const absoluteDirectory = path.join(directory);
  fs.readdir(absoluteDirectory, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory');
    }
    const filesObjects = files.map((file) => {
      const filePath = path.join(absoluteDirectory,file.name);
      const absolutePath = path.resolve(filePath);
      const stats = fs.statSync(absolutePath);
      const fileType = (file.isDirectory())? 'directory':path.extname(filePath);
      return { name: file.name,isdir:file.isDirectory(), path: absolutePath ,size:stats.size,type:fileType};
  });
  res.send({ dirpath:absoluteDirectory,files:filesObjects,active :'directory'});
  });

});
app.get('/file',(req,res)=>{
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).send('No file specified');
  }
  res.sendFile(filePath);
});

app.listen(port);