import mysql from 'mysql2/promise.js';
import config from './config.js';

const pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  database: config.mysql.database,
  password: config.mysql.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const getUser = async (id) => {
  try {
    const [rows, fields] = await pool.execute('SELECT * FROM `users` WHERE `id`=?', [id]);
    if (rows.length) {
      return {...rows[0]}
    }
  } catch (e) {
    console.log(e);
    return null;
  }

  return null;
}

const updateUser = async (id, fields) => {
  const params = [];
  const values = [];
  Object.keys(fields).forEach((key) => {
    params.push(`\`${key}\`=?`);
    values.push(fields[key]);
  })

  if (params.length) {
    values.push(id);

    try {
      await pool.execute(`UPDATE users SET ${params.join(',')} WHERE id=?`, values);
    } catch (e) {
      return null;
    }
  }

  return true;
}

const storeUser = async (user) => {
  try {
    await pool.execute('INSERT INTO `users` SET `id`=?, `created`=NOW(), `username`=?', [user.id, user.username]);
  } catch (e) {
    return null;
  }
}

const getUsersToNotify = async () => {
  try {
    const [rows, fields] = await pool.execute('SELECT * FROM `users` WHERE `notify`=?', ['on']);
    return rows.map((row) => ({ ...row }));

  } catch (e) {
    return [];
  }
}

const getUserSubscribers = async (userId) => {
  try {
    const [rows, fields] = await pool.execute('SELECT * FROM `subscribers` WHERE `user_id`=?', [userId]);
    return rows.reduce((acc, row) => ({ ...acc, [row.subscriber_id]: { ...row }}), {});

  } catch (e) {
    return [];
  }
}

const storeSubscriber = async (userId, subscriberId, username) => {
  try {
    await pool.execute('INSERT INTO `subscribers` SET `user_id`=?, `created`=NOW(), `subscriber_id`=?, `username`=?',
      [userId, subscriberId, username]);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const deleteSubscriber = async (userId, subscriberId) => {
  try {
    await pool.execute('DELETE FROM `subscribers` WHERE `user_id`=? AND `subscriber_id`=?',
      [userId, subscriberId]);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const storeNotification = async (postId, type) => {
  try {
    await pool.execute('INSERT INTO `sent_notifications` SET `id`=?, `created`=NOW(), `type`=?',
      [postId, type]);
  } catch (e) {
    console.log(e);
    return null;
  }
}

const getNotification = async (id) => {
  try {
    const [rows, fields] = await pool.execute('SELECT * FROM `sent_notifications` WHERE `id`=?', [id]);
    if (rows.length) {
      return {...rows[0]}
    }
  } catch (e) {
    return null;
  }

  return null;
}

export {
  getUser,
  storeUser,
  updateUser,
  getUsersToNotify,
  getUserSubscribers,
  storeSubscriber,
  deleteSubscriber,
  storeNotification,
  getNotification,
}