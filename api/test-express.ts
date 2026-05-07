import express from 'express';

const app = express();

app.get('/api/test-express', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Express is running on Vercel!',
    env: process.env.NODE_ENV
  });
});

export default app;
