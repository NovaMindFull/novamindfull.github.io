// server/feedback-api.js
// Minimal feedback endpoint (Express) : stores feedback as JSONL in data/feedback.jsonl
// Usage: node server/feedback-api.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const STORAGE_DIR = path.join(__dirname, '..', 'data');
const STORAGE_PATH = path.join(STORAGE_DIR, 'feedback.jsonl');
fs.mkdirSync(STORAGE_DIR, { recursive: true });

app.post('/api/feedback', (req, res) => {
  const payload = {
    ts: new Date().toISOString(),
    page: req.body.page || null,
    ok: !!req.body.ok,
    comment: req.body.comment || '',
    context: req.body.context || null,
    prompt: req.body.prompt || null,
    response: req.body.response || null,
    anon_user: req.body.anon_user || null
  };
  const line = JSON.stringify(payload) + '\n';
  fs.appendFile(STORAGE_PATH, line, (err) => {
    if (err) {
      console.error('Failed to save feedback', err);
      return res.status(500).json({ ok: false });
    }
    res.json({ ok: true });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Feedback API listening on ${port}`));
