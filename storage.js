const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = './data.json';
let data = {
  users: {},
  sessions: {},
  messages: {},
  groups: {},
  channels: {}
};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
    console.log('✅ Data loaded');
  } catch(e) { console.error('Load error', e); }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('💾 Saved');
}

// API
app.get('/api/:collection', (req, res) => {
  const coll = req.params.collection;
  if (data[coll]) res.json(data[coll]);
  else res.status(404).json({ error: 'Collection not found' });
});

app.put('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const item = req.body;
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  data[collection][id] = item;
  save();
  res.json({ success: true });
});

app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  delete data[collection][id];
  save();
  res.json({ success: true });
});

// Специально для сообщений (массив)
app.put('/api/messages/:convId', (req, res) => {
  const convId = req.params.convId;
  data.messages[convId] = req.body;
  save();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Storage running on port ${PORT}`));
