const express = require('express');
const app = express();
const port = 3000;
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  console.log('Hit / api')
  res.render('index', { text : 'Sam' })
})
 
app.listen(port);