using System;
using System.Threading.Tasks;
using Bandwidth.Iris;
using Bandwidth.Iris.Model;
namespace BandwidthApplicationSetup
{
    class Program
    {

        private static readonly string ACCOUNT_ID = Environment.GetEnvironmentVariable("IRIS_ACCOUNT_ID");
        private static readonly string USERNAME = Environment.GetEnvironmentVariable("IRIS_USERNAME");
        private static readonly string PASSWORD = Environment.GetEnvironmentVariable("IRIS_PASSWORD");

        private static Client client = Client.GetInstance(ACCOUNT_ID, USERNAME, PASSWORD, "https://dashboard.bandwidth.com");

        private static Site site;
        private static SipPeer sipPeer;

        static void Main(string[] args)
        {
            createSiteAndSipPeer().Wait();
            createMessageApplication().Wait();
            createVoiceApplication().Wait();
        }

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


            sipPeer = await SipPeer.Create(client, new SipPeer
            {
                SiteId = site.Id,
                Name = "BandwidthApplicationLocation",
                IsDefaultPeer = true
            });
        }

        static async Task createMessageApplication()
        {
            var appMsg = await Application.Create(client, new Application
            {
                AppName = "BandwidthMsgApplication",
                ServiceType = "Messaging-V2",
                MsgCallbackUrl = "https://yourcallback.com"
            });
      
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

            await SipPeer.UpdateApplicationSettings(client, site.Id, sipPeer.Id, new ApplicationsSettings
            {
                HttpMessagingV2AppId = appMsg.Application.ApplicationId
            });
        }

        static async Task createVoiceApplication()
        {
            var appVoice = await Application.Create(client, new Application
            {
                AppName = "BandwidthVoiceApplication",
                ServiceType = "Voice-V2",
                CallInitiatedCallbackUrl = "https://yourcallback.com"
            });

            var featureVoice = await SipPeer.SetOriginationSettings(client, site.Id, sipPeer.Id, new SipPeerOriginationSettings
            {
                VoiceProtocol = "HTTP",
                HttpSettings = new HttpSettings
                {
                    HttpVoiceV2AppId = appVoice.Application.ApplicationId
                }
            });

        }


    }
}
