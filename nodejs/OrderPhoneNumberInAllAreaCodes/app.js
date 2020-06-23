const fs = require('fs')
const numbers = require('@bandwidth/numbers')
const axios = require('axios');
numbers.Client.globalOptions.accountId = process.env.BANDWIDTH_ACCOUNT_ID;
numbers.Client.globalOptions.userName = process.env.BANDWIDTH_API_USER;
numbers.Client.globalOptions.password = process.env.BANDWIDTH_API_PASSWORD;

let url = `https://dashboard.bandwidth.com/api/accounts/${process.env.BANDWIDTH_ACCOUNT_ID}/orders`;

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
  data = {
    siteId: process.env.BANDWIDTH_SITE_ID,
    AreaCodeSearchAndOrderType: {
      areaCode: code,
      quantity: 1
    }
  }
  numbers.Order.createAsync(data)
    .then((res) => console.log(`${code} order successfully placed.`))
    .catch((err) => console.log(`${code} order failed: something went wrong while ordering. Please try again`));
}

const allAreaCodes = fs.readFileSync('./area_codes.txt').toString().split('\n').map(line => line.split(' ')[0]);
console.log(allAreaCodes.pop())

let orderNumbers = (areaCodes, index) => {
  if (index >= areaCodes.length) {
    return;
  }
  orderPhone(areaCodes[index]);
  setTimeout((areaCodes, index) => {
    orderNumbers(areaCodes, index + 1)
  }, 1000, areaCodes, index)
}
orderNumbers(allAreaCodes, 0)
