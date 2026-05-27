const http = require('http');

const data = JSON.stringify({
  email: `test${Date.now()}@example.com`,
  password: 'Password123!',
  fullName: 'Test User',
  nationalId: `ID${Date.now()}`,
  employeeNumber: `EMP${Date.now()}`,
  phone: '123456789'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response Body: ${responseBody}`);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
