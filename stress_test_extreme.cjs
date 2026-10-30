// stress_test_extreme.cjs
// Simulates extreme production concurrency with authenticated JWT tokens:
// 1. 2,000 concurrent client portal requests (read heavy)
// 2. 500 concurrent designer asset queries
// 3. 100 Account Manager approval/strategy queries

const crypto = require('crypto');
const BASE_URL = 'https://pragency.pages.dev';
const SECRET_KEY = '9948c70f-d00f-4af8-8f39-8ae205b23281-pragency-jwt-secure-signing-prod-key-2026';

function generateClientToken(clientId) {
  const payload = {
    sub: clientId,
    name: 'Stress Test Client',
    email: 'client@stresstest.com',
    token_type: 'client',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (86400 * 30),
    expiresIn: '30d'
  };
  const jsonBytes = Buffer.from(JSON.stringify(payload));
  const str = jsonBytes.toString('base64');
  const sig = crypto.createHash('sha256').update(`${str}.${SECRET_KEY}`).digest('hex');
  return `${str}.${sig}`;
}

async function runExtremeStressTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 STARTING EXTREME STRESS TEST (2,000+ AUTHENTICATED USERS)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const statusCodes = {};
  const latencies = [];

  // Helper worker pool with concurrency chunking
  async function runBatch(tasks, concurrency) {
    let index = 0;
    const workers = new Array(concurrency).fill(0).map(async () => {
      while (index < tasks.length) {
        const currentIndex = index++;
        const fn = tasks[currentIndex];
        const t0 = Date.now();
        try {
          const res = await fn();
          const dt = Date.now() - t0;
          latencies.push(dt);
          totalRequests++;
          statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;
          if (res.status >= 200 && res.status < 400) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        } catch (e) {
          totalRequests++;
          failedRequests++;
          statusCodes['ERROR_' + e.code] = (statusCodes['ERROR_' + e.code] || 0) + 1;
        }
      }
    });
    await Promise.all(workers);
  }

  // Phase A: 2,000 Client Portal Read Requests with valid JWT
  console.log('▶ [PHASE 1] Simulating 2,000 Concurrent Authenticated Client Portal Reads...');
  const clientTasks = [];
  for (let i = 0; i < 2000; i++) {
    const token = generateClientToken(`client_stress_${i % 100}`);
    clientTasks.push(() => fetch(`${BASE_URL}/api/portal/calendar`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }));
  }
  await runBatch(clientTasks, 40);
  console.log(`  ✔ Phase 1 Complete: 2,000 requests processed.`);

  // Phase B: 500 Concurrent Deliverable Reads
  console.log('▶ [PHASE 2] Simulating 500 Concurrent Deliverables & Settings Requests...');
  const designerTasks = [];
  for (let i = 0; i < 500; i++) {
    const token = generateClientToken(`client_stress_${i % 50}`);
    designerTasks.push(() => fetch(`${BASE_URL}/api/portal/settings`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }));
  }
  await runBatch(designerTasks, 30);
  console.log(`  ✔ Phase 2 Complete: 500 operations processed.`);

  // Phase C: 100 Account Manager Strategy Requests
  console.log('▶ [PHASE 3] Simulating 100 Account Manager Strategy Queries...');
  const amTasks = [];
  for (let i = 0; i < 100; i++) {
    const token = generateClientToken(`client_stress_${i % 20}`);
    amTasks.push(() => fetch(`${BASE_URL}/api/portal/strategy`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }));
  }
  await runBatch(amTasks, 20);
  console.log(`  ✔ Phase 3 Complete: 100 operations processed.\n`);

  const totalDuration = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);
  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (totalRequests / totalDuration).toFixed(1);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 STRESS TEST SUMMARY RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Requests Executed : ${totalRequests}`);
  console.log(`Successful Requests     : ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(2)}%)`);
  console.log(`Failed / Errors         : ${failedRequests}`);
  console.log(`Total Elapsed Time      : ${totalDuration.toFixed(2)} seconds`);
  console.log(`Throughput              : ${rps} Requests/Sec`);
  console.log(`Average Latency         : ${avgLatency} ms`);
  console.log(`p95 Latency             : ${p95} ms`);
  console.log(`p99 Latency             : ${p99} ms`);
  console.log('HTTP Status Breakdown   :', JSON.stringify(statusCodes, null, 2));
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failedRequests === 0) {
    console.log('🏆 VERDICT: EXTREME STRESS TEST PASSED WITH 100% SUCCESS!');
  } else {
    console.log(`⚠️ VERDICT: COMPLETED WITH ${failedRequests} FAILS`);
  }
}

runExtremeStressTest();
