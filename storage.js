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
    console.log('Data loaded');
  } catch(e) { console.error('Load error', e); }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Data saved');
}

app.get('/healthz', (req, res) => res.send('OK'));

app.get('/api/:collection', (req, res) => {
  const coll = req.params.collection;
  if (data[coll]) res.json(data[coll]);
  else res.status(404).json({ error: 'Not found' });
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
