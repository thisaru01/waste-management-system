import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaults } from './utils/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB().then(() => seedDefaults()).catch(() => {});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
