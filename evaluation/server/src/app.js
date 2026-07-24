const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.routes');
const basketRoutes = require('./routes/basket.routes');
const productRoutes = require('./routes/product.routes');
const errorHandler = require('./middleware/errorHandler');

/** App factory so tests can build an app against an isolated database. */
function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  // Behind a hosting provider's load balancer (Render, Fly, Heroku...) the real
  // client IP and the original protocol arrive in X-Forwarded-* headers. Trusting
  // the first hop keeps the login rate limiter keyed on the user rather than the
  // proxy, and lets express-session know the request was HTTPS.
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'rs2-evaluation-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: isProduction },
    })
  );

  // Throttle brute-force login attempts. Built here (not at module scope) so
  // each test's fresh app starts with a clean counter. Only failed logins count.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // attempts per IP per window — single knob to tune
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
  });
  app.use('/api/auth/login', loginLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/basket', basketRoutes);
  app.use('/api/products', productRoutes);

  // In development the Vite dev server serves the client and proxies /api here.
  // In a deployed build there is one origin: Express serves the compiled client
  // as well, so the session cookie stays same-site and no CORS setup is needed.
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // Client-side routing: anything that is not an API call falls back to the
    // SPA entry point so a deep link or refresh does not 404.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
