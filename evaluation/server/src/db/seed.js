const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./connection');

// Product names are letters only (no spaces or digits) on purpose: the brief
// restricts the search field to [A-Za-z], so any name outside that character
// set could never be found through the UI.
const PRODUCTS = [
  { name: 'Hamlet', type: 'Books', description: 'Tragedy by William Shakespeare' },
  { name: 'Dune', type: 'Books', description: 'Science fiction novel by Frank Herbert' },
  { name: 'Ulysses', type: 'Books', description: 'Modernist novel by James Joyce' },
  { name: 'Thriller', type: 'Music', description: 'Studio album by Michael Jackson' },
  { name: 'Revolver', type: 'Music', description: 'Studio album by The Beatles' },
  { name: 'Discovery', type: 'Music', description: 'Studio album by Daft Punk' },
  { name: 'Chess', type: 'Games', description: 'Classic two player strategy board game' },
  { name: 'Monopoly', type: 'Games', description: 'Property trading board game' },
  { name: 'Catan', type: 'Games', description: 'Resource trading and building board game' },
];

const USERS = [
  { loginName: 'rs2user', password: 'Password' },
  { loginName: 'isaac', password: 'Password' },
  { loginName: 'neil', password: 'Password' },
];

// only seeds empty tables, safe to run repeatedly
function seed(db = getDb()) {
  const productCount = db.prepare('SELECT COUNT(*) AS n FROM Product').get().n;
  if (productCount === 0) {
    const insert = db.prepare(
      'INSERT INTO Product (Name, Type, Description) VALUES (?, ?, ?)'
    );
    const insertAll = db.transaction((products) => {
      for (const p of products) insert.run(p.name, p.type, p.description);
    });
    insertAll(PRODUCTS);
  }

  // Insert-if-missing (keyed on the unique LoginName) so new users are added
  // to an already-seeded database, not just an empty one.
  const insert = db.prepare(
    'INSERT OR IGNORE INTO User (LoginName, Password) VALUES (?, ?)'
  );
  for (const u of USERS) {
    insert.run(u.loginName, bcrypt.hashSync(u.password, 10));
  }
}

module.exports = { seed, PRODUCTS, USERS };

// Allow running directly: `npm run seed`
if (require.main === module) {
  seed();
  closeDb();
  console.log('Database seeded.');
}
