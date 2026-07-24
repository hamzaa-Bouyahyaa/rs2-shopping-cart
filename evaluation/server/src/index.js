const createApp = require('./app');
const { getDb } = require('./db/connection');
const { seed } = require('./db/seed');

const PORT = process.env.PORT || 3000;

seed(getDb());

createApp().listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
