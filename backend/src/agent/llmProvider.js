const { OPENAI_API_KEY } = require('../config/env');

class LLMProvider {
  constructor() {
    this.stubMode = process.env.STUB_MODE === 'true' || !OPENAI_API_KEY;
  }

  async classify(text, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (this.stubMode) {
          return this._stubClassify(text);
        }
        
        // Real LLM implementation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        try {
          // Real LLM call would go here with controller.signal
          clearTimeout(timeoutId);
          return this._stubClassify(text);
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } catch (error) {
        console.error(`Classification attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          console.log('All classification attempts failed, using stub fallback');
          return this._stubClassify(text);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async draft(text, articles) {
    if (this.stubMode) {
      return this._stubDraft(text, articles);
    }
    // Real LLM implementation would go here
    return this._stubDraft(text, articles);
  }

  _stubClassify(text) {
    const lowerText = text.toLowerCase();
    
    // Billing keywords
    const billingKeywords = ['refund', 'invoice', 'payment', 'billing', 'charge', 'subscription', 'price'];
    const billingMatches = billingKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Tech keywords
    const techKeywords = ['error', 'bug', 'crash', 'broken', 'not working', 'stack', 'code', 'api'];
    const techMatches = techKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Shipping keywords
    const shippingKeywords = ['delivery', 'shipment', 'shipping', 'package', 'tracking', 'order'];
    const shippingMatches = shippingKeywords.filter(keyword => lowerText.includes(keyword)).length;

    const maxMatches = Math.max(billingMatches, techMatches, shippingMatches);
    let predictedCategory = 'other';
    let confidence = 0.3; // Base confidence

    if (maxMatches > 0) {
      if (billingMatches === maxMatches) predictedCategory = 'billing';
      else if (techMatches === maxMatches) predictedCategory = 'tech';
      else if (shippingMatches === maxMatches) predictedCategory = 'shipping';
      
      confidence = Math.min(0.9, 0.5 + (maxMatches * 0.15));
    }

    return { predictedCategory, confidence };
  }

  _stubDraft(text, articles) {
    const citations = articles.slice(0, 3).map(article => article._id.toString());
    
    let draftReply = "Thank you for contacting support. ";
    
    if (articles.length > 0) {
      draftReply += "Based on our knowledge base, here are some resources that might help:\n\n";
      
      articles.slice(0, 3).forEach((article, index) => {
        draftReply += `${index + 1}. ${article.title}\n`;
      });
      
      draftReply += "\nIf these resources don't resolve your issue, please let us know and we'll have a human agent assist you further.";
    } else {
      draftReply += "We've received your request and will have someone look into this shortly.";
    }

    return { draftReply, citations };
  }
}

module.exports = new LLMProvider();