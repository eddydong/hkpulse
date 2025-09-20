const http = require('http');

const data = JSON.stringify({ token: "iPVzdV0u56vfoeWIrF1V85N8vSQPN9eEYHbZqjPNctYD1HlDTRGldDJ4WBixdmR1" });

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();
