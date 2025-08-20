const request = require('supertest');
const app = require('../src/index');
const Article = require('../src/models/Article');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

describe('KB API', () => {
  let adminToken, userToken;
  let adminUser, normalUser;

  beforeEach(async () => {
    await Article.deleteMany({});
    await User.deleteMany({});

    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    normalUser = await User.create({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    });

    adminToken = jwt.sign({ userId: adminUser._id, role: 'admin' }, process.env.JWT_SECRET);
    userToken = jwt.sign({ userId: normalUser._id, role: 'user' }, process.env.JWT_SECRET);
  });

  test('should create article as admin', async () => {
    const articleData = {
      title: 'Test Article',
      body: 'This is a test article body with enough content',
      tags: ['test', 'article'],
      status: 'published'
    };

    const response = await request(app)
      .post('/api/kb')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(articleData)
      .expect(201);

    expect(response.body.title).toBe(articleData.title);
    expect(response.body.author).toBe(adminUser._id.toString());
  });

  test('should not allow user to create article', async () => {
    const articleData = {
      title: 'Test Article',
      body: 'This is a test article body',
      tags: ['test'],
      status: 'published'
    };

    await request(app)
      .post('/api/kb')
      .set('Authorization', `Bearer ${userToken}`)
      .send(articleData)
      .expect(403);
  });

  test('should search articles by query', async () => {
    await Article.create({
      title: 'Password Reset Guide',
      body: 'How to reset your password',
      tags: ['password', 'auth'],
      status: 'published',
      author: adminUser._id
    });

    const response = await request(app)
      .get('/api/kb?query=password')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toContain('Password');
  });
});