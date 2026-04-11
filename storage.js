const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '2gb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

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

app.get('/healthz', (req, res) => res.send('OK'));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/:collection', (req, res) => {
  const coll = req.params.collection;
  if (data[coll]) res.json(data[coll]);
  else res.status(404).json({ error: 'Collection not found' });
});

app.put('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  data[collection][id] = req.body;
  save();
  res.json({ success: true });
});

app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  delete data[collection][id];
  save();
  res.json({ success: true });
});

app.put('/api/messages/:convId', (req, res) => {
  data.messages[req.params.convId] = req.body;
  save();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Storage running on port ${PORT}`));
