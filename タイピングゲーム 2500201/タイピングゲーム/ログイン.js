// database.js
const { Client } = require('pg');

// PostgreSQL データベースへの接続設定
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'your_password', // PostgreSQL のパスワードを設定
  database: 'your_database'  // 使用するデータベース名
});

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Connection error', err.stack));

module.exports = client;
