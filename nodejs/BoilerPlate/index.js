/**
 * app.js
 *
 * A template to create Express apps that utilize Bandwidth's APIs
 *
 * @copyright Bandwidth INC
 */
const express = require('express');
const app = express();
const port = 3000;

app.get('/', function (req, res) {
    res.send("hello world");
});

app.listen(port, () => console.log(`Bandwidth Emulator is now listening on port ${port}!`));
