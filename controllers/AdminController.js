const express = require('express');
const router = express.Router();

router.use('/', (req, res) => {
  res.json('yer');
});

module.exports = router;