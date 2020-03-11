require('dotenv').config()

const express = require('express');
const config = require('config');
const messaging = require('./messaging');
const voice = require('./voice');

const app = express();

app.use(express.json());

app.post('/MessageCallback', messaging.handleMessageCallback);
app.post('/StartGatherTransfer', voice.startGatherTransfer);
app.post('/EndGatherTransfer', voice.endGatherTransfer);
app.post('/VoiceCallback', voice.handleInboundCall);
app.post('/StartGatherGame', voice.startGatherGame);
app.post('/EndGatherGame', voice.endGatherGame);

app.listen(config.port);
console.log(`Server listening on port ${config.port}`);
