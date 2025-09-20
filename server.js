import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.send('Codex 环境 OK ✅ — coex-voltrally');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
