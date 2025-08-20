const Article = require('../models/Article');

class KBSearch {
  async search(query, category = null, limit = 3) {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    let filter = { status: 'published' };
    if (category && category !== 'other') {
      // Add category-based filtering if needed
      filter.tags = { $in: [category] };
    }

    const articles = await Article.find(filter);
    
    // Simple keyword scoring
    const scoredArticles = articles.map(article => {
      const titleText = article.title.toLowerCase();
      const bodyText = article.body.toLowerCase();
      const tagsText = article.tags.join(' ').toLowerCase();
      const fullText = `${titleText} ${bodyText} ${tagsText}`;
      
      let score = 0;
      searchTerms.forEach(term => {
        // Title matches get higher score
        if (titleText.includes(term)) score += 3;
        // Body matches get medium score
        if (bodyText.includes(term)) score += 2;
        // Tag matches get high score
        if (tagsText.includes(term)) score += 4;
      });
      
      return { article, score };
    });

    // Sort by score and return top results
    return scoredArticles
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }
}

module.exports = new KBSearch();