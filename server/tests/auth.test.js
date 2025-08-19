const { test, expect } = require('@playwright/test');

test.describe('Authentication API', () => {
  test('POST /api/auth/signup should create a new user', async ({ request }) => {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Test User'
    };

    const response = await request.post('/api/auth/signup', {
      data: userData
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.message).toBe('User created successfully');
    expect(body.user.email).toBe(userData.email);
    expect(body.user.full_name).toBe(userData.fullName);
    expect(body.token).toBeDefined();
  });

  test('POST /api/auth/signup should fail with existing email', async ({ request }) => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'testpassword123',
      fullName: 'Test User'
    };

    // Create first user
    await request.post('/api/auth/signup', {
      data: userData
    });

    // Try to create duplicate
    const response = await request.post('/api/auth/signup', {
      data: userData
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('User already exists with this email');
  });

  test('POST /api/auth/signin should authenticate user', async ({ request }) => {
    const userData = {
      email: `signin${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Sign In User'
    };

    // Create user first
    await request.post('/api/auth/signup', {
      data: userData
    });

    // Sign in
    const response = await request.post('/api/auth/signin', {
      data: {
        email: userData.email,
        password: userData.password
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Login successful');
    expect(body.user.email).toBe(userData.email);
    expect(body.token).toBeDefined();
  });

  test('POST /api/auth/signin should fail with invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/signin', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Invalid email or password');
  });

  test('GET /api/auth/profile should return user profile with valid token', async ({ request }) => {
    const userData = {
      email: `profile${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Profile User'
    };

    // Create user and get token
    const signupResponse = await request.post('/api/auth/signup', {
      data: userData
    });
    const { token } = await signupResponse.json();

    // Get profile
    const response = await request.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe(userData.email);
    expect(body.user.full_name).toBe(userData.fullName);
  });

  test('GET /api/auth/profile should fail without token', async ({ request }) => {
    const response = await request.get('/api/auth/profile');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Access token required');
  });
});
