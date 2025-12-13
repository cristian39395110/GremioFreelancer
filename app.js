// backend/app.js
const express = require('express');
const cors = require('cors');

const adminRoutes = require('./routes/admin');

const adminAuthRoutes = require('./routes/adminAuth');


const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminAuthRoutes);


// endpoint de salud
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
