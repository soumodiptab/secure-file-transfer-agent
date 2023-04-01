const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const axios = require('axios');
const mime = require('mime');

const { createLogger, transports, format } = require('winston');

const app = express();

app.use(express.json());

app.post('/dfs_request', async (req, res) => {
    const { uuid, filename, size, sender_id, secret_key } = req.body;
  

    res.status(200).json({ status: 0, data: 'Message delivered' });
            
  });


app.listen(4000, () => {
    console.log('Server started on port 4000');
});
