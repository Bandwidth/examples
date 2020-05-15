require('dotenv').config()

const config = require('./config');
const express = require('express');
const handlers = require('./handlers');


const app = express();

app.use(express.json(), express.text({
    type : "application/xml"
}));

app.post('/subscriptions/orders', handlers.ordersCallback);
app.post('/subscriptions/disconnects', handlers.disconnectsCallback);
app.get('/availablePhoneNumbers', handlers.searchAvailableNumbers);
app.get('/phoneNumbers', handlers.listPurchasedNumbers);
app.post('/phoneNumbers', handlers.purchaseNumber);
app.delete('/phoneNumbers/:phoneNumber', handlers.removeNumber);

app.listen(config.PORT);
console.log(`Server listening on port ${config.PORT}`);