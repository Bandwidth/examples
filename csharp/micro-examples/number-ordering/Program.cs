using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Bandwidth.Iris;
using Bandwidth.Iris.Model;
using System.Net.Http;
using System.Net.Http.Headers;

using System.Text;

namespace number_ordering
{
  class Program
  {
    private static readonly string ACCOUNT_ID = Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
    private static readonly string USERNAME = Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
    private static readonly string PASSWORD = Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");

    private static readonly string SIPPEER_ID = Environment.GetEnvironmentVariable("BANDWIDTH_SIPPEER_ID");
    private static readonly string SITE_ID = Environment.GetEnvironmentVariable("BANDWIDTH_SITE_ID");

    public static async Task Main(string[] args)
    {
      Client client = Client.GetInstance(ACCOUNT_ID, USERNAME, PASSWORD, "https://dashboard.bandwidth.com");
      Account account = await fetchAccount(client);
      AvailableNumbersResult areaCodeNumbers = await searchAreaCode(client, "919");
      printSearchResults(areaCodeNumbers);
      AvailableNumbersResult zipCodeNumbers = await searchZipCode(client, "27606");
      printSearchResults(zipCodeNumbers);
      AvailableNumbersResult tollFreeNumbers = await searchTollFree(client, "88*");
      printSearchResults(tollFreeNumbers);
      string[] numbersToOrder = new string[]{areaCodeNumbers.TelephoneNumberList[0],
                                zipCodeNumbers.TelephoneNumberList[0],
                                tollFreeNumbers.TelephoneNumberList[0]};
      OrderResult orderResult = await orderExistingNumber(client, numbersToOrder, "MyOrder", "abc-123");
      OrderResult completedOrder = await getOrderStatus(client, orderResult);
      Tn tn = await getNumber(client, areaCodeNumbers.TelephoneNumberList[0]);
      string result = await addForwardLineOption(areaCodeNumbers.TelephoneNumberList[0], "9198675309");
      await disconnectNumbers(client, "MyDisconnectOrder", numbersToOrder);
      string[] activeNumbers = await listNumbers(client);

    }

    static async Task<string> addForwardLineOption(string bandwidthNumber, string forwardNumber)
    {
      HttpClient client = new HttpClient();
      string TnOptionXML = @"<TnOptionOrder>
  <TnOptionGroups>
    <TnOptionGroup>
      <CallForward>{0}</CallForward>
      <TelephoneNumbers>
        <TelephoneNumber>{1}</TelephoneNumber>
      </TelephoneNumbers>
    </TnOptionGroup>
  </TnOptionGroups>
</TnOptionOrder>";
      string postData = String.Format(TnOptionXML, forwardNumber, bandwidthNumber);
      StringContent data = new StringContent(postData, Encoding.UTF8, "application/xml");
      string url = $"https://dashboard.bandwidth.com/api/accounts/{ACCOUNT_ID}/tnoptions";
      byte[] authToken = Encoding.ASCII.GetBytes($"{USERNAME}:{PASSWORD}");
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(authToken));
      HttpResponseMessage response = await client.PostAsync(url, data);
      string result = response.Content.ReadAsStringAsync().Result;
      return result;

  }
    static async Task<Tn> getNumber(Client client, string number)
    {
      Tn tn = await Tn.Get(client, number);
      return tn;
    }
    static async Task<string[]> listNumbers(Client client)
    {
      string[] activeNumbers = await InServiceNumber.List(client);
      return activeNumbers;

    }
    static async Task disconnectNumbers(Client client, string name, string[] numbersToDisconnect)
    {
      await Disconnect.Create(client, name, numbersToDisconnect);
      Console.WriteLine("Disconnected");
    }
    static async Task<OrderResult> getOrderStatus(Client client, OrderResult order)
    {
      order = await Order.Get(client, order.Order.Id);
      while (order.OrderStatus.ToLower() != "complete")
      {
        order = await Order.Get(client, order.Order.Id);
        await Task.Delay(1000);
      }
      return order;
    }

    static async Task<OrderResult> orderExistingNumber(Client client, string[] numbersToOrder, string name, string customerOrderId)
    {
      Order existingNumberOrder = new Order
      {
        Name = name,
        SiteId = SITE_ID,
        CustomerOrderId = customerOrderId,
        ExistingTelephoneNumberOrderType = new ExistingTelephoneNumberOrderType
        {
          TelephoneNumberList = numbersToOrder
        }
      };

      OrderResult result = await Order.Create(client, existingNumberOrder);
      return result;

    }
    static void printSearchResults(AvailableNumbersResult numbers)
    {
      Console.WriteLine("Found {0} Numbers and the length is {1}",
                          numbers.ResultCount,
                          numbers.TelephoneNumberList.Length);
    }

    static async Task<Account> fetchAccount(Client client)
    {
      Account account = await Account.Get(client);
      return account;
    }

    static async Task<AvailableNumbersResult> searchAreaCode(Client client, string areaCode)
    {
      var query = new Dictionary<string, object>();
      query.Add("areaCode", areaCode);
      query.Add("quantity", 10);


      AvailableNumbersResult numbers = await AvailableNumbers.List(client, query);
      return numbers;

    }

    static async Task<AvailableNumbersResult> searchZipCode(Client client, string zipCode)
    {
      var query = new Dictionary<string, object>();
      query.Add("zip", zipCode);
      query.Add("quantity", 10);
      AvailableNumbersResult numbers = await AvailableNumbers.List(client, query);
      return numbers;

    }
    static async Task<AvailableNumbersResult> searchTollFree(Client client, string pattern)
    {
      var query = new Dictionary<string, object>();
      query.Add("tollFreeWildCardPattern", pattern);
      query.Add("quantity", 10);
      AvailableNumbersResult numbers = await AvailableNumbers.List(client, query);
      return numbers;

    }

  }

}


