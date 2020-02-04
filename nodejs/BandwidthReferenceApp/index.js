var express = require('express');

var messaging = require('./messaging');
var voice = require('./voice');

var app = express();
app.use(express.json());

app.post('/MessageCallback', messaging.handleInboundMessage);
app.post('/StartGatherTransfer', voice.startGatherTransfer);
app.post('/EndGatherTransfer', voice.endGatherTransfer);
app.post('/VoiceCallback', voice.handleInboundCall);
app.post('/StartGatherGame', voice.startGatherGame);
app.post('/EndGatherGame', voice.endGatherGame);

app.listen(3000);
