import { execSync } from 'child_process';
import net from 'net';

// Simple port checker - wait for port to be open
async function waitForPortOpen(port: number, host = 'localhost', timeout = 30000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = new net.Socket();
        
        socket.setTimeout(1000);
        socket.once('error', reject);
        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error('timeout'));
        });
        
        socket.connect(port, host, () => {
          socket.end();
          resolve();
        });
      });
      
      // Port is open
      return;
    } catch (error) {
      // Port not open yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error(`Port ${port} did not open within ${timeout}ms`);
}

module.exports = async function () {
  console.log('\n🔧 Setting up E2E test environment...\n');

  // In Docker setup, database and API are already running
  // This global setup just validates connectivity
  
  const apiUrl = process.env.API_URL;
  if (apiUrl) {
    console.log(`✓ API URL configured: ${apiUrl}`);
  }

  // Try to connect to API
  console.log('⏳ Waiting for API to be ready...');
  const apiPort = 3000;
  
  try {
    await waitForPortOpen(apiPort, 'localhost', 10000);
    console.log('✅ E2E environment ready - API is responsive\n');
  } catch (error) {
    console.log('⚠️  Could not verify API connection - tests may fail\n');
  }
  
  globalThis.__TEARDOWN_MESSAGE__ = '\n🧹 Tearing down E2E environment...\n';
};
