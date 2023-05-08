const config = require('config');
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
const workerpool = require('workerpool');

const pool = workerpool.pool('./workers/streamWorker',{
  minWorkers: config.get('MIN_WORKERS'),
  maxWorkers: config.get('MAX_WORKERS')
});
const {createPartition,mergeFiles} = require('./controllers/streamHandler.js');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io =require('socket.io')(server,{cors:{origin:'*'}});
const PARTITION_SIZE = config.get('PART_SIZE');
const TEMP_DIR = config.get('TEMP_DIR');
const DEFAULT_DOWNLOAD_DIR = config.get('DOWNLOAD_DIR');
const DFS_SERVER_ADDRESS = config.get('DFS_SERVER');
const port = process.argv[2];
const {Model, DataTypes, Sequelize} = require('sequelize');
const sequelize = new Sequelize('node-db','user','pass',{
    dialect: 'sqlite',
    host: `./${port}.sqlite`
});

class File extends Model {
};
File.init({
    id :{type: DataTypes.STRING,primaryKey:true},
    fileName:{type: DataTypes.STRING},
    filePath:{type: DataTypes.STRING},
    partPAth:{type: DataTypes.STRING},
    size:{type:DataTypes.INTEGER},
    parts:{type:DataTypes.INTEGER},
    partsSent:{type:DataTypes.INTEGER},
    partsReceived:{type:DataTypes.INTEGER},
    partsArray:{type:DataTypes.ARRAY(DataTypes.INTEGER)},
    progress:{type:DataTypes.INTEGER},
    type:{type: DataTypes.STRING},
    status:{type: DataTypes.STRING},
    senderId:{type: DataTypes.STRING},
    receiverId :{type: DataTypes.STRING},
    secretKey : {type: DataTypes.STRING} 
},{
    sequelize,
    modelName: 'file'
});
// const File = require('./models/file');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const dfs_server_ip = 'localhost'
// const dfs_server_port = 3001
const filesendRouter = require('./routes/fileSender');
const bodyParser = require('body-parser')
let ss = require('socket.io-stream');
const { where , Op } = require('sequelize');
const { start } = require('repl');
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
sequelize.sync().then(()=>{
  console.log('Database is ready');
});
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
  const unprotectedPaths = ['/login','/logout','/dfs_request','/upload','/start'];
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
  configuration = {
    peerid:req.user.username,
    downloadpath:path.join(__dirname,DEFAULT_DOWNLOAD_DIR),
  }
  res.render('configure',{title: 'Downloader Configure',active :'configure',config:configuration});
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
app.post('/upload',async (req,res)=>{
  // const senderpeerid = 100;
  const senderpeerid = req.user.username;
  const filePath = req.body.finalpath;
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const size = stats.size;
  const parts = Math.ceil(size / PARTITION_SIZE);
  const uuid = uuidv4();
  // console.log(req.body.finalpath) ;
  // console.log(req.body.recpeerid) ;
  // console.log(req.body.secretkey) ;
  // create temp directory if not exists
  if (!fs.existsSync(TEMP_DIR)){
    fs.mkdirSync(TEMP_DIR);
  }
  // create output directory
  const outputDirectory = path.join(TEMP_DIR, uuid);
  if (fs.existsSync(outputDirectory)) {
    fs.rmSync(outputDirectory, { recursive: true });
  }
  fs.mkdirSync(outputDirectory);

  let fileObj = {
    id:uuid,
    fileName:fileName,
    filePath:filePath,
    partPAth:outputDirectory,
    size:size,
    parts:parts,
    partsSent:0,
    progress:0,
    type:'UPLOAD',
    status:'PENDING',
    senderId:senderpeerid,
    receiverId : req.body.recpeerid,
    secretKey : req.body.secretkey
  };
  // add file object to uploads array
  await File.create(fileObj);
  
  for (let i = 0; i < parts; i++) {
    await createPartition(filePath,fileName,outputDirectory,i*PARTITION_SIZE,Math.min((i+1)*PARTITION_SIZE,size),i);
  }
  // create file objectlogi
  
  await axios.post(`http://${DFS_SERVER_ADDRESS}/sender_request`,{
    uuid:uuid,
    filename:fileName,
    parts:parts,
    size:size,
    sender_id:senderpeerid,
    secret_key:req.body.secretkey,
    receiver_id:req.body.recpeerid,
  })
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
app.get('/requests', async(req, res) => {
  const requested_downloads = [];
  const files = await File.findAll({
    where : {
      status : {
        [Op.in]: ['REQUESTED','ACCEPTED','REJECTED']
      },
      type : 'DOWNLOAD'
    }
  });
  files.forEach((file) => {
    requested_downloads.push({ id : file.id,name: file.fileName, status: file.status, Size: convertBytesToNearest(file.size), Sender: file.senderId });
  })
  res.render('requests', { title: 'Downloader Requests', active: 'requests', requested_downloads });
  // fs.createReadStream('requests.csv')
  //   .pipe(csv())
  //   .on('data', (data) => {
  //     const { uuid,filename, size, sender_id, accept } = data;
  //     if (accept === '0') {
  //       requested_downloads.push({ id : uuid,name: filename, status: 'Queued', Size: size, Sender: sender_id });
  //     }
  //   })
  //   .on('end', () => {
  //     res.render('requests', { title: 'Downloader Requests', active: 'requests', requested_downloads });
  //   });
});
//Transfers
app.get('/transfers',async (req, res) => {
  const ongoing_downloads = [];
  let downloads = await File.findAll({
    where : {
      status : {
        [Op.notIn] : ['COMPLETED','ACCEPTED','REJECTED','PENDING']
      }
    }
  });
  downloads.forEach(file => {
    ongoing_downloads.push({ name: file.fileName, status: file.status, Size: convertBytesToNearest(file.size), Sender: file.senderId });
  });
  res.render('transfers',{title: 'Downloader Transfers',active : 'transfers',ongoing_downloads});
  // fs.createReadStream('requests.csv')
  //   .pipe(csv())
  //   .on('data', (data) => {
  //     const { filename, size, sender_id, accept } = data;
  //     if (accept === '-1') {
  //       ongoing_downloads.push({ name: filename, status: 'Downloading', Size: size, Sender: sender_id });
  //     }
  //   })
  //   .on('end', () => {
  //     res.render('transfers',{title: 'Downloader Transfers',active : 'transfers',ongoing_downloads});
  //   });
});
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


app.post('/dfs_request', async (req, res) => {
  const { uuid, filename, size,parts, sender_id,receiver_id, secret_key } = req.body;
  // const accept = 0;
  console.log('Received file request from sender:');
  console.log(req.body);
  // const writer = csvWriter({ headers: ['uuid', 'filename', 'size', 'sender_id', 'receiver_id','secret_key', 'accept'] });
  // const data = [{ uuid, filename, size, sender_id,receiver_id, secret_key, accept }];
  // writer.pipe(fs.createWriteStream('requests.csv', { flags: 'a' }));
  // data.forEach((row) => writer.write(row));
  // writer.end();
  const filePath = path.join(DEFAULT_DOWNLOAD_DIR, filename);
  let fileObj = {
    id:uuid,
    fileName:filename,
    filePath:filePath,
    size:size,
    parts:parts,
    partsRecieved:0,
    progress:0,
    type:'DOWNLOAD',
    status:'REQUESTED',
    senderId:sender_id,
    receiverId : receiver_id,
    secretKey : secret_key
  };
  await File.create(fileObj);
  res.status(200).json({ status: 1, data: 'Message delivered' });
});

const startDownload = async (id) => {
  // const socket = io('http://localhost:4000');
  const downloadFile = await File.findOne({where:{id:id}});
  const download_loc = path.join(DEFAULT_DOWNLOAD_DIR, downloadFile.id);
  if (fs.existsSync(download_loc)) {
    fs.rmSync(download_loc, { recursive: true });
  }
  fs.mkdirSync(download_loc);
  downloadFile.partArray = new Array(downloadFile.parts).fill(0);
  downloadFile.status = 'DOWNLOADING';
  downloadFile.partsRecieved = 0;
  downloadFile.progress = 0;
  await downloadFile.save();
  const response = await axios.post(`http://${DFS_SERVER_ADDRESS}/get_address`,{id :downloadFile.senderId});
  const {ip_address} = response.data;
  // fun(2,downloadname,filename,total_size);
  for (let i = 0; i < downloadFile.parts; i++) {
    pool.exec('recieveStreamedData', [i,downloadFile.fileName,downloadFile.id,download_loc,ip_address]).then(async() => {
      downloadFile.partsRecieved++;
      downloadFile.partArray[i]=1;
      downloadFile.progress = (downloadFile.partsRecieved/downloadFile.parts)*100;
      await downloadFile.save();
      console.log('Part ' + i + ' recieved');
      if(downloadFile.partsRecieved == downloadFile.parts){
        downloadFile.status = 'MERGING';
        console.log('Merging files');
        await mergeFiles(downloadFile.fileName, DEFAULT_DOWNLOAD_DIR,downloadFile.id,downloadFile.parts);
        downloadFile.status = 'COMPLETED';
        console.log('Download complete');
      }
    }).catch((err) => {
      console.error(err);
    });
  }
};


app.post('/accept',async (req, res) => {
  const { id,name, Sender } = req.body;
  console.log('Received file accept request from sender:');
  const downloadFile =await File.findOne({where:{id:id}});
  downloadFile.status = 'ACCEPTED';
  await downloadFile.save();
  const requestBody = {
    uuid: downloadFile.id,
    filename: downloadFile.fileName,
    size: downloadFile.size,
    sender_id: downloadFile.senderId,
    receiver_id: downloadFile.receiverId,
    accept: 1
  }
  await axios.post(`http://${DFS_SERVER_ADDRESS}/accept_download`, requestBody);
  startDownload(id);
  res.redirect('/requests');
});
app.post('/reject',async (req, res) => {
  const { id,name, Sender } = req.body;
  console.log('Received file accept request from sender:');
  const downloadFile =await File.findOne({where:{id:id}});
  downloadFile.status = 'REJECTED';
  await downloadFile.save();
  const requestBody = {
    uuid: downloadFile.id,
    filename: downloadFile.fileName,
    size: downloadFile.size,
    sender_id: downloadFile.senderId,
    receiver_id: downloadFile.receiverId,
    accept: 0
  }
  await axios.post(`http://${DFS_SERVER_ADDRESS}/accept_download`, requestBody);
  res.redirect('/requests');
    // });
});

app.get('/start',async (req, res) => {
  const {id} = req.body;
  startDownload(id);
  res.send('Download started');
})

/**
 *  IO Connection for handling file transfer from sender to reciever
 */
io.on('connection', (socket) => {
  console.log('Partition client connected');
  socket.on('request_part', async({ partIndex, downloadId }) => {
    const fileObj = await File.findOne({where:{id:downloadId}});
    if(!fileObj){
      console.log('File not found');
      socket.disconnect();
      return;
    }
    console.log('Starting to send part '+partIndex);
    const streamFilePath = path.join(TEMP_DIR, fileObj.id,`${fileObj.fileName}-p-${partIndex}.part`);
    let stream = ss.createStream();
    ss(socket).emit('part', stream);

    const secret_key = 'my_secret_key';
    const cipher = crypto.createCipher('aes-256-cbc', secret_key);

    const inputStream = fs.createReadStream(streamFilePath);
    const encryptedStream = inputStream.pipe(cipher);

    encryptedStream.pipe(stream);

    stream.on('finish', () => {
      console.log('Part '+partIndex+' sent');
      fileObj.partsSent++;
      fileObj.progress = (fileObj.partsSent/fileObj.parts)*100;
      if (fileObj.partsSent == fileObj.parts) {
        fileObj.status = 'UPLOADED';
      }
      fileObj.save();
    });
  });
});


server.listen(port, () => console.log(`Downloader app listening on port <${port}>`));