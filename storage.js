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
    console.log('✅ Data loaded from file');
  } catch(e) { console.error('Load error', e); }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('💾 Data saved');
}

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API
app.get('/api/:collection', (req, res) => {
  const coll = req.params.collection;
  console.log(`GET /api/${coll}`);
  if (data[coll]) res.json(data[coll]);
  else res.status(404).json({ error: 'Collection not found' });
});

app.put('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const item = req.body;
  console.log(`PUT /api/${collection}/${id}`, item ? Object.keys(item) : null);
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  data[collection][id] = item;
  save();
  res.json({ success: true });
});

app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  console.log(`DELETE /api/${collection}/${id}`);
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  delete data[collection][id];
  save();
  res.json({ success: true });
});

app.put('/api/messages/:convId', (req, res) => {
  const convId = req.params.convId;
  const messages = req.body;
  console.log(`PUT /api/messages/${convId} - ${messages.length} messages`);
  data.messages[convId] = messages;
  save();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Storage running on port ${PORT}`));
