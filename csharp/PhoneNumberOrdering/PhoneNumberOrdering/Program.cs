using System;
using System.Net;
using EagleServer.Exceptions;
using static Eagle.Server;
using System.Threading.Tasks;
using Bandwidth.Iris;
using Bandwidth.Iris.Model;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Xml.Serialization;
using System.Text;
using System.IO;

namespace PhoneNumberOrdering
{
    class Program
    {

        private static readonly string ACCOUNT_ID = Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
        private static readonly string USERNAME = Environment.GetEnvironmentVariable("BANDWIDTH_API_USERNAME");
        private static readonly string PASSWORD = Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");
        private static readonly string SITE_ID = Environment.GetEnvironmentVariable("BANDWIDTH_SITE_ID");

        private static Client client = Client.GetInstance(ACCOUNT_ID, USERNAME, PASSWORD, "https://dashboard.bandwidth.com");

        private static Dictionary<string, OrderIdentifier> storage = new Dictionary<string, OrderIdentifier>();

        static void Main(string[] args)
        {
            Console.WriteLine("Starting the Phone Number Ordering App");

            useHttp(true); //not https
            port("8080");
            startServerInstance();

            post("/subscriptions/orders", (EagleRequest request, HttpListenerResponse response) =>
            {
                XmlSerializer serializer = new XmlSerializer(typeof(Notification));
                Notification notification = (Notification)serializer.Deserialize(new MemoryStream(Encoding.UTF8.GetBytes(request.Body)));
                Console.WriteLine(notification.Status);
                Console.WriteLine(notification.Message);
            });

            post("/subscriptions/disconnects", (EagleRequest request, HttpListenerResponse response) =>
            {
                XmlSerializer serializer = new XmlSerializer(typeof(Notification));
                Notification notification = (Notification)serializer.Deserialize(new MemoryStream(Encoding.UTF8.GetBytes(request.Body)));
                Console.WriteLine(notification.Status);
                Console.WriteLine(notification.Message);

               var phoneNumber = notification.CompletedTelephoneNumbers[0];

                storage.Remove(phoneNumber);

            });

            get("/availablePhoneNumbers", (EagleRequest request, HttpListenerResponse response) =>
            {

                var queryParams = request.RawRequest.QueryString;
                var query = new Dictionary<string, object>()
                {
                    { "quantity", 10 },
                };

                if (queryParams.Get("zipCode") != null) query.Add("zip", queryParams.Get("zipCode"));

                if (queryParams.Get("areaCode") != null) query.Add("areaCode", queryParams.Get("areaCode"));


                try
                {
                    var res = AvailableNumbers.List(client, query).Result;
                    return res.TelephoneNumberList;
                } catch (AggregateException ex)
                {
                    if (ex.InnerException is BandwidthIrisException)
                    {
                        response.StatusCode = 400;
                        BandwidthIrisException irisEx = (BandwidthIrisException)ex.InnerException;
                        return new Error
                        {
                            BandwidthErrorCode = irisEx.Code,
                            BandwidthErrorDescription = irisEx.Body.ToString(),
                            Description = "Bandwidth Invalid User Input",
                            Type = "validation"
                        };
                    }
                    throw ex;
                }
            });

            post("/phoneNumbers", (EagleRequest request, HttpListenerResponse response) =>
            {
                string phoneNumber = request.Body.phoneNumber;

                if(storage.ContainsKey(phoneNumber))
                {
                    return new Error
                    {
                        Type = "owned number",
                        Description = "You have already ordered this number."
                    };
                }

                OrderResult orderResult;
                try
                {
                    orderResult = Order.Create(client, new Order
                    {
                        CustomerOrderId = "customerOrderId",
                        SiteId = SITE_ID, //The site to order the number for
                        ExistingTelephoneNumberOrderType = new ExistingTelephoneNumberOrderType
                        {
                            TelephoneNumberList = new string[] { phoneNumber }
                        }
                    }).Result;
                } catch (AggregateException ex)
                {
                    if (ex.InnerException is BandwidthIrisException)
                    {
                        response.StatusCode = 400;
                        BandwidthIrisException irisEx = (BandwidthIrisException)ex.InnerException;
                        return new Error
                        {
                            BandwidthErrorCode = irisEx.Code,
                            BandwidthErrorDescription = irisEx.Body.ToString(),
                            Description = "Bandwidth Invalid User Input",
                            Type = "validation"
                        };
                    }
                    throw ex;
                }

                var orderIdentifier = new OrderIdentifier
                {
                    OrderId = orderResult.Order.OrderId,
                    PhoneNumber = phoneNumber
                };
                storage.Add(phoneNumber, orderIdentifier);
                response.StatusCode = 201;
                return orderIdentifier;
            });

            get("/phoneNumbers", (EagleRequest request, HttpListenerResponse response) =>
            {
                return storage.Values;
            });

            delete("/phoneNumbers/{phoneNumber}", (EagleRequest request, HttpListenerResponse response) =>
            {

                string phoneNumber = request.PathInfo.PathParameters.phoneNumber;

                if( !storage.ContainsKey(phoneNumber))
                {
                    response.StatusCode = 404;
                    return new Error
                    {
                        Description = "This number has not ordered yet, cannot remove.",
                        Type = "not found"
                    };
                }

                try
                {
                    Disconnect.Create(client, "orderName", phoneNumber);
                }
                catch (AggregateException ex)
                {
                    if (ex.InnerException is BandwidthIrisException)
                    {
                        response.StatusCode = 400;
                        BandwidthIrisException irisEx = (BandwidthIrisException)ex.InnerException;
                        return new Error
                        {
                            BandwidthErrorCode = irisEx.Code,
                            BandwidthErrorDescription = irisEx.Body.ToString(),
                            Description = "Bandwidth Invalid User Input",
                            Type = "validation"
                        };
                    }
                    throw ex;
                }
                response.StatusCode = 201;
                return new Dictionary<string, bool>() {{ "Recieved", true }};
            });

            post("/stop", (EagleRequest request, HttpListenerResponse response) => {                
                stop();
                return "Server Shutting Down";
            });

            Console.WriteLine("Server is Ready!!!!!!!!!");
            WaitOnServerToStop();
        }

        private class Error
        {
            public string Type { get; set; }
            public string Description { get; set; }
            public string BandwidthErrorCode { get; set; }
            public string BandwidthErrorDescription { get; set; }

        }

        private class OrderIdentifier
        {
            public string OrderId { get; set; }
            public string PhoneNumber { get; set; }
        }

        
    }

    public class Notification
    {
        public string Status { get; set; }
        public string SubscriptionId { get; set; }
        public string Message { get; set; }
        public string OrderId { get; set; }
        public string OrderType { get; set; }

        [XmlArrayItem("TelephoneNumber")]
        public string[] CompletedTelephoneNumbers { get; set; }

    }
}
