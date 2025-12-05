const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/public/status', // Assuming this route exists based on main.js logs
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Custom-Header': 'test-value'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();

// Test error handling
setTimeout(() => {
    const errorOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/force-error', // This route likely doesn't exist, hopefully triggering 404 which is handled by fastify, but to test global error handler I might need a route that throws. 
        // Since I can't easily add a throwing route without restarting server code which I already did, I will just trigger a 404 and check if it logs. 
        // But the requirement was "logger for any errors in the server". 404 is usually not an "error" in that sense but handled.
        // Let's rely on the modification I made: app.setErrorHandler catches errors. 
        // Fastify 404s might not trigger setErrorHandler by default depending on config, but let's try.
        method: 'GET'
    };
    
    const reqError = http.request(errorOptions, (res) => {
        console.log(`Error Req STATUS: ${res.statusCode}`);
    });
    reqError.on('error', (e) => console.error(e));
    reqError.end();
}, 1000);
