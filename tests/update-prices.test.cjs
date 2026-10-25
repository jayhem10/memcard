const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: name => name in imports ? imports[name] : require(name),
    process: { env: {} },
    console: { error() {} },
    AbortSignal,
    Date,
    Error,
    ...globals,
  }, { filename: file });
  return exports;
}

const id = number => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const price = (number, age = 0, value = 10) => ({
  game_id: id(number),
  last_updated: new Date(now - age).toISOString(),
  average_price: value,
  min_price: value,
  max_price: value,
  new_price: null,
});

function routeFixture(games, prices = [], outcomes = {}, role = 'admin') {
  const rows = new Map(prices.map(row => [row.game_id, row]));
  const calls = [];
  const supabaseAdmin = {
    from(table) {
      let cursor = '';
      let ids = [];
      let limit = Infinity;
      const query = {
        select() { return query; },
        order() { return query; },
        limit(value) { limit = value; return query; },
        gt(field, value) { cursor = value; return query; },
        in(field, value) { ids = value; return query; },
        returns() {
          return Promise.resolve({
            data: table === 'games'
              ? games.filter(game => game.id > cursor).slice(0, limit)
              : ids.flatMap(gameId => rows.has(gameId) ? [rows.get(gameId)] : []),
            error: null,
          });
        },
        insert(values) {
          for (const row of values) rows.set(row.game_id, row);
          return Promise.resolve({ error: null });
        },
        update(values) {
          return {
            eq(field, gameId) {
              rows.set(gameId, { ...rows.get(gameId), ...values });
              return { select: async () => ({ data: [{ game_id: gameId }], error: null }) };
            },
          };
        },
      };
      return query;
    },
  };
  class ApiError extends Error {
    constructor(message, status) { super(message); this.status = status; }
  }
  const context = {
    user: { id: 'admin' },
    supabase: { from: () => ({ select: () => ({ eq: () => ({
      single: async () => ({ data: { role }, error: null }),
    }) }) }) },
  };
  const route = loadTs('src/app/api/admin/update-outdated-prices/route.ts', {
    '@/lib/api-wrapper': { ApiError, withApi: handler => request => handler(request, context) },
    '@/lib/supabaseAdmin': { supabaseAdmin },
    '@/lib/ebay': {
      fetchEbayPriceSamples: async params => {
        calls.push(params);
        const outcome = outcomes[params.title];
        if (outcome instanceof Error) throw outcome;
        return { used: outcome === 'skip' ? [] : [{ value: 20, currency: 'EUR' }], new: [] };
      },
      summarizePrices: used => used.length ? {
        min_price: 20, max_price: 20, average_price: 20, new_price: null, currency: 'EUR',
      } : null,
    },
  }, {
    Date: class extends Date { static now() { return now; } },
    AbortSignal: {
      timeout(milliseconds) {
        assert.equal(milliseconds, 20_000);
        return AbortSignal.timeout(milliseconds);
      },
    },
  });
  return {
    ...route, rows, calls,
    post: (body = {}) => route.POST({ json: async () => body }),
  };
}

function games(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: id(index + 1), title: `Game ${index + 1}`, console: { abbreviation: 'PS2', name: 'PlayStation 2' },
  }));
}

test('eligibility includes missing/empty prices, null dates and strictly older than 7 days', async () => {
  const rows = [price(1, 7 * day), price(2, 7 * day + 1), price(3, 0, null), price(5, day)];
  rows[3].last_updated = null;
  const fixture = routeFixture(games(5), rows);
  const first = await fixture.post();
  assert.equal(first.total, 1);
  assert.equal(first.updated, 1);
  assert.equal(first.nextCursor, id(2));
  assert.deepEqual(fixture.calls.map(call => call.title), ['Game 2']);
  assert.equal(fixture.rows.get(id(1)).average_price, 10);
  assert.equal(fixture.rows.get(id(2)).average_price, 20);
  assert.ok(fixture.calls.every(call => call.signal instanceof AbortSignal));
  assert.equal(fixture.maxDuration, 60);
  const second = await fixture.post({ cursor: first.nextCursor });
  assert.equal(second.total, 1);
  assert.equal(second.nextCursor, id(3));
  const third = await fixture.post({ cursor: second.nextCursor });
  assert.equal(third.total, 1);
  assert.equal(third.nextCursor, id(4));
  const fourth = await fixture.post({ cursor: third.nextCursor });
  assert.equal(fourth.total, 1);
  assert.equal(fourth.nextCursor, null);
});

test('skipped and failed games advance the cursor without overwriting existing prices', async () => {
  const fixture = routeFixture(games(4), [price(1, 8 * day)], {
    'Game 1': 'skip', 'Game 2': new Error('eBay rate limit'),
  });
  const first = await fixture.post();
  assert.equal(first.updated, 0);
  assert.equal(first.skipped, 1);
  assert.equal(fixture.rows.get(id(1)).average_price, 10);
  const second = await fixture.post({ cursor: first.nextCursor });
  assert.equal(second.errorsCount, 1);
  assert.equal(second.errorSamples[0].reason, 'eBay rate limit');
  assert.equal(fixture.rows.get(id(2)).last_updated, null);
  assert.equal(fixture.calls.length, 2);
});

test('pagination traverses more than the Supabase default of 1000 rows', async () => {
  const fixture = routeFixture(games(1101), Array.from({ length: 1100 }, (_, index) => price(index + 1)));
  let cursor = null;
  let requests = 0;
  do {
    const result = await fixture.post({ cursor });
    cursor = result.nextCursor;
    requests++;
  } while (cursor);
  assert.equal(requests, 12);
  assert.equal(fixture.calls.length, 1);
  assert.equal(fixture.calls[0].title, 'Game 1101');
});

test('route rejects non-admin requests and invalid cursors', async () => {
  await assert.rejects(routeFixture([], [], {}, 'user').post(), error => error.status === 403);
  await assert.rejects(routeFixture([]).post({ cursor: 'invalid' }), error => error.status === 400);
});

function clientFixture(responses) {
  const requests = [];
  const client = loadTs('src/lib/update-prices.ts', {}, {
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      assert.ok(responses.length, 'Unexpected extra request');
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    },
    setTimeout(callback) { callback(); return 0; },
  });
  return { ...client, requests };
}

function batch(overrides = {}) {
  return new Response(JSON.stringify({
    updated: 1, skipped: 0, errorsCount: 0, total: 1,
    errorSamples: [], nextCursor: null, isSandbox: false, ...overrides,
  }), { headers: { 'Content-Type': 'application/json' } });
}

test('client follows cursors, sends authentication and aggregates all results', async () => {
  const fixture = clientFixture([
    batch({ nextCursor: id(3), updated: 2, skipped: 1, total: 3 }),
    batch({ updated: 0, errorsCount: 1, errorSamples: [{ gameId: id(4), reason: 'Timeout' }] }),
  ]);
  const progress = [];
  const result = await fixture.updateOutdatedPrices('test-token', message => progress.push(message));
  assert.equal(fixture.requests[0].headers.Authorization, 'Bearer test-token');
  assert.equal(JSON.parse(fixture.requests[1].body).cursor, id(3));
  assert.equal(result.success, false);
  assert.match(result.message, /2 mis à jour, 1 ignorés, 1 erreurs sur 4 jeux/);
  assert.match(result.message, /Timeout/);
  assert.equal(progress.length, 2);
});

test('client reports plain text hosting failures instead of a JSON syntax error', async () => {
  const fixture = clientFixture([
    batch({ nextCursor: id(3) }),
    new Response('An error occurred with your deployment', { status: 504 }),
    new Response('An error occurred with your deployment', { status: 504 }),
    new Response('An error occurred with your deployment', { status: 504 }),
  ]);
  await assert.rejects(fixture.updateOutdatedPrices('test-token', () => {}), /non JSON \(HTTP 504\).*après 1 jeux/);
});

test('client retries an interrupted batch using the same cursor and keeps the run moving', async () => {
  const fixture = clientFixture([
    new TypeError('Failed to fetch'),
    new Response('Gateway Timeout', { status: 504 }),
    batch({ nextCursor: id(3), updated: 2, total: 2 }),
    batch({ updated: 1, total: 1 }),
  ]);
  const progress = [];
  const result = await fixture.updateOutdatedPrices('test-token', message => progress.push(message));
  assert.equal(fixture.requests.length, 4);
  assert.equal(fixture.requests[0].body, fixture.requests[1].body);
  assert.equal(fixture.requests[1].body, fixture.requests[2].body);
  assert.equal(JSON.parse(fixture.requests[3].body).cursor, id(3));
  assert.equal(result.success, true);
  assert.equal(result.message, 'Mise à jour terminée : 3 mis à jour, 0 ignorés, 0 erreurs sur 3 jeux ciblés.');
  assert.equal(progress.filter(message => message.includes('nouvelle tentative')).length, 2);
});

test('client stops after repeated network failures with a recovery message', async () => {
  const fixture = clientFixture([
    new TypeError('Failed to fetch'),
    new TypeError('Failed to fetch'),
    new TypeError('Failed to fetch'),
  ]);
  await assert.rejects(
    fixture.updateOutdatedPrices('test-token', () => {}),
    /3 tentatives.*dernier lot confirmé/s,
  );
});

test('client preserves API errors and rejects malformed responses or stalled cursors', async () => {
  for (const [responses, expected] of [
    [[new Response('{"error":"Accès refusé"}', { status: 403 })], /Accès refusé/],
    [[new Response('{}')], /invalide/],
    [[batch({ nextCursor: id(3) }), batch({ nextCursor: id(3) })], /ne progresse plus/],
  ]) {
    await assert.rejects(clientFixture(responses).updateOutdatedPrices('test-token', () => {}), expected);
  }
});

test('eBay forwards the same cancellation signal through OAuth, search, and 401 retry', async () => {
  const requests = [];
  let searches = 0;
  const controller = new AbortController();
  const ebay = loadTs('src/lib/ebay.ts', {}, {
    process: { env: { EBAY_CLIENT_ID: 'test', EBAY_CLIENT_SECRET: 'test' } },
    Buffer,
    fetch: async (url, options) => {
      requests.push(options);
      if (url.includes('oauth2/token')) {
        return new Response('{"access_token":"test","expires_in":3600}');
      }
      searches++;
      if (searches === 1) return new Response('Unauthorized', { status: 401 });
      controller.abort();
      throw controller.signal.reason;
    },
  });
  await assert.rejects(ebay.fetchEbayPriceSamples({ title: 'Test', signal: controller.signal }), /abort/i);
  assert.equal(requests.length, 4);
  assert.ok(requests.every(request => request.signal === controller.signal));
});
