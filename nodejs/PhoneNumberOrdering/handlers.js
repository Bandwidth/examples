const bandwidth = require('bandwidth-iris');
const xml2js = require("xml2js");
const config = require('./config');

const client = new bandwidth.Client(config.BANDWIDTH_ACCOUNT_ID, config.BANDWIDTH_API_USERNAME, config.BANDWIDTH_API_PASSWORD);

const storage = {};


async function ordersCallback(req, res){
    const xml = req.body;

    parseXML(xml).then((res) => {
        const notification = res.notification;
        if(notification.status === 'FAILED'){
            const phoneNumber = notification.completedTelephoneNumbers.telephoneNumber;
            delete storage[phoneNumber];
        }

    }).catch( (err) => {
        console.log(err);
    })

    console.log(xml);
    res.sendStatus(200);
}

async function disconnectsCallback(req, res) {
    const xml = req.body;

    parseXML(xml).then((res) => {
        const notification = res.notification;
        if(notification.status === 'COMPLETE'){
            const phoneNumber = notification.completedTelephoneNumbers.telephoneNumber;
            delete storage[phoneNumber];
        }
    }).catch( (err) => {
        console.log(err);
    })
    console.log(xml);
    res.sendStatus(200);
}

async function searchAvailableNumbers(req, res){
    const zip = req.query.zipCode;
    const areaCode = req.query.areaCode;
    const quantity = 10;

    const query = {
        quantity
    }

    if(zip) query.zip = zip;
    if(areaCode) query.areaCode = areaCode;

    bandwidth.AvailableNumbers.list(client, query, (err, success) => {
        if(err){
            parseXML(err.response.text).then( (result) => {
                const errObj = result.searchResult;
                res.json({
                    type: "validation",
                    description: errObj.error.description,
                    bandwidthErrorCode: errObj.error.description,
                    bandwidthErrorDescription: errObj.error.code
                });
            }).catch( (err) => {
                res.sendStatus(500);
            })
        } else {
            res.json(success.telephoneNumberList.telephoneNumber);
        }
    });
}

async function listPurchasedNumbers(req, res) {
    res.json( Object.values(storage) );
}

async function purchaseNumber(req, res){
    const body = req.body;

    const phoneNumber = body.phoneNumber;

    const order = {
        customerId: "customerOrderId",
        SiteId: config.BANDWIDTH_SITE_ID,
        existingTelephoneNumberOrderType : {
            telephoneNumberList : [ 
                { telephoneNumber: phoneNumber} 
            ]
        }
    }

    bandwidth.Order.create(client, order, (err, success) => {
        if(err){
            parseXML(err.response.text).then( (result) => {
                const errObj = result.orderResponse.errorList.error;
                res.json({
                    type: "validation",
                    description: errObj.description,
                    bandwidthErrorCode: errObj.description,
                    bandwidthErrorDescription: errObj.code
                });
            }).catch( (err) => {
                res.sendStatus(500);
            })
        } else {
            const orderDetails = {
                phoneNumber: phoneNumber,
                bandwidthOrderId: success.order.id
            }
            storage[phoneNumber] = orderDetails;
            res.json(orderDetails);
        }
    });
}

async function removeNumber(req, res) {
    const phoneNumber = req.params.phoneNumber;

    if(!storage[phoneNumber]){
        res.json({
            type: "number-not-found",
            description: `Phone Number '${phoneNumber}' Not Found`,
            bandwidthErrorCode: null,
            bandwidthErrorDescription: null
        });
    }


    bandwidth.Disconnect.create(client, "jsDisconnect", [phoneNumber], (err, success) => {
        if(err){
            parseXML(err.response.text).then( (result) => {
                const errObj = result.searchResult;
                res.json({
                    type: "validation",
                    description: errObj.error.description,
                    bandwidthErrorCode: errObj.error.description,
                    bandwidthErrorDescription: errObj.error.code
                });
            }).catch( (err) => {
                res.sendStatus(500);
            })
        } else {
            res.sendStatus(204);
        }
    });
}

const xml2jsParserOptions = {
    explicitArray: false,
    tagNameProcessors: [xml2js.processors.firstCharLowerCase],
  };

function parseXML(xml) {
    return xml2js.parseStringPromise(xml, xml2jsParserOptions);
}

module.exports = {
    ordersCallback,
    disconnectsCallback,
    searchAvailableNumbers,
    listPurchasedNumbers,
    purchaseNumber,
    removeNumber
}