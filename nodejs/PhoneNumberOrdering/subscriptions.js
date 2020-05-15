require('dotenv').config()
const config = require('./config');
const bandwidth = require('@bandwidth/numbers');
const commandLineArgs = require('command-line-args')

const optionDefinitions = [
    { name: 'url', alias: 'u', type: String }
]

const client = new bandwidth.Client(config.BANDWIDTH_ACCOUNT_ID, config.BANDWIDTH_API_USERNAME, config.BANDWIDTH_API_PASSWORD);

const clArgs = commandLineArgs(optionDefinitions);

if(!clArgs.url) {
    console.log("Provide the callback url via the command line arg 'url' ex: --url https://example.com")
    process.exit();
}

const orderSubscription = {
    OrderType: 'orders',
    CallbackSubscription: {
        URL: `${clArgs.url}/subscriptions/orders`,
        Expiry: 10000,
    }
};

const disconnectSubscription = {
    OrderType: 'disconnects',
    CallbackSubscription: {
        URL: `${clArgs.url}/subscriptions/disconnects`,
        Expiry: 10000,
    }
}


bandwidth.Subscription.create(client, orderSubscription, (err, res) => {
    if(err){
        console.log(`Error: Error while createing Order Subscription.`)
        console.log(new Error(err));
        process.exit();
    }
    console.log(
        `SubscriptionId: ${res.subscriptionId}
        OrderType: ${res.OrderType},
        Callback Url: ${res.CallbackSubscription.uRL},
        Status: ${res.CallbackSubscription.status}`
    );
});

bandwidth.Subscription.create(client, disconnectSubscription, (err, res) => {
    if(err){
        console.log(`Error: Error while createing Disconnect Subscription.`)
        console.log(new Error(err));
        process.exit();
    }
    console.log(
        `SubscriptionId: ${res.subscriptionId}
        OrderType: ${res.OrderType},
        Callback Url: ${res.CallbackSubscription.uRL},
        Status: ${res.CallbackSubscription.status}`
    );
});