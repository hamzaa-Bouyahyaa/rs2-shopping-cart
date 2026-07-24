const { getDb } = require('../db/connection');

const SUGGESTION_LIMIT = 8;

// Autocomplete for the search field.
function suggestProducts({ name, type }) {
  const db = getDb();

  // No LIKE escaping needed here. The prefix is already validated as
  // [A-Za-z] only, so it can't contain wildcards.
  if (type) {
    return db
      .prepare(
        `SELECT Name AS name, Type AS type
           FROM Product
          WHERE Name LIKE ? COLLATE NOCASE AND Type = ?
          ORDER BY Name
          LIMIT ${SUGGESTION_LIMIT}`
      )
      .all(`${name}%`, type);
  }

  return db
    .prepare(
      `SELECT Name AS name, Type AS type
         FROM Product
        WHERE Name LIKE ? COLLATE NOCASE
        ORDER BY Name
        LIMIT ${SUGGESTION_LIMIT}`
    )
    .all(`${name}%`);
}

module.exports = { suggestProducts, SUGGESTION_LIMIT };
