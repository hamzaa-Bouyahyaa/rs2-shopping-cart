-- Schema based on the tables given in the evaluation brief.
-- Deviations (documented in the README):
--   * Basket.Quantity was added: the brief requires storing a quantity per
--     basket line but the given Basket table has no such column.
--   * User.Password stores a bcrypt hash, never plaintext.
--   * SQLite does not enforce VARCHAR lengths; the Varchar2 limits from the
--     brief are enforced in the application validation layer instead.

CREATE TABLE IF NOT EXISTS Product (
  ID          INTEGER PRIMARY KEY AUTOINCREMENT,
  Name        TEXT NOT NULL,             -- Varchar2(32) in the brief
  Type        TEXT NOT NULL,             -- Varchar2(8) in the brief
  Description TEXT                       -- Varchar2(100) in the brief
);

CREATE TABLE IF NOT EXISTS User (
  UserID    INTEGER PRIMARY KEY AUTOINCREMENT,
  LoginName TEXT NOT NULL UNIQUE,        -- Varchar2(20) in the brief
  Password  TEXT NOT NULL                -- bcrypt hash
);

CREATE TABLE IF NOT EXISTS Basket (
  ID        INTEGER PRIMARY KEY AUTOINCREMENT,
  ProductID INTEGER NOT NULL REFERENCES Product (ID),
  UserID    INTEGER NOT NULL REFERENCES User (UserID),
  Quantity  INTEGER NOT NULL,
  UNIQUE (ProductID, UserID)             -- a user cannot buy the same product twice
);
