using System;
using System.Threading.Tasks;
using Bandwidth.Iris;
using Bandwidth.Iris.Model;
namespace BandwidthApplicationSetup
{
    class Program
    {

        private static readonly string ACCOUNT_ID = Environment.GetEnvironmentVariable("BANDWIDTH_ACCOUNT_ID");
        private static readonly string USERNAME = Environment.GetEnvironmentVariable("BANDWIDTH_API_USER");
        private static readonly string PASSWORD = Environment.GetEnvironmentVariable("BANDWIDTH_API_PASSWORD");

        private static Client client = Client.GetInstance(ACCOUNT_ID, USERNAME, PASSWORD, "https://dashboard.bandwidth.com");

        private static Site site;
        private static SipPeer sipPeer;

        static void Main(string[] args)
        {
            createSiteAndSipPeer().Wait();
            createMessageApplication().Wait();
            createVoiceApplication().Wait();
        }

        /// <summary>
        /// This method will create a Bandwidth
        ///
        /// Site which on the Bandwidth Console is a Subaccount
        ///
        /// SipPeer which on the Bandwidth Console is a location
        /// </summary>
        /// <returns></returns>
        static async Task createSiteAndSipPeer()
        {
            site = await Site.Create(client, new Site
            {
                Name = "BandwidthApplicationSubAccount",
                Address = new Address
                {
                    City = "RALEIGH",
                    HouseNumber = "900",
                    StateCode = "NC",
                    StreetName = "Main Campus Dr",
                    StreetSuffix = "DR",
                    Zip = "27606",
                    AddressType = "Billing"
                }
            });

            Console.WriteLine($"Created Site/Subaccount with ID: {site.Id}");

            sipPeer = await SipPeer.Create(client, new SipPeer
            {
                SiteId = site.Id,
                Name = "BandwidthApplicationLocation",
                IsDefaultPeer = true
            });

            Console.WriteLine($"Created SipPeer/Location with ID: {sipPeer.Id}");
        }

        /// <summary>
        /// Using the Site and SipPeer created in the createSiteAndSipPeer()
        /// this method will create a Messaging application and associate it with
        /// the newly created SipPeer (location).
        /// It will also add the SMS and MMS features toteh SipPeer (location)
        /// This makes it possible for the SipPeer (location) to be used by a Messaging Application
        /// </summary>
        /// <returns></returns>
        static async Task createMessageApplication()
        {
            var appMsg = await Application.Create(client, new Application
            {
                AppName = "BandwidthMsgApplication",
                ServiceType = "Messaging-V2",
                MsgCallbackUrl = "https://yourcallback.com"
            });

            Console.WriteLine($"Created Messaging Appliction with ID: {appMsg.Application.ApplicationId}");

            var featureSmsMsg = await SipPeer.CreateSMSSettings(client, site.Id, sipPeer.Id, new SipPeerSmsFeature
            {
                SipPeerSmsFeatureSettings = new SipPeerSmsFeatureSettings
                {
                    TollFree = false,
                    ShortCode = false,
                    Protocol = "HTTP",
                    Zone1 = true,
                    Zone2 = false,
                    Zone3 = false,
                    Zone4 = false,
                    Zone5 = false,
                },
                HttpSettings = new HttpSettings
                {

                }
            });

            Console.WriteLine("Updated SipPeer/Location with SMS Settings.");

            var featureMmsMsg = await SipPeer.CreateMMSSettings(client, site.Id, sipPeer.Id, new MmsFeature
            {
                MmsSettings = new MmsSettings
                {
                    Protocol = "HTTP"
                },
                Protocols = new Protocols
                {
                    HTTP = new HTTP {
                        HttpSettings = new HttpSettings
                        {

                        }
                    }
                }
            });

            Console.WriteLine("Updated SipPeer/Location with MMS Settings.");

            await SipPeer.UpdateApplicationSettings(client, site.Id, sipPeer.Id, new ApplicationsSettings
            {
                HttpMessagingV2AppId = appMsg.Application.ApplicationId
            });

            Console.WriteLine("Updated SipPeer/Location with Messaging Application");
        }

        /// <summary>
        /// Using the Site and SipPeer created in the createSiteAndSipPeer()
        /// this method will create a Voice application and associate it with
        /// the newly created SipPeer (location).
        /// This is done through the SipPeer by setting the Origination Settings
        /// </summary>
        /// <returns></returns>
        static async Task createVoiceApplication()
        {
            var appVoice = await Application.Create(client, new Application
            {
                AppName = "BandwidthVoiceApplication",
                ServiceType = "Voice-V2",
                CallInitiatedCallbackUrl = "https://yourcallback.com"
            });

            Console.WriteLine($"Created Voice Application with ID: {appVoice.Application.ApplicationId}");

            var featureVoice = await SipPeer.SetOriginationSettings(client, site.Id, sipPeer.Id, new SipPeerOriginationSettings
            {
                VoiceProtocol = "HTTP",
                HttpSettings = new HttpSettings
                {
                    HttpVoiceV2AppId = appVoice.Application.ApplicationId
                }
            });

            Console.WriteLine("Updated SipPeer/Location with Voice Application");
        }
    }
}
