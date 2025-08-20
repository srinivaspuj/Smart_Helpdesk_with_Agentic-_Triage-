const mongoose = require('mongoose');
require('../src/config/env');
require('../src/db/mongoose');

const User = require('../src/models/User');
const Article = require('../src/models/Article');
const Ticket = require('../src/models/Ticket');
const Config = require('../src/models/Config');
const AuditLog = require('../src/models/AuditLog');
const AgentSuggestion = require('../src/models/AgentSuggestion');

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Article.deleteMany({});
    await Ticket.deleteMany({});
    await Config.deleteMany({});
    await AuditLog.deleteMany({});
    await AgentSuggestion.deleteMany({});

    // Create users
    const admin = await User.create({
      email: 'admin@helpdesk.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });

    const agent = await User.create({
      email: 'agent@helpdesk.com',
      password: 'agent123',
      name: 'Support Agent',
      role: 'agent'
    });

    const user = await User.create({
      email: 'user@helpdesk.com',
      password: 'user123',
      name: 'Test User',
      role: 'user'
    });

    // Create KB articles
    await Article.create({
      title: 'Password Reset Guide',
      body: 'To reset your password: 1. Go to login page 2. Click "Forgot Password" 3. Enter your email 4. Check your email for reset link 5. Follow the instructions in the email',
      tags: ['password', 'authentication', 'login'],
      status: 'published',
      author: admin._id
    });

    await Article.create({
      title: 'Billing and Payment Issues',
      body: 'For billing questions: 1. Check your account balance 2. Verify payment method 3. Review recent transactions 4. Contact billing support if needed',
      tags: ['billing', 'payment', 'invoice'],
      status: 'published',
      author: admin._id
    });

    await Article.create({
      title: 'Technical Support Guidelines',
      body: 'When experiencing technical issues: 1. Clear browser cache 2. Try different browser 3. Check internet connection 4. Restart the application 5. Contact technical support',
      tags: ['technical', 'troubleshooting', 'support'],
      status: 'published',
      author: admin._id
    });

    await Article.create({
      title: 'Shipping and Delivery Information',
      body: 'Shipping information: 1. Standard delivery takes 3-5 business days 2. Express delivery takes 1-2 business days 3. Track your package using the tracking number 4. Contact us if package is delayed',
      tags: ['shipping', 'delivery', 'tracking'],
      status: 'published',
      author: admin._id
    });

    // Create config
    await Config.create({
      autoCloseEnabled: true,
      confidenceThreshold: 0.7,
      slaHours: 24
    });

    // Create sample tickets
    await Ticket.create({
      title: 'Cannot reset my password',
      description: 'I forgot my password and the reset email is not arriving',
      category: 'tech',
      createdBy: user._id,
      status: 'open'
    });

    await Ticket.create({
      title: 'Billing question about invoice',
      description: 'I have a question about charges on my latest invoice',
      category: 'billing',
      createdBy: user._id,
      status: 'open'
    });

    console.log('Seed data created successfully');
    console.log('\nTest accounts:');
    console.log('Admin: admin@helpdesk.com / admin123');
    console.log('Agent: agent@helpdesk.com / agent123');
    console.log('User: user@helpdesk.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();