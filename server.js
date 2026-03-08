const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: 'karibu-grocerie.netlify.app' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kgl_db';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB (KGL Database)'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to Karibu Groceries LTD API');
});

// Implementation Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/procurement', require('./routes/procurementRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/credit-sales', require('./routes/creditSalesRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
