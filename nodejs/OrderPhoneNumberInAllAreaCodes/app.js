const fs = require('fs')
const numbers = require('@bandwidth/numbers')
numbers.Client.globalOptions.accountId = process.env.BANDWIDTH_ACCOUNT_ID;
numbers.Client.globalOptions.userName = process.env.BANDWIDTH_API_USER;
numbers.Client.globalOptions.password = process.env.BANDWIDTH_API_PASSWORD;

const orderPhone = async (code) => {
  data = {
    siteId: process.env.BANDWIDTH_SITE_ID,
    AreaCodeSearchAndOrderType: {
      areaCode: code,
      quantity: 1
    }
  }
  try {
    await numbers.Order.createAsync(data);
    console.log(`${code} order successfully placed.`)
  } catch {
    console.error(`${code} order failed: something went wrong while ordering. Please try again`);
  }
}

const main = async () => {
  const allAreaCodes = fs.readFileSync('./area_codes.txt').toString().split('\n').map(line => line.split(' ')[0]);
  console.log(allAreaCodes.pop())
  for await (areaCode of allAreaCodes) {
    await orderPhone(areaCode);
  }
}

main()
