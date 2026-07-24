const authService = require('../services/auth.service');
const { validateLogin } = require('../validation/auth.validation');

function login(req, res, next) {
  const { loginName, password } = req.body || {};

  const validationError = validateLogin({ loginName, password });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const user = authService.authenticate(loginName, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid login name or password.' });
  }

  // New session id on login so a pre-login id can't be reused (session fixation).
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.user = user;
    res.json({ user });
  });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
}

function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  res.json({ user: req.session.user });
}

module.exports = { login, logout, me };
