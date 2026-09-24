const http = require('http');
const { spawn } = require('child_process');

const server = spawn('node', ['app.js'], {
  env: { ...process.env, PORT: '8081' }
});
function request() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8081', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);
  });
}

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await request();

    if (response.statusCode !== 200) {
      throw new Error(`Expected status 200, received ${response.statusCode}`);
    }

    if (response.body !== 'Hello World!') {
      throw new Error(`Unexpected response: ${response.body}`);
    }

    console.log('✓ Unit test passed: GET / returned Hello World!');
    server.kill();
    process.exit(0);
  } catch (error) {
    console.error('✗ Unit test failed:', error.message);
    server.kill();
    process.exit(1);
  }
})();
