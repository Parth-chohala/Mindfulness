// db.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Replace with your actual MongoDB URI
const dbName = 'Mindfulness'; // Replace with your database name

let db = null;

const connectToDB = async () => {
  if (db) return db;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  console.log('✅ Connected to MongoDB');

  db = client.db(dbName);
  return db;
};

module.exports = connectToDB;
