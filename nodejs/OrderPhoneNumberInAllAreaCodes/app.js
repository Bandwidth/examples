const lineReader = require('line-reader');
const axios = require('axios');
require('dotenv').config();

let url = `https://dashboard.bandwidth.com/api/accounts/${process.env.BANDWIDTH_ACCOUNT_ID}/orders`;

let rejected = [];

let config = {
    auth: {
        username: process.env.BANDWIDTH_API_USER,
        password: process.env.BANDWIDTH_API_PASSWORD
    },
    headers: {
        "Content-type": "application/xml"
    }
}

async function check(areaCode) {
  const url = `https://dashboard.bandwidth.com/api/accounts/${process.env.BANDWIDTH_ACCOUNT_ID}/availableNumbers?AreaCode=${areaCode}`;
  try {
    return await axios.get(url, config);
  } catch (e) {
    return false;
  }
}

const orderPhone = (code) => {
    let url = `https://dashboard.bandwidth.com/api/accounts/${process.env.BANDWIDTH_ACCOUNT_ID}/orders`;
    let content = `<Order>
        <AreaCodeSearchAndOrderType>
            <AreaCode>${code}</AreaCode>
            <Quantity>1</Quantity>
        </AreaCodeSearchAndOrderType>
        <SiteId>${process.env.BANDWIDTH_SITE_ID}</SiteId>
    </Order>`;
    axios.post(url, content, config)
    .then((res) => console.log(`${code} order successful.`))
    //.catch(console.log)
    .catch((err) => console.log(`${code} order failed: something went wrong while ordering. Please try again`));
}

const allAreaCodes = [];

lineReader.eachLine('area_codes.txt', (line) => {
  let areaCode = line.split(" ")[0];
  allAreaCodes.push(areaCode);
});


let orderNumbers = (areaCodes, index) => {
  if (index >= areaCodes.length) {
    return;
  }
  orderPhone(areaCodes[index]);
  setTimeout((areaCodes, index) => {
    orderNumbers(areaCodes, index + 1)
  }, 1000, areaCodes, index)
}


setTimeout(orderNumbers, 3000, allAreaCodes, 0) // wait for lineReader to populate the areaCodes before reading through. 
