# WarframeStats

Express 5 + Mongoose 8 + Pug app that records Warframe rewards (sorties, rivens, netracells, Temporal Archimedea) and shows statistics. See `README.md` for setup.

## Commands
- `npm run dev`: development server on port 3000. It needs a local MongoDB at `127.0.0.1/WarframeStatsDB` (`DOCKER=true` uses the host `net-db-warstats` instead).
- `npm test`: every Jest suite.
  - `npm run test:integration`: in-memory MongoDB (`mongodb-memory-server`), no database needed.
  - `npm run test:unit`: `tests/unit/stats.test.js` reads the **real** local database (`MONGO_URI`, read only).
- `resources/compose/`: Docker Compose setup and database backup/restore scripts (`resources/scripts/`: user admin scripts, `resources/misc/`: Postman collection and other references).

## Layout
- `app.js` registers every Mongoose model (`require('./api/models/...')`, plus `./database/dbVersionModel`) **before** the routes, then mounts the routes: JSON API routes first, then the page routes.
- The JSON API follows `api/routes/<x>Routes.js` → `api/domain/<x>Process.js` → `api/models/<x>Model.js`. A domain module gets its models with `mongoose.model(name)`, so a test or script must require the model files first.
- `web/`: the server side of the pages (page routes in `web/routes/`, display helpers in `web/format.js`). Templates stay in `views/`, browser assets in `static/`.
- `security/`: authentication (JWT, Passport, login state) and the anti-injection/XSS helpers.
- **Table pages:** `web/routes/formPagesRoutes.js` renders `views/<page>.pug` (which extends `layout_more`) with a generic form view model.
  - **Generic forms:** a definition in `web/forms/definitions/` (`fields`, `load`, `save`), registered in `web/forms/index.js`. `web/forms/formEngine.js` validates the fields on the server; `views/mixins/formModal.pug` and `static/javascripts/formModal.js` render them and submit JSON to `/forms/:formId`.
  - **"More info" modal:** a builder per kind in `web/details.js`, served by `GET /details/:kind/:id`.
- **Netracell and Temporal Archimedea runs:** a source, plus 1 to 3 `loots` `{ reward, tauforged }`; only Archon Shards can be tauforged. Their reward types and sources live in seeded collections that every save looks up.
- **Menu:** `views/layout.pug`. Each page marks its own `nav-*` link as active.

## Rules
- Indent with tabs.
- **Local requires:** a require that goes up a directory uses `#root/<path>.js` (package `imports`), never `../`. Same-folder requires stay `./x`.
- **Migrations:** a data or schema change needs a migration in `database/migrations/` (`{ version, description, up }`), appended to the list in `database/migrations/index.js`. A migration must be idempotent: MongoDB standalone has no transactions. Startup runs the migrations before serving; an empty database is never migrated.
- **Content Security Policy** (`app.js`):
  - No CDNs: every asset is served from `static/`.
  - An inline `<script>` needs `nonce=nonce`; no inline event handlers.
  - Scripts and stylesheets loaded with `integrity=` must get a new sha384 hash whenever the file changes (for example `formModal.js` and `detailsModal.js` in the table pages).
- **Writes need a JWT** (`auth.required`, from `security/jwt_auth.js`): an `Authorization: Bearer` header or the `access_token` cookie. The signing secret is random at each startup, so a restart logs everyone out.
- **No user documents for visitors:** never send a user document to visitors; pass it through `publicUser` (`security/utils/obfuscation.js`).
- **Docker:** the `Dockerfile` copies only `app.js`, `api/`, `bin/`, `database/`, `security/`, `static/`, `views/` and `web/`. A new top-level runtime folder must be added there.
- **Commit messages:** one short sentence.
- **Versioning:** before every commit, apply the `bump-version` skill (`.claude/skills/bump-version/SKILL.md`): patch or minor by itself, major only when the user asks.
