const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const ip = require('ip');
const fs = require('fs');
const express = require('express');
const ejslayouts = require('express-ejs-layouts');
const axios = require('axios');
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

var users = [
  // {
  //   id: 1,
  //   username: '1234',
  //   password: '$2a$12$f.wiaY7rkYMeEZaOOdt/p.HXe0uS8E3zKun2iM3acGhZ5GWehhodm'
  // }
];
/**
 * Configure the local strategy for use by Passport.
 *  */ 
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
/**
 * Configure Passport authenticated session persistence.
 */
passport.serializeUser((user, done) => {
  done(null, user.username);
});
/***
 * Configure Passport authenticated session persistence.
 */
passport.deserializeUser((id, done) => {
  const user = users.find(user => user.username === id);
  done(null, user);
});
/***
 * Authentication middleware with exception of some routes
 */
const isAuthenticated = (req, res, next) => {
  const unprotectedPaths = ['/login','/logout','/getusers'];
  if (req.isAuthenticated() || unprotectedPaths.includes(req.path)) {
    return next();
  }
  res.redirect('/login');
};
/**
 * Enable authebtication for all routes
 */
app.all('*',isAuthenticated);

/**
 * Fetcg Dashboard
 */
app.get('/', (req, res) => {
  res.render('dashboard',{title: 'Downloader Dashboard',active : 'dashboard'});
})
/**
 * Fetch Login Page
 */
app.get('/login', (req, res) => {
  axios.post('http://localhost:4000/login',{ip_address:ip.address()})
  .then(response => {
    console.log(response.data);
    users = response.data;
  });
  res.render('login',{title: 'Downloader Login',active : 'login'});
})
/**
 * Login Post Request
 */
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));
/**
 * Logout Request
 */
app.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
/**
 * Configure Details
 */
app.get('/configure',(req,res)=>{
  config = {
    peerid:req.user.username,
    downloadpath:"/home/Downloads",
  }
  res.render('configure',{title: 'Downloader Configure',active :'configure',config:config});
});
/**
 * upload file information to dfs server
 */
app.get('/upload',(req,res)=>{
  const directory = req.query.path || '/home';
  const absoluteDirectory = path.join(directory);
  res.render('upload',{title: 'Downloader Upload',active :'upload',dirpath:absoluteDirectory})
});

/**
 * Send file information to dfs server
 */
app.post('/upload',(req,res)=>{
  const senderpeerid = req.user.username;
  const filename = path.basename(req.body.finalpath);
  const stats = fs.statSync(absolutePath);
  const size = stats.size;
  const uuid = uuidv4();
  // console.log(req.body.finalpath) ;
  // console.log(req.body.recpeerid) ;
  // console.log(req.body.secretkey) ;
  axios.post('http://localhost:4000/sender_request',{
    uuid:uuid,
    filename:filename,
    size:size,
    sender_id:senderpeerid,
    secret_key:req.body.secretkey,
    receiver_id:req.body.recpeerid,
  })
  .then(response => {
    console.log(response.data);
  });
  res.send('File Uploaded')
});
/**
 * Converts bytes to nearest unit B,KB,MB,GB,TB
 * @param {bytes} sizeInBytes 
 * @returns 
 */
function convertBytesToNearest(sizeInBytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let size = sizeInBytes;
  
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${Math.round(size * 100) / 100} ${units[index]}`;
}

/**
 * Create directory listing for given path
 */
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
      return { name: file.name,isdir:file.isDirectory(), path: absolutePath ,size:convertBytesToNearest(stats.size),type:fileType};
  });
  res.send({ dirpath:absoluteDirectory,files:filesObjects,active :'directory'});
  });

});


/**
 * Mukul test : remove later
 */

app.post('/getusers', async (req, res) => {
  const ip_address = req.body.ip_address;
  const encryptedData = [];

  const stream = fs.createReadStream('users.csv')
    .pipe(csv());

  for await (const row of stream) {
    const username = row.username;
    const password = row.password;

    // hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    encryptedData.push({ username, password: hashedPassword });
  }

  res.json(encryptedData);

  // Log response
  // logger.info(ip_address+" Requested College List");
});

app.listen(port);