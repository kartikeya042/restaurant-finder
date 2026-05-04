const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Required environment variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEOAPIFY_API_KEY',
];

const missing = requiredVars.filter((key) => {
  if (key === 'MONGODB_URI') {
    return !process.env.MONGODB_URI && !process.env.MONGO_URI;
  }
  if (key === 'JWT_SECRET') {
    return !process.env.JWT_SECRET && !process.env.JWT_ACCESS_SECRET;
  }
  return !process.env[key];
});

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables:\n   ${missing.join('\n   ')}`);
  console.error('\n   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
};
