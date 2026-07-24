# RS2 Shopping Cart

A small shopping cart application with a login page and a product page where a user searches for a product by name and type, sets a quantity, and adds it to their basket.

## Stack


| Layer    | Technology                                                   |
| -------- | ------------------------------------------------------------ |
| Frontend | React 18 (Vite), plain JavaScript ES6+                       |
| Backend  | Node.js, Express                                             |
| Database | SQLite (better-sqlite3)                                      |
| Testing  | Jest + Supertest (server), Vitest + Testing Library (client) |


SQLite was chosen over Oracle to keep the project runnable with zero external setup; the schema and queries are standard SQL and would port to Oracle with minimal changes.

## Getting started

Requirements: Node.js 18 or later.

```bash
npm run install:all   # installs root, server and client dependencies
npm run dev           # starts the API on :3000 and the client on :5173
```

Open [http://localhost:5173](http://localhost:5173) and log in with the seeded user:


| Login name | Password   |
| ---------- | ---------- |
| `rs2user`  | `Password` |
| `isaac`    | `Password` |
| `neil`     | `Password` |

`isaac` and `neil` are seeded reviewer accounts; each user has their own basket.


The database file (`server/shopping-cart.sqlite`) is created and seeded automatically on first server start. Seeded products include `Hamlet` (Books), `Thriller` (Music) and `Chess` (Games); the full list is in `server/src/db/seed.js`.

## Project structure

```
server/
  src/
    db/           schema, connection, seed data
    validation/   input rules (product name/type/quantity, login fields)
    services/     business logic (auth, basket, product suggestions)
    controllers/  HTTP request handling
    routes/       route definitions
    middleware/   auth guard, error handler
  tests/          unit and API integration tests
client/
  src/
    pages/        LoginPage, ProductPage
    components/   LoginForm, SearchPanel, ProductGrid (+ component tests)
    services/     api.js, the only place that calls fetch
    validation/   product name rule + unit tests
    styles/       one CSS file per component, no inline styles
    test/         Vitest setup (jsdom, Testing Library)
```

JavaScript, markup and CSS are kept strictly separate: components contain no inline styles, styling lives in dedicated stylesheets, and all HTTP access goes through a single API module.

## API


| Method | Path                      | Description                                                                             |
| ------ | ------------------------- | --------------------------------------------------------------------------------------- |
| POST   | /api/auth/login           | Authenticates against the User table, starts a session; 400 malformed payload           |
| POST   | /api/auth/logout          | Ends the session                                                                        |
| GET    | /api/auth/me              | Returns the current session user, 401 otherwise                                         |
| GET    | /api/basket               | Returns the logged-in user's basket                                                     |
| POST   | /api/basket               | Adds a product; 400 invalid input, 404 unknown product, 409 already bought              |
| DELETE | /api/basket/:id           | Removes a basket row; 404 if it does not exist or belongs to another user               |
| GET    | /api/products/suggestions | Autocomplete: products whose name starts with `?name=`, optionally filtered by `?type=` |


Sessions use an in-memory store, which is appropriate for an evaluation project. A production deployment would use a persistent shared store such as Redis.

### Login security

- **Session id is regenerated on login**, so an id the client held beforehand can't be reused to hijack the authenticated session (session fixation).
- **Login is rate limited** to 5 failed attempts per IP per 15 minutes (`express-rate-limit`); successful logins don't count toward the limit. Further attempts get a `429`.
- Passwords are bcrypt hashed (see deviation 3 below).

Behind a proxy or load balancer, set `app.set('trust proxy', 1)` so the rate limiter keys on the real client IP rather than the proxy.

## Behaviour notes

- The product name field accepts letters only (`[A-Za-z]`, max 30) and shows inline visual feedback (red border and message) while typing. The ADD button stays disabled until the whole form is valid.

- While typing, the name field offers autocomplete suggestions (prefix match, case-insensitive, narrowed by the selected type if one is chosen). Suggestions can be navigated with the arrow keys and chosen with Enter or a click; choosing one also fills in the product type if none was selected. Autocomplete is a convenience layer, the form works identically if the suggestion request fails.

- The quantity field accepts digits only (pasting or typing `e`, signs or decimals is ignored), between 1 and 999.

- ADD looks the product up by name (case-insensitive) and type. An unknown product returns an inline "Product not found" message.

- Buying the same product twice triggers the alert required by the brief. The check runs client-side for instant feedback and is also enforced server-side, so the rule holds even if the client is bypassed.

- The grid is backed by the Basket table: refreshing the page reloads the basket from the database. Each row has a Remove button; removal is immediate (no confirmation) because re-adding a product is trivial.



## Design decisions and deviations from the brief

1. **Basket.Quantity column added.** The brief requires storing a quantity per basket entry, but the given Basket table has no quantity column. I added `Quantity INTEGER NOT NULL` and documented it here rather than keeping quantity only in the UI.

2. **Duplicate rule enforced in the schema** : "Same product" is interpreted as the same ProductID for the same UserID, matching the Basket table's shape. A `UNIQUE (ProductID, UserID)` constraint enforces it at the database level, so the rule survives concurrent requests; the API maps the violation to HTTP 409.

3. **Passwords are hashed** : The User table implies plaintext `Varchar2(20)` passwords. Storing plaintext credentials is not acceptable, so passwords are hashed with bcrypt. This is a deliberate deviation.

4. **Field lengths: 30 vs 32** : The search field spec limits the product name to 30 characters while the Name column is Varchar2(32). Input validation follows the field spec (30); the column can still hold 32.

5. **Literal** `[A-Za-z]` **validation** : Taken literally, product names cannot contain spaces or digits, so "Dune" is valid but "Dune Two" is not. I implemented the rule exactly as specified (and seeded products accordingly). In a real product I would raise this with the analyst before relaxing it.

6. **Length limits enforced in code** : SQLite does not enforce VARCHAR lengths, so the Varchar2 limits from the brief are enforced in the validation layer on both client and server. Login fields are likewise validated server-side against their Varchar2(20) lengths.

7. **Quantity upper bound** : The brief specifies no maximum quantity; a bound of 999 was chosen so the field cannot hold arbitrarily large numbers. It is defined in one place per side (`QUANTITY_MAX`) and easy to change.

8. **Search interpretation** : The grid/table on the product page holds the basket result set, per "the searched product together with the quantity will be added to the table present on the same page". The ADD button performs the lookup; the autocomplete on the name field covers the exploratory side of searching.



## Extensions beyond the brief

These were added deliberately after the core requirements were complete:

- **Product name autocomplete** : prefix suggestions from the Product table while typing, with full keyboard support (arrow keys, Enter, Escape) and ARIA combobox semantics. Rationale: the brief's exact-name lookup requires the user to know the full product name; autocomplete removes that friction without changing the required flow.

- **Remove from basket** : a Remove button per grid row backed by `DELETE /api/basket/:id`, scoped to the logged-in user. Rationale: a basket the user cannot edit is a dead end in any real flow.

- **Styling aligned to the RS2 brand.** : The visual system is taken from the Beyond by RS2 product site: Lexend typography, `#3241D9` as the primary colour with its `107deg` gradient on primary actions, near-black `#050505` text on an `#F8F8F8` canvas, `#E1E1E1` hairline borders and a 10px corner radius throughout. Secondary actions (Logout, Remove) are outlined rather than filled so the gradient marks only the primary action on each screen. Red sits outside the brand palette and is used solely for validation errors, which keeps the feedback the brief asks for unmissable. Lexend loads from Google Fonts and falls back to the system stack offline; all motion is disabled under `prefers-reduced-motion`.



## Testing

```bash
npm test
```

Server tests (Jest) cover the validation rules (product and login), the basket service against an in-memory database (including duplicate, not-found and removal paths), and the full API flow through Supertest (login incl. 400s, auth guard, basket 201/400/404/409, removal 204/400/404, suggestions incl. type filtering). Client tests (Vitest + Testing Library) cover the product name validation rule and the SearchPanel and ProductGrid components (disabled-until-valid ADD, inline validation feedback, digit-only quantity, autocomplete selection, row removal).