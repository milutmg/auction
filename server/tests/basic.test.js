// File: tests/basic.test.js

const { test, expect } = require('@playwright/test');

// Basic API test

test('GET / should return API is running', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.message).toBe('Antique Auction API is running!');
});
