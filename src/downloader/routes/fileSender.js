const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('user index')
});


router.get('/login', (req, res) => {
    res.send('user login')
});

router.get('/register', (req, res) => {
    res.send('user register')
});
module.exports = router;