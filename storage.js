const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = './data.json';

// Структура данных
let data = {
  users: {},
  sessions: {},
  messages: {},
  groups: {},
  channels: {}
};

// Загрузка при старте
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

// Логирование действий
function log(action, details) {
  console.log(`[${new Date().toISOString()}] ${action}`, details);
}

// API: получить все данные (для бэкапа)
app.get('/api/data', (req, res) => {
  res.json(data);
});

// API: получить конкретную коллекцию
app.get('/api/:collection', (req, res) => {
  const coll = req.params.collection;
  if (data[coll]) res.json(data[coll]);
  else res.status(404).json({ error: 'Collection not found' });
});

// API: обновить или создать запись в коллекции
app.put('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const item = req.body;
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  data[collection][id] = item;
  save();
  log(`PUT ${collection}/${id}`, item);
  res.json({ success: true });
});

// API: удалить запись
app.delete('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  if (!data[collection]) return res.status(400).json({ error: 'Invalid collection' });
  delete data[collection][id];
  save();
  log(`DELETE ${collection}/${id}`, {});
  res.json({ success: true });
});

// Специальный эндпоинт для сообщений (массив по convId)
app.put('/api/messages/:convId', (req, res) => {
  const convId = req.params.convId;
  const messages = req.body;
  data.messages[convId] = messages;
  save();
  log(`PUT messages/${convId}`, { count: messages.length });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Storage service running on port ${PORT}`));
