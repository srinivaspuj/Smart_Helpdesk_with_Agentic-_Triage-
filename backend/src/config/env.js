require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  STUB_MODE: process.env.STUB_MODE || 'true'
};