# Contributing 

When contributing to this repository, please first discuss the change you wish to make via a Github issue.

All changes must follow the guidelines in this document and be approved by members of Bandwidth's Developer Experience team.

Feel free to contact us at DX@Bandwidth.com.

## Code

All code samples must have a narrow scope and demonstrate a single use case using Bandwidth's APIs. For example, a single use case may be sending a text message based on some trigger. Sample code may include situations specific to Bandwidth's APIs such as rate limiting, queueing, and callbacks for sending messages.

All code samples must follow a logical sequence of events to demonstrate the use case.

Code samples should abstract all code that does not demonstrate usage of Bandwidth's APIs. For example, in a production setting a call masking system may include a complex database for storing the masking of numbers, but for this example repo a simple in memory data structure would be sufficient.

### API Calls

All API calls need to include code comments that clearly state the purpose of the API call, and the request and response bodies if applicable.

All API calls that require a callback URL need to clearly state that the API call requires a callback URL. The code sample should include a web server with the URL that expects to receive the callback from Bandwidth, and should clearly state what information is being received on this URL.

### BXML

All BXML code samples should be hosted on a web server that Bandwidth will access to retrieve BXML.
