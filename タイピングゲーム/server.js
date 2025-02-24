// server.js
const express = require('express');
const bcrypt = require('bcryptjs');
const client = require('./database'); // データベース接続モジュール

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ログインルート
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
      res.send('ログイン成功');
    } else {
      res.status(401).send('ログイン失敗');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('サーバーエラー');
  }
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
