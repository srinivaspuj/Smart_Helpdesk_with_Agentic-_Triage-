const request = require('supertest');
const app = require('../src/index');
const Ticket = require('../src/models/Ticket');
const User = require('../src/models/User');
const AgentSuggestion = require('../src/models/AgentSuggestion');
const jwt = require('jsonwebtoken');

describe('Tickets API', () => {
  let userToken, agentToken;
  let normalUser, agentUser;

  beforeEach(async () => {
    await Ticket.deleteMany({});
    await User.deleteMany({});
    await AgentSuggestion.deleteMany({});

    normalUser = await User.create({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    });

    agentUser = await User.create({
      name: 'Agent',
      email: 'agent@test.com',
      password: 'password123',
      role: 'agent'
    });

    userToken = jwt.sign({ userId: normalUser._id, role: 'user' }, process.env.JWT_SECRET);
    agentToken = jwt.sign({ userId: agentUser._id, role: 'agent' }, process.env.JWT_SECRET);
  });

  test('should create ticket as user', async () => {
    const ticketData = {
      title: 'Test ticket for billing issue',
      description: 'I need a refund for my invoice payment',
      category: 'billing'
    };

    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send(ticketData)
      .expect(201);

    expect(response.body.title).toBe(ticketData.title);
    expect(response.body.createdBy).toBe(normalUser._id.toString());
  });

  test('should not allow agent to create ticket', async () => {
    const ticketData = {
      title: 'Test ticket',
      description: 'Test description',
      category: 'tech'
    };

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${agentToken}`)
      .send(ticketData)
      .expect(403);
  });

  test('should get ticket details', async () => {
    const ticket = await Ticket.create({
      title: 'Test Ticket',
      description: 'Test description',
      category: 'tech',
      createdBy: normalUser._id,
      status: 'open'
    });

    const response = await request(app)
      .get(`/api/tickets/${ticket._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.title).toBe(ticket.title);
  });

  test('should add reply to ticket', async () => {
    const ticket = await Ticket.create({
      title: 'Test Ticket',
      description: 'Test description',
      category: 'tech',
      createdBy: normalUser._id,
      status: 'waiting_human'
    });

    const replyData = {
      content: 'This is a test reply from agent',
      isAgent: true,
      status: 'resolved'
    };

    const response = await request(app)
      .post(`/api/tickets/${ticket._id}/reply`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send(replyData)
      .expect(200);

    expect(response.body.replies).toHaveLength(1);
    expect(response.body.replies[0].content).toBe(replyData.content);
    expect(response.body.status).toBe('resolved');
  });
});