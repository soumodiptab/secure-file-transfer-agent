const express = require('express');
const app = express();

app.use(express.json());

app.post('/receiver_request', (req, res) => {
  const randomResponse = Math.floor(Math.random() * 2); // generates either 0 or 1

  res.sendStatus(200).send(randomResponse);
});

app.listen(3000, () => {
  console.log('API server listening on port 3000');
});
