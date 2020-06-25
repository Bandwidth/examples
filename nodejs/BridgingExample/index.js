require('dotenv').config()

const express = require('express');
const config = require('./config');
const voice = require('./voice');

const app = express();

app.use(express.json());

app.post('/Inbound/VoiceCallback', voice.handleInboundCall);
app.post('/Outbound/Answer', voice.handleOutboundCall);
app.post('/Outbound/Gather', voice.handleOutboundGather);



app.listen(config.PORT);
console.log(`Server listening on port ${config.PORT}`);