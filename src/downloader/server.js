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
const port = process.argv[2];
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
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
  const unprotectedPaths = ['/login','/logout','/dfs_request'];
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
  const stats = fs.statSync(req.body.finalpath);
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
// app.post('/configure',(req,res)=>{
//   console.log('peerid:'+req.body.peerid);
//   console.log('downloadpath:'+req.body.downloadpath);
//   res.send('confguratiion saved')
// });

//Requests
app.get('/requests', (req, res) => {
  const requested_downloads = [];
  fs.createReadStream('requests.csv')
    .pipe(csv())
    .on('data', (data) => {
      const { filename, size, sender_id, accept } = data;
      if (accept === '0') {
        requested_downloads.push({ name: filename, status: 'Queued', Size: size, Sender: sender_id });
      }
    })
    .on('end', () => {
      res.render('requests', { title: 'Downloader Requests', active: 'requests', requested_downloads });
    });
});

//Transfers
app.get('/transfers', (req, res) => {

  const ongoing_downloads = [];
  fs.createReadStream('requests.csv')
    .pipe(csv())
    .on('data', (data) => {
      const { filename, size, sender_id, accept } = data;
      if (accept === '-1') {
        ongoing_downloads.push({ name: filename, status: 'Downloading', Size: size, Sender: sender_id });
      }
    })
    .on('end', () => {
      res.render('transfers',{title: 'Downloader Transfers',active : 'transfers',ongoing_downloads});
    });
})

//downloads
app.get('/downloads', (req, res) => {

  const downloads = [];
  fs.createReadStream('requests.csv')
    .pipe(csv())
    .on('data', (data) => {
      const { filename, size, sender_id, accept } = data;
      if (accept === '1') {
        downloads.push({ name: filename, status: 'Downloaded', Size: size, Sender: sender_id });
      }
    })
    .on('end', () => {
      res.render('downloads',{title: 'Downloader Downloads',active : 'downloads',downloads});
    });
  

})


app.post('/dfs_request', (req, res) => {
  const { uuid, filename, size, sender_id,receiver_id, secret_key } = req.body;
  const accept = 0;
  console.log('Received file request from sender:');
  console.log(req.body);
  const writer = csvWriter({ headers: ['uuid', 'filename', 'size', 'sender_id', 'receiver_id','secret_key', 'accept'] });
  const data = [{ uuid, filename, size, sender_id,receiver_id, secret_key, accept }];
  writer.pipe(fs.createWriteStream('requests.csv', { flags: 'a' }));
  data.forEach((row) => writer.write(row));
  writer.end();
  res.status(200).json({ status: 1, data: 'Message delivered' });
});


app.post('/accept', (req, res) => {
  const { name, Sender } = req.body;
  console.log('Received file accept request from sender:');
  // Open CSV file and create a new stream for reading
  const results = [];
  fs.createReadStream('requests.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Find matching row in CSV file and update 'accept' value
      const updatedResults = results.map((result) => {
        if (result.filename === name  && result.sender_id === Sender) 
        {
          const requestBody = {
            uuid: result.uuid,
            filename: result.filename,
            size: result.size,
            sender_id: result.sender_id,
            receiver_id: result.receiver_id,
            accept: result.accept
          };
          axios.post('http://localhost:4000/accept_download', requestBody)
          return { ...result, accept: '-1' };
        }
        return result;
      });

      // Write updated data back to CSV file
      const writeStream = fs.createWriteStream('requests.csv');
      writeStream.write('uuid,filename,size,sender_id,receiver_id,secret_key,accept\n');
      updatedResults.forEach((result) => {
        writeStream.write(
          `${result.uuid},${result.filename},${result.size},${result.sender_id},${result.receiver_id},${result.secret_key},${result.accept}\n`
        );
      });

      // Redirect to the same page
      res.redirect('/requests');
    });
});



app.listen(port,'0.0.0.0');