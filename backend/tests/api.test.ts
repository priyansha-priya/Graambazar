import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createBackendApp } from '../src/app.ts';
import { closeDatabasePool } from '../src/db/index.ts';

let server: Server;
let baseUrl = '';

before(async () => {
  const app = createBackendApp({ enableApiNotFound: true });
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await closeDatabasePool();
});

describe('GramBazaar Backend API', () => {
  it('GET /api/health returns 200 JSON with database connected', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /application\/json/);

    const body = (await res.json()) as {
      status: string;
      service: string;
      database: string;
      timestamp: string;
    };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'grambazaar-backend');
    assert.equal(body.database, 'connected');
    assert.ok(body.timestamp);
  });

  it('Unknown /api/* routes return strict JSON 404 instead of HTML', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-endpoint`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type') || '', /application\/json/);

    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, 'API endpoint not found.');
  });

  it('GET /api/catalog/masters returns all 8 catalog master collections from PostgreSQL', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/masters`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as Record<string, unknown[]>;
    const expectedKeys = [
      'verticals',
      'attributes',
      'units',
      'optionGroups',
      'brands',
      'variantMasters',
      'packagingMasters',
      'availabilityConfigs',
    ];

    for (const key of expectedKeys) {
      assert.ok(Array.isArray(body[key]), `Expected ${key} to be an array`);
      assert.ok(body[key].length > 0, `Expected ${key} to have seeded PostgreSQL rows`);
    }
  });

  it('Public catalog read routes return 200 JSON collections', async () => {
    const endpoints = [
      { path: '/api/catalog/categories', key: 'categories' },
      { path: '/api/catalog/products', key: 'products' },
      { path: '/api/catalog/admin-sellers', key: 'sellers' },
      { path: '/api/catalog/service-areas', key: 'serviceAreas' },
      { path: '/api/catalog/routes', key: 'routes' },
      { path: '/api/catalog/offers', key: 'offers', expectNonEmpty: true },
      { path: '/api/catalog/tax-slabs', key: 'taxSlabs', expectNonEmpty: true },
      { path: '/api/catalog/cancellation-rules', key: 'cancellationRules', expectNonEmpty: true },
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep.path}`);
      assert.equal(res.status, 200, `Expected 200 for ${ep.path}`);
      const body = (await res.json()) as Record<string, unknown>;
      assert.ok(Array.isArray(body[ep.key]), `Expected ${ep.key} array from ${ep.path}`);
      if (ep.expectNonEmpty) {
        assert.ok(
          (body[ep.key] as unknown[]).length > 0,
          `Expected ${ep.key} from ${ep.path} to contain seeded PostgreSQL rows`
        );
      }
    }
  });

  it('Protected admin and authenticated routes reject missing Bearer tokens with 401', async () => {
    const guardedRequests: Array<{ method: string; path: string; body?: unknown }> = [
      { method: 'GET', path: '/api/auth/me' },
      { method: 'GET', path: '/api/orders' },
      { method: 'GET', path: '/api/admin/applications' },
      { method: 'GET', path: '/api/admin/orders' },
      { method: 'GET', path: '/api/admin/audit-logs' },
      { method: 'GET', path: '/api/admin/masters/verticals' },
      { method: 'POST', path: '/api/admin/masters/brands', body: { name: 'Unauthorized Brand' } },
      { method: 'DELETE', path: '/api/admin/audit-logs' },
      { method: 'GET', path: '/api/admin/finance/summary' },
      { method: 'POST', path: '/api/admin/fee-rules', body: { name: 'Unauthorized Fee Rule' } },
      { method: 'POST', path: '/api/admin/offers', body: { code: 'HACK99', title: 'Test' } },
      { method: 'GET', path: '/api/admin/payouts' },
      {
        method: 'POST',
        path: '/api/admin/payouts/pay_2026_1101/settle',
        body: { paymentMode: 'UPI', utrNumber: 'UTR000' },
      },
      { method: 'GET', path: '/api/admin/refunds' },
      {
        method: 'POST',
        path: '/api/admin/orders/GB-TEST/cancel',
        body: { cancelledBy: 'ADMIN', reason: 'Test', refundEligible: false },
      },
      {
        method: 'POST',
        path: '/api/admin/orders/GB-TEST/return',
        body: { status: 'REQUESTED', reason: 'Test', returnedItems: [] },
      },
      {
        method: 'POST',
        path: '/api/admin/orders/GB-TEST/refund',
        body: { amountPaise: 5000, status: 'PENDING', method: 'ORIGINAL_UPI', reason: 'Test' },
      },
      { method: 'GET', path: '/api/admin/engagement/summary' },
      { method: 'GET', path: '/api/admin/support-cases' },
      {
        method: 'PATCH',
        path: '/api/admin/support-cases/case_101',
        body: { status: 'RESOLVED', resolutionNotes: 'Test' },
      },
      { method: 'GET', path: '/api/admin/customers' },
      {
        method: 'PATCH',
        path: '/api/admin/customers/cust_001/status',
        body: { block: true, reason: 'Test' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/platform-settings',
        body: { foodPrepSlaMins: 30 },
      },
      {
        method: 'POST',
        path: '/api/admin/cms/banners',
        body: { title: 'Unauthorized Banner', placement: 'HERO_CAROUSEL' },
      },
      {
        method: 'POST',
        path: '/api/admin/cms/featured-sellers/sel_1/toggle',
      },
      {
        method: 'PATCH',
        path: '/api/admin/cms/policies/pol_terms',
        body: { version: 'v2.0', summary: 'Test', content: 'Test' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/reviews/rev_01/moderate',
        body: { status: 'HIDDEN' },
      },
      {
        method: 'POST',
        path: '/api/admin/broadcasts',
        body: { title: 'Test', message: 'Test', channel: 'APP_PUSH', audience: 'ALL_CUSTOMERS' },
      },
      // Phase 5 guarded routes (Admin RBAC, Udhari Khata, Seller status)
      { method: 'GET', path: '/api/admin/rbac/summary' },
      {
        method: 'POST',
        path: '/api/admin/rbac/users',
        body: { name: 'Unauth Admin', email: 'unauth@local', phone: '9999999999', role: 'ADMIN_OPS' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/rbac/users/admin_ops_01',
        body: { status: 'SUSPENDED' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/rbac/permissions',
        body: { role: 'ADMIN_OPS', module: 'OFFERS', key: 'approve', value: true },
      },
      { method: 'GET', path: '/api/udhari/summary' },
      { method: 'PATCH', path: '/api/udhari/sellers/seller_gupta_kirana/enable' },
      {
        method: 'PUT',
        path: '/api/udhari/profiles',
        body: { sellerId: 'seller_gupta_kirana', customerId: 'user_cust_1', limitPaise: 300000 },
      },
      {
        method: 'PATCH',
        path: '/api/udhari/profiles/status',
        body: { sellerId: 'seller_gupta_kirana', customerId: 'user_cust_1', status: 'DISABLED' },
      },
      {
        method: 'POST',
        path: '/api/udhari/credit-sales',
        body: {
          sellerId: 'seller_gupta_kirana',
          customerId: 'user_cust_1',
          orderId: 'GB-TEST-01',
          amountPaise: 10000,
        },
      },
      {
        method: 'POST',
        path: '/api/udhari/repayments',
        body: {
          sellerId: 'seller_gupta_kirana',
          customerId: 'user_cust_1',
          amountPaise: 10000,
          method: 'CASH',
        },
      },
      {
        method: 'POST',
        path: '/api/udhari/disputes',
        body: {
          sellerId: 'seller_gupta_kirana',
          customerId: 'user_cust_1',
          ledgerEntryId: 'led_1',
          reasonCode: 'WRONG_AMOUNT',
          description: 'Unauthorized test dispute',
        },
      },
      {
        method: 'PATCH',
        path: '/api/udhari/disputes/disp_1/resolve',
        body: { resolutionNote: 'Unauthorized resolve' },
      },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/status',
        body: { isPaused: true },
      },
      // Safety & Quality guarded routes
      { method: 'GET', path: '/api/safety/profiles' },
      {
        method: 'PATCH',
        path: '/api/safety/sellers/seller_gupta_kirana/modules',
        body: { moduleId: 'gm_10', action: 'toggle' },
      },
      {
        method: 'POST',
        path: '/api/safety/sellers/seller_gupta_kirana/checklists',
        body: { dateKey: '2026-11-25', checkedItemIds: ['gc_1'], scorePercent: 100 },
      },
      {
        method: 'POST',
        path: '/api/safety/sellers/seller_gupta_kirana/exams',
        body: { scorePercent: 90, correctCount: 9, totalQuestions: 10, passed: true },
      },
      {
        method: 'POST',
        path: '/api/admin/safety/sellers/seller_gupta_kirana/inspections',
        body: {
          inspectorName: 'Unauth Inspector',
          scorePercent: 95,
          outcome: 'PASSED',
          remarks: 'Test',
          findings: [],
        },
      },
      {
        method: 'PATCH',
        path: '/api/admin/safety/sellers/seller_gupta_kirana/retraining',
        body: { required: true, reason: 'Test' },
      },
      {
        method: 'PATCH',
        path: '/api/admin/safety/sellers/seller_gupta_kirana/suspension',
        body: { suspended: true, reason: 'Test' },
      },
      // Seller Role Portal guarded routes
      { method: 'GET', path: '/api/seller/seller_gupta_kirana/profile' },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/profile',
        body: { deliveryRadiusKm: 8 },
      },
      { method: 'GET', path: '/api/seller/seller_gupta_kirana/runners' },
      {
        method: 'POST',
        path: '/api/seller/seller_gupta_kirana/runners',
        body: { name: 'Unauth Runner', phone: '9876500000', role: 'Shop Runner' },
      },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/runners/seller_gupta_kirana_run_1',
        body: { isAvailable: false },
      },
      {
        method: 'DELETE',
        path: '/api/seller/seller_gupta_kirana/runners/seller_gupta_kirana_run_1',
      },
      {
        method: 'POST',
        path: '/api/seller/seller_gupta_kirana/orders/GB-2026-0001/assign-runner',
        body: { runnerId: 'seller_gupta_kirana_run_1' },
      },
      { method: 'GET', path: '/api/seller/seller_gupta_kirana/orders' },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/orders/GB-2026-0001/status',
        body: { status: 'accepted' },
      },
      {
        method: 'POST',
        path: '/api/seller/seller_gupta_kirana/products',
        body: { name: 'Unauth Product', vertical: 'GROCERY', categoryId: 'cat_staples' },
      },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/products/prod_1',
        body: { pricePaise: 9900 },
      },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/products/prod_1/inventory',
        body: { stockQuantity: 10 },
      },
      {
        method: 'PATCH',
        path: '/api/seller/seller_gupta_kirana/products/prod_1/availability',
      },
      { method: 'GET', path: '/api/seller/seller_gupta_kirana/analytics?days=7' },
    ];

    for (const reqSpec of guardedRequests) {
      const res = await fetch(`${baseUrl}${reqSpec.path}`, {
        method: reqSpec.method,
        headers: reqSpec.body ? { 'Content-Type': 'application/json' } : undefined,
        body: reqSpec.body ? JSON.stringify(reqSpec.body) : undefined,
      });
      assert.equal(
        res.status,
        401,
        `Expected 401 Unauthorized for ${reqSpec.method} ${reqSpec.path}`
      );
      const payload = (await res.json()) as { error?: string };
      assert.ok(payload.error, `Expected JSON error message for ${reqSpec.method} ${reqSpec.path}`);
    }
  });

  it('GET /api/catalog/storefront-content returns seeded banners, featured sellers, policies, settings, and published reviews', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/storefront-content`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      platformSettings?: { platformName?: string };
      cmsBanners?: unknown[];
      featuredSellerIds?: string[];
      cmsPolicies?: unknown[];
      reviews?: Array<{ status?: string }>;
    };
    assert.equal(body.platformSettings?.platformName, 'GramBazaar');
    assert.ok(Array.isArray(body.cmsBanners) && body.cmsBanners.length > 0);
    assert.ok(Array.isArray(body.featuredSellerIds) && body.featuredSellerIds.length > 0);
    assert.ok(Array.isArray(body.cmsPolicies) && body.cmsPolicies.length > 0);
    assert.ok(Array.isArray(body.reviews) && body.reviews.length > 0);
    for (const rev of body.reviews) {
      assert.equal(rev.status, 'PUBLISHED');
    }
  });

  it('GET /api/catalog/seller-statuses returns live PostgreSQL open/paused states without PII', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/seller-statuses`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      statuses?: Array<{ id: string; isOpenNow: boolean; isPaused: boolean }>;
    };
    assert.ok(Array.isArray(body.statuses) && body.statuses.length > 0);
    const gupta = body.statuses.find((s) => s.id === 'seller_gupta_kirana');
    assert.ok(gupta, 'Expected seeded seller_gupta_kirana status');
    assert.equal(typeof gupta.isOpenNow, 'boolean');
    assert.equal(typeof gupta.isPaused, 'boolean');
  });

  it('GET /api/catalog/seller-profiles returns live PostgreSQL seller store operational profiles', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/seller-profiles`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      profiles?: Array<{
        id: string;
        publicName: string;
        upiId: string;
        deliveryRadiusKm: number;
        openingHours: string;
      }>;
    };
    assert.ok(Array.isArray(body.profiles) && body.profiles.length > 0);
    const gupta = body.profiles.find((s) => s.id === 'seller_gupta_kirana');
    assert.ok(gupta, 'Expected seeded seller_gupta_kirana profile');
    assert.ok(gupta.publicName.length > 0);
    assert.ok(gupta.upiId.includes('@'));
    assert.equal(typeof gupta.deliveryRadiusKm, 'number');
    assert.ok(gupta.openingHours.length > 0);
  });

  it('GET /api/catalog/safety-profiles returns seeded seller safety badges without internal inspection remarks', async () => {
    const res = await fetch(`${baseUrl}/api/catalog/safety-profiles`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      profiles?: Record<
        string,
        {
          sellerId: string;
          certificateNumber?: string;
          inspections: unknown[];
          retrainingReason?: string;
        }
      >;
    };
    assert.ok(body.profiles && Object.keys(body.profiles).length > 0);
    const gupta = body.profiles['seller_gupta_kirana'];
    assert.ok(gupta, 'Expected seeded safety profile for seller_gupta_kirana');
    assert.equal(gupta.certificateNumber, 'GB-GROC-2026-1042');
    assert.equal(gupta.inspections.length, 0, 'Public endpoint must omit internal inspection remarks');
    assert.equal(gupta.retrainingReason, undefined);
  });

  it('POST /api/offers/validate evaluates PostgreSQL coupon rules accurately', async () => {
    // 1. Valid coupon above minimum order
    const validRes = await fetch(`${baseUrl}/api/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'gram50',
        orderSubtotalPaise: 30000,
        vertical: 'GROCERY',
        villageId: 'v-rampur',
      }),
    });
    assert.equal(validRes.status, 200);
    const validBody = (await validRes.json()) as {
      valid: boolean;
      discountPaise: number;
      freeDelivery: boolean;
      offer?: { code: string };
    };
    assert.equal(validBody.valid, true);
    assert.equal(validBody.offer?.code, 'GRAM50');
    assert.equal(validBody.discountPaise, 5000);
    assert.equal(validBody.freeDelivery, false);

    // 2. Below minimum order subtotal
    const minFailRes = await fetch(`${baseUrl}/api/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'GRAM50',
        orderSubtotalPaise: 10000,
        vertical: 'GROCERY',
      }),
    });
    assert.equal(minFailRes.status, 200);
    const minFailBody = (await minFailRes.json()) as { valid: boolean; reason?: string };
    assert.equal(minFailBody.valid, false);
    assert.ok(minFailBody.reason);

    // 3. Unknown coupon code
    const unknownRes = await fetch(`${baseUrl}/api/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'INVALID99',
        orderSubtotalPaise: 50000,
      }),
    });
    assert.equal(unknownRes.status, 200);
    const unknownBody = (await unknownRes.json()) as { valid: boolean; discountPaise: number };
    assert.equal(unknownBody.valid, false);
    assert.equal(unknownBody.discountPaise, 0);

    // 4. Empty code rejected with 400
    const badRes = await fetch(`${baseUrl}/api/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '   ', orderSubtotalPaise: 20000 }),
    });
    assert.equal(badRes.status, 400);
  });
});
