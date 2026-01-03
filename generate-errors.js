#!/usr/bin/env node
/**
 * Generate 5000 error events for ErrorWatch testing
 * Usage: node generate-errors.js [count] [apiKey] [mode]
 * 
 * Examples:
 *   node generate-errors.js                                    # Generate 5000 errors (burst mode)
 *   node generate-errors.js 1000 YOUR_API_KEY                  # Generate 1000 errors with custom API key
 *   node generate-errors.js 5000 YOUR_API_KEY progressive      # Progressive mode (50ms delay between errors)
 */

const http = require('http');

// Configuration from CLI args
const args = process.argv.slice(2);
const TOTAL_ERRORS = parseInt(args[0]) || 5000;
const API_KEY = args[1] || 'test-api-key'; // Default test key
const MODE = args[2] || 'burst'; // 'burst' or 'progressive'
const DELAY_MS = 50; // Delay between errors in progressive mode

// API Configuration
const API_URL = process.env.API_URL || 'http://localhost:3333';
const API_ENDPOINT = `${API_URL}/api/v1/event`;

// Error scenarios (similar to Symfony command)
const errorScenarios = [
  { type: 'RuntimeException', message: 'Unexpected runtime error occurred during request processing', file: 'src/Service/UserService.php', line: 142, url: '/api/users' },
  { type: 'LogicException', message: 'Invalid application state: cannot proceed with current configuration', file: 'src/Controller/ApiController.php', line: 89, url: '/api/status' },
  { type: 'InvalidArgumentException', message: 'Parameter "user_id" must be a positive integer, got: -1', file: 'src/Repository/UserRepository.php', line: 56, url: '/api/users' },
  { type: 'RuntimeException', message: 'PaymentGatewayException: Card declined (INSUFFICIENT_FUNDS)', file: 'src/Payment/StripeGateway.php', line: 234, url: '/checkout/payment' },
  { type: 'LogicException', message: 'InventoryException: Product SKU-1234 is out of stock', file: 'src/Inventory/StockManager.php', line: 89, url: '/cart/add' },
  { type: 'RuntimeException', message: 'HTTP 400: Malformed JSON in request body', file: 'src/Controller/ApiController.php', line: 45, url: '/api/users' },
  { type: 'RuntimeException', message: 'HTTP 404: Resource not found', file: 'src/Repository/EntityRepository.php', line: 112, url: '/api/users/99999' },
  { type: 'RuntimeException', message: 'PDOException: SQLSTATE[HY000] [2002] Connection refused', file: 'src/Database/ConnectionPool.php', line: 45, url: '/api/db' },
  { type: 'RuntimeException', message: 'HttpClientException: Request to external API timed out', file: 'src/Client/ExternalApiClient.php', line: 123, url: '/api/external' },
  { type: 'RuntimeException', message: 'JWTException: Invalid token signature', file: 'src/Security/JwtValidator.php', line: 89, url: '/api/me' },
];

// Levels for variety
const levels = ['fatal', 'error', 'warning', 'info', 'debug'];

// Generate random error payload
function generateErrorPayload(index) {
  const scenario = errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
  const level = levels[Math.floor(Math.random() * levels.length)];
  
  // Generate stack trace
  const stack = [
    `Error: ${scenario.message} #${index}`,
    `    at ${scenario.type} (${scenario.file}:${scenario.line})`,
    `    at Service.execute (${scenario.file.replace(/Service\/.*$/, 'Service/BaseService.php')}:45)`,
    `    at Controller.handle (${scenario.file.replace(/src\/.*$/, 'src/Controller/BaseController.php')}:89)`,
    `    at Router.dispatch (${scenario.file.replace(/src\/.*$/, 'src/Router.php')}:123)`,
  ].join('\n');

  // Optional breadcrumbs
  const breadcrumbs = Math.random() > 0.5 ? [
    {
      timestamp: Date.now() - 1000,
      category: 'ui',
      type: 'click',
      level: 'info',
      message: 'User clicked on button',
    },
    {
      timestamp: Date.now() - 500,
      category: 'http',
      type: 'xhr',
      level: 'info',
      message: 'API request sent',
    },
  ] : undefined;

  return {
    message: `${scenario.message} #${index}`,
    file: scenario.file,
    line: scenario.line,
    stack: stack,
    env: 'production',
    url: `http://localhost:8000${scenario.url}`, // Full URL
    level: level,
    created_at: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24h
    breadcrumbs: breadcrumbs,
    release: `v1.0.${Math.floor(Math.random() * 10)}`,
  };
}

// Send error to API
function sendError(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3333,
      path: '/api/v1/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-API-Key': API_KEY,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode });
        } else {
          reject({ status: res.statusCode, error: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main function
async function main() {
  console.log('🚀 Generating error events for ErrorWatch testing...');
  console.log('=====================================================');
  console.log(`Total errors: ${TOTAL_ERRORS}`);
  console.log(`Mode: ${MODE}`);
  console.log(`API endpoint: ${API_ENDPOINT}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  if (MODE === 'burst') {
    // Burst mode: send all errors as fast as possible
    console.log(`📊 Sending ${TOTAL_ERRORS} errors in burst mode...`);
    
    const promises = [];
    for (let i = 0; i < TOTAL_ERRORS; i++) {
      const payload = generateErrorPayload(i);
      promises.push(
        sendError(payload)
          .then(() => {
            successCount++;
            process.stdout.write(`\rProgress: ${successCount}/${TOTAL_ERRORS} (${Math.round(successCount/TOTAL_ERRORS*100)}%)`);
          })
          .catch((err) => {
            errorCount++;
            if (err.status !== 429) { // Don't log quota errors
              console.error(`\n❌ Error ${i}:`, err.status || err.message);
            }
          })
      );
    }

    await Promise.all(promises);

  } else {
    // Progressive mode: send errors with delay
    console.log(`📊 Sending ${TOTAL_ERRORS} errors in progressive mode (${DELAY_MS}ms delay)...`);
    
    for (let i = 0; i < TOTAL_ERRORS; i++) {
      const payload = generateErrorPayload(i);
      
      try {
        await sendError(payload);
        successCount++;
        const percent = Math.round(successCount / TOTAL_ERRORS * 100);
        process.stdout.write(`\rProgress: ${successCount}/${TOTAL_ERRORS} (${percent}%)`);
      } catch (err) {
        errorCount++;
        if (err.status === 429) {
          console.error(`\n⚠️  Quota exceeded, waiting 5s...`);
          await new Promise(r => setTimeout(r, 5000));
        } else if (err.status !== 401) {
          console.error(`\n❌ Error ${i}:`, err.status || err.message);
        }
      }

      // Delay between errors
      if (i < TOTAL_ERRORS - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n');
  console.log('=====================================================');
  console.log(`✅ Done! Generated ${successCount} error events`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed: ${errorCount} errors`);
  }
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('');
  console.log('🔍 Check your ErrorWatch dashboard: http://localhost:3001/dashboard');
  console.log('');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
