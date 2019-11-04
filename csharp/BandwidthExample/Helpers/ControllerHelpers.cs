using System.Net;
using System.Text;

namespace Helpers {


	public class ControllerHelpers {



		public static string getBody(HttpListenerRequest request){
			byte[] buffer = new byte[request.ContentLength64];

			request.InputStream.Read(buffer, 0, buffer.Length);

			return Encoding.UTF8.GetString(buffer, 0, buffer.Length);
		}
	}
}