const triagePlanner = require('../src/agent/triagePlanner');
const llmProvider = require('../src/agent/llmProvider');
const kbSearch = require('../src/agent/kbSearch');

describe('Triage Workflow', () => {
  test('should classify billing ticket correctly', async () => {
    const text = 'I need a refund for my invoice payment';
    const result = await llmProvider.classify(text);
    
    expect(result.predictedCategory).toBe('billing');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should classify tech ticket correctly', async () => {
    const text = 'The application is showing an error and crashing';
    const result = await llmProvider.classify(text);
    
    expect(result.predictedCategory).toBe('tech');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should classify shipping ticket correctly', async () => {
    const text = 'My package delivery is delayed and I need tracking info';
    const result = await llmProvider.classify(text);
    
    expect(result.predictedCategory).toBe('shipping');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('should generate draft reply with articles', async () => {
    const text = 'I need help with password reset';
    const mockArticles = [
      { _id: '1', title: 'Password Reset Guide', body: 'How to reset password...' },
      { _id: '2', title: 'Account Security', body: 'Security best practices...' }
    ];
    
    const result = await llmProvider.draft(text, mockArticles);
    
    expect(result.draftReply).toContain('Thank you for contacting support');
    expect(result.citations).toHaveLength(2);
    expect(result.citations).toContain('1');
    expect(result.citations).toContain('2');
  });

  test('should handle empty articles gracefully', async () => {
    const text = 'I have a general question';
    const result = await llmProvider.draft(text, []);
    
    expect(result.draftReply).toContain('Thank you for contacting support');
    expect(result.citations).toHaveLength(0);
  });
});