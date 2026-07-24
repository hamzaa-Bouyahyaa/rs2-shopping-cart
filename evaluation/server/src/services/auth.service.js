const bcrypt = require('bcryptjs');
const { getDb } = require('../db/connection');

function authenticate(loginName, password) {
  if (typeof loginName !== 'string' || typeof password !== 'string') {
    return null;
  }

  const user = getDb()
    .prepare('SELECT UserID, LoginName, Password FROM User WHERE LoginName = ? COLLATE NOCASE')
    .get(loginName);

  if (!user || !bcrypt.compareSync(password, user.Password)) {
    return null;
  }

  return { userId: user.UserID, loginName: user.LoginName };
}

module.exports = { authenticate };
