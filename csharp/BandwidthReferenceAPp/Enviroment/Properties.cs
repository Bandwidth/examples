using System.IO;
using System.Collections.Generic;
namespace Enviroment {

	public class Properties {

		private static readonly Dictionary<string, string> PROPS = new Dictionary<string, string>();

		private Properties(){

		}

		public static void configure(string filePath){

			if(!File.Exists(filePath))
				return;
			

			string[] logFile = File.ReadAllLines(filePath);
			List<string> logList = new List<string>(logFile);


			foreach(string line in logList){
				int index = line.IndexOf('=');
				if(index == -1 || index >= line.Length) continue;

				string left = line.Substring(0, index);
				string right = line.Substring(index + 1, line.Length - index - 1);

				PROPS[left] = right;
			}
		}

		public static string getProperty(string key){

			if(PROPS.ContainsKey(key)){
				return PROPS[key];
			} else {
				return null;
			}
			
		}
	}
}