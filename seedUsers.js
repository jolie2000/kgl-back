const mongoose = require('mongoose');
const axios = require('axios');

mongoose.connect('mongodb://127.0.0.1:27017/kgl_db').then(async () => {
  try {
    await mongoose.connection.collection('users').dropIndex('email_1');
    console.log('Dropped unique email index');
  } catch(e) {
    console.log('Index did not exist or other error', e.message);
  }
  
  try {
    const users = mongoose.connection.collection('users');
    await users.deleteMany({}); // clear existing
    console.log('Cleared users');
  } catch(e) {
    console.log('Error clearing', e.message);
  }

  try {
    await axios.post('http://localhost:5000/api/auth/register', {name: 'Admin Manager', role: 'Manager', branch: 'All', password: 'password123'});
    await axios.post('http://localhost:5000/api/auth/register', {name: 'Agent Sarah', role: 'SalesAgent', branch: 'Maganjo', password: 'password123'});
    await axios.post('http://localhost:5000/api/auth/register', {name: 'Mr. Orban', role: 'Director', branch: 'All', password: 'password123'});
    console.log('Users seeded successfully');
  } catch (err) {
    console.error('Error seeding users', err.message);
  }
  
  process.exit(0);
})
