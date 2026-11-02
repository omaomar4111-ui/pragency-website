// tests/test-offline-sync.cjs
// Automated test suite for PR Agency OS Offline Sync & Mutation Queueing Engine

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runOfflineSyncTests() {
  console.log('📡 Starting Offline Sync Engine Test Suite...\n');

  // Load and evaluate native-sync in simulated DOM environment
  const scriptContent = fs.readFileSync(path.join(__dirname, '../js/native-sync.js'), 'utf-8');

  let networkListeners = [];
  let dispatchedEvents = [];
  let storedStorage = {};
  let originalFetchCalls = [];

  const fakeDocument = {
    createElement(tag) {
      return {
        tagName: tag,
        id: '',
        style: {},
        innerHTML: '',
        textContent: '',
        classList: {
          remove: () => {},
          add: () => {}
        },
        remove: () => {}
      };
    },
    getElementById(id) {
      return null;
    },
    body: {
      appendChild: () => {}
    },
    addEventListener: () => {}
  };

  const fakeWindow = {
    location: { pathname: '/sales-crm-2026.html' },
    addEventListener(event, fn) {
      networkListeners.push({ event, fn });
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
    },
    localStorage: {
      getItem(k) { return storedStorage[k] || null; },
      setItem(k, v) { storedStorage[k] = v; },
      removeItem(k) { delete storedStorage[k]; }
    },
    navigator: { onLine: false } // Start simulated offline
  };

  // Mock baseline fetch
  fakeWindow.fetch = async (url, opts) => {
    originalFetchCalls.push({ url, opts });
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    };
  };

  // Run the script in the context of fakeWindow & fakeDocument
  const runner = new Function('window', 'document', 'navigator', 'localStorage', scriptContent);
  runner(fakeWindow, fakeDocument, fakeWindow.navigator, fakeWindow.localStorage);

  const NativeSync = fakeWindow.NativeSync;
  assert.ok(NativeSync, 'NativeSync global object must be initialized');

  // TEST 1: Initial state & Offline Interception
  console.log('💾 Test 1: Testing transparent mutation interception while offline...');
  const offlineResp = await fakeWindow.fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'عميل أوفلاين', phone: '01012345678' })
  });

  assert.strictEqual(offlineResp.status, 202, 'Offline interception should return 202 Accepted');
  const offlineData = await offlineResp.json();
  assert.strictEqual(offlineData.offline, true, 'Response must identify as offline');

  const queueAfterFirst = await NativeSync.getStoredQueue();
  assert.strictEqual(queueAfterFirst.length, 1, 'Queue must contain 1 queued mutation');
  assert.strictEqual(queueAfterFirst[0].endpoint, '/api/contact');
  assert.strictEqual(queueAfterFirst[0].body.name, 'عميل أوفلاين');
  console.log('✅ Test 1 Passed: Offline mutation transparently caught and saved in queue.');

  // TEST 2: Second mutation queued (Lead update in CRM)
  console.log('\n💼 Test 2: Queueing CRM Lead update while offline...');
  await fakeWindow.fetch('/api/admin/sales/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'lead_999', pipeline_stage: 'contacted' })
  });

  const queueAfterSecond = await NativeSync.getStoredQueue();
  assert.strictEqual(queueAfterSecond.length, 2, 'Queue must now contain 2 queued mutations');
  assert.strictEqual(queueAfterSecond[1].endpoint, '/api/admin/sales/leads');
  console.log('✅ Test 2 Passed: Multiple mutations preserved with sequence intact.');

  // TEST 3: Network Restoration & Cloud Sync
  console.log('\n🟢 Test 3: Simulating network return and triggering auto-sync...');
  fakeWindow.navigator.onLine = true;
  originalFetchCalls = []; // Reset call recorder

  await NativeSync.syncOfflineQueue();

  assert.strictEqual(originalFetchCalls.length, 2, 'Sync engine must replay all 2 mutations to the server');
  assert.strictEqual(originalFetchCalls[0].url, '/api/contact');
  assert.strictEqual(originalFetchCalls[1].url, '/api/admin/sales/leads');

  const queueAfterSync = await NativeSync.getStoredQueue();
  assert.strictEqual(queueAfterSync.length, 0, 'Queue must be empty after successful cloud sync');
  assert.ok(dispatchedEvents.some(e => e.type === 'offline-sync-completed'), 'offline-sync-completed event must be dispatched');
  console.log('✅ Test 3 Passed: Cloud sync successfully replayed mutations and cleared queue.');

  console.log('\n🎉 ALL OFFLINE SYNC TESTS PASSED SUCCESSFULLY! 🚀');
}

runOfflineSyncTests().catch(err => {
  console.error('\n❌ Offline Sync Tests Failed:', err);
  process.exit(1);
});
