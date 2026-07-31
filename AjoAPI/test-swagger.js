import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001;

app.use(cors());

// Simple test route
app.get('/api/docs', (req, res) => {
  console.log('✅ /api/docs HIT');
  res.send('<h1>Swagger Works!</h1>');
});

app.get('/', (req, res) => {
  res.send('<h1>Home Works!</h1>');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📄 Access: http://localhost:${PORT}/api/docs\n`);
});
