
using System.Threading;
using System.Collections.Generic;
using System.Text;
using System;
using System.Threading.Tasks;
using System.Net;


namespace Eagle {

	/**
	This is a light weight demo server, @author JLC
	 */
	public class Server {

		private static Server server = null;

		private static readonly Object sync = new Object();

		private static string _root;

		private static string _port;

		private static bool _stop = false;

		private static Dictionary<string, Func<HttpListenerRequest, HttpListenerResponse, string>> postMappings = new Dictionary<string, Func<HttpListenerRequest, HttpListenerResponse, string>>();

		private static Dictionary<string, Func<HttpListenerRequest, HttpListenerResponse, string>> getMappings = new Dictionary<string, Func<HttpListenerRequest, HttpListenerResponse, string>>();

		private Server(){

			 if (!HttpListener.IsSupported)
            {
                Console.WriteLine("HttpListner Not Supported");
                Console.Read();
                return;
            }

			HttpListener listner = new HttpListener();

			if(_port == null || _port.Length == 0){
            	listner.Prefixes.Add("http://+:8080/");
			} else {
				listner.Prefixes.Add("http://+:"+_port+"/");
			}
            
			 listner.Start();

			Task.Run( () => {
				
				int count = 0;
				while (!_stop)
				{
					HttpListenerContext task = listner.GetContext();
					
					
					Task respondTask = Task.Run(() => {
						try{
							HttpListenerContext ctx = task;
							string path = ctx.Request.RawUrl;
							string body = null;
							if("POST".Equals(ctx.Request.HttpMethod) && postMappings.ContainsKey(path)){
								body = postMappings[path](ctx.Request, ctx.Response);
							} 
							else if("GET".Equals(ctx.Request.HttpMethod) && getMappings.ContainsKey(path)){
								body = getMappings[path](ctx.Request, ctx.Response);
							}
							reply(ctx.Response, body);
						} finally{
							count++;
							Console.WriteLine("Finished listner task # " + count);
						}
					} );
				}

				listner.Stop();

				listner.Close();
			});

		}

		private static void reply(HttpListenerResponse response, string body){
			
			byte[] outBuffer = null;
			if(body != null){
				outBuffer = Encoding.ASCII.GetBytes(body);
				response.ContentLength64 = outBuffer.Length;
				response.OutputStream.Write(outBuffer, 0, outBuffer.Length);
			}

            response.StatusCode = 200;           
            response.OutputStream.Flush();
            response.OutputStream.Close();
            response.OutputStream.Dispose();
			response.Close();
		}

		public static void port(string port){
			if(server == null)
				getInstance();

			Server._port = port;
		}

		public static Server getInstance(){
			if(server == null ){
				lock(sync){
					if(server == null){
						server = new Server();
					}
				}
			}
			return Server.server;
		}

		public static void post(string path, Func<HttpListenerRequest, HttpListenerResponse, string> func){

			if(server == null)
				getInstance();

			if(path != null && path.Length != 0)
				postMappings[path] = func;
			
		}

		public static void get(string path, Func<HttpListenerRequest, HttpListenerResponse, string> func){

			if(server == null)
				getInstance();

			if(path != null && path.Length != 0)
				getMappings[path] = func;
			
		}


		
	}
}