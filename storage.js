const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const app = express();
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = './data.json';
let data = {
  users: [],
  sessions: [],
  messages: [],
  groups: [],
  channels: []
};

// Загрузка из файла при старте
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
  console.log('Data loaded from file');
}

// Функция сохранения в файл
function saveToFile() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Data saved to file');
}

// API: получение всех данных (для бэкапа)
app.get('/api/data', (req, res) => {
  res.json(data);
});

// API: обновление конкретной коллекции
app.post('/api/:collection', (req, res) => {
  const { collection } = req.params;
  const newData = req.body;
  if (data.hasOwnProperty(collection)) {
    data[collection] = newData;
    saveToFile(); // сразу сохраняем
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid collection' });
  }
});

// API: добавление элемента в коллекцию
app.post('/api/:collection/add', (req, res) => {
  const { collection } = req.params;
  const item = req.body;
  if (data.hasOwnProperty(collection) && Array.isArray(data[collection])) {
    data[collection].push(item);
    saveToFile();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid collection' });
  }
});

// API: удаление элемента из коллекции
app.post('/api/:collection/remove', (req, res) => {
  const { collection } = req.params;
  const { id } = req.body;
  if (data.hasOwnProperty(collection) && Array.isArray(data[collection])) {
    data[collection] = data[collection].filter(item => item.id !== id);
    saveToFile();
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid collection' });
  }
});

// API: обновление конкретного элемента
app.post('/api/:collection/update', (req, res) => {
  const { collection } = req.params;
  const { id, updates } = req.body;
  if (data.hasOwnProperty(collection) && Array.isArray(data[collection])) {
    const index = data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      data[collection][index] = { ...data[collection][index], ...updates };
      saveToFile();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } else {
    res.status(400).json({ error: 'Invalid collection' });
  }
});

// Cron job: каждые 15 минут сохраняем данные (дублируем saveToFile, но можно и в облако)
cron.schedule('*/15 * * * *', () => {
  console.log('Cron: periodic save');
  saveToFile();
  // Здесь можно отправить копию на внешнее хранилище (S3, Google Drive и т.д.)
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Storage service running on port ${PORT}`));
