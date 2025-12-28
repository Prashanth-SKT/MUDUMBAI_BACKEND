# KLMN Backend Application Guide

Simple guide to what each part of the backend repo is doing today, written in everyday language.

## 1. Repository overview
- `package.json`: Lists the project name, scripts (`npm run dev`, tests, lint) and the packages this backend uses.
- `package-lock.json`: Locks the exact versions of every dependency so every install looks the same.
- `node_modules/`: Where npm keeps the code it downloads; it is generated and not checked into Git.
- `.env`: Local environment settings (see section 2). You can edit this to point to your Firebase/GitHub keys.
- `.env.local.example`: Template showing the expected keys; copy it if you need a fresh `.env` file.
- `backend.log`, `mudumbai_logs.txt`, `logs/`: Runtime log files created while the server runs. They capture what happened for later review.
- `test-bucket.js` & `test-firebase-storage.js`: Standalone helper scripts that talk to Firebase storage; they aren’t used by the main app today.
- `nodemon.json` & `jest.config.js`: Configuration for the tools that watch your code and run tests.
- `README.md`: High-level instructions (not rewritten here to keep this simple).

## 2. Environment & configuration files
- `.env`: Holds PORT, Firebase bucket/project info, CORS origin, logging limits, etc. The app loads this to know how to run locally.
- `.env.local` (if present): Optional override for `.env` so you can have machine-specific secrets without editing the main file.
- `src/config/serviceAccountKey.json`: Firebase service account credentials needed to talk to Firestore and Storage. Treat it as a secret.
- `src/config/env.js`: Simply loads `dotenv` so `.env` values become available everywhere.
- `src/config/githubConfig.js`: Stores GitHub-related settings for deployment features.
- Any future `.env` keys (like `OPENAI_API_KEY`, `JAYRAM_PROJECT_ID`, `MUDUMBAI_PROJECT_ID`) are read in `src/server.js` and either warn or proceed.

## 3. Entry points & middleware
- `src/app.js`: Builds the Express app—turns on Helmet, CORS (allows the frontend URL), body parsers, logs, health check at `/health`, and mounts the API routers.
- `src/server.js`: Loads environment variables, checks for optional API keys (OpenAI, Firebase), and starts the HTTP server on the configured port. It also installs global error listeners.
- `src/api/index.js`: Mounts every route module under `/api/*`, so the entry point only needs to plug it into a single location.

## 4. Config helpers
- `src/config/firebaseAdmin.js`: Initializes the Firebase Admin SDK (Auth + default Firestore) and opens named databases like “jayram” and “mudumbai”. Every service that needs Firebase imports from here.
- `src/config/firebaseConfig.js`: Another Firebase setup that specifically wires the `jayram` database using the Google Cloud Firestore client. Some parts of the app import `db` from here instead of the Admin helper.

## 5. API routes (under `src/api/routes/`)
Each route file maps HTTP paths to a controller:
- `appRoutes.js`: `/api/app/*` – create/list/get/delete app records.
- `pageRoutes.js`: `/api/pages/*` – read/write/delete pages within each app prefix.
- `componentRoutes.js`: `/api/components/*` – manage reusable components for every app.
- `actionRoutes.js`: `/api/actions/*` – handle shared actions (mini-scripts/widgets).
- `openAiRoutes.js`: `/api/openai/*` – proxy calls to OpenAI for content generation.
- `authRoutes.js`: `/api/auth/*` – checks tokens and serves user profile data from the Mudumbai database.
- `collectionRoutes.js`: `/api/collection/*` – exposes endpoints to list Firestore collections.
- `logRoutes.js`: `/api/logs/*` – lets the frontend send logs so we can keep a copy server-side.
- `validationRoutes.js` & `validationTemplateRoutes.js`: `/api/validations/*` and `/api/validation-templates/*` – run or list business rules.
- `assetRoutes.js`: `/api/assets/*` – upload/list/delete files in Firebase Storage.
- `deployRoutes.js`: `/api/deploy/*` – trigger repository builds/deployments.

## 6. Controllers (`src/controllers/`)
Each controller uses a service, validates input, and returns a response:
- `appController.js`: Creates apps, lists metadata, fetches details, and deletes app collections.
- `pageController.js`: Saves, loads, lists, and removes page documents per app.
- `componentController.js`: Gives the component library CRUD operations.
- `actionController.js`: Similar for actions and their tags.
- `themeController.js`: Manages theme palettes/templates for an app.
- `collectionController.js`: Helps inspect Firestore collection names and contents.
- `deployController.js`: Talks to GitHub/build tooling to deploy apps.
- `assetController.js`: Handles uploads/downloads/deletes inside Firebase Storage.
- `authController.js`: Verifies Firebase tokens and surfaces Mudumbai user info.
- `openAiController.js`: Wraps OpenAI prompts/response formatting.
- `validationController.js` & `validationTemplateController.js`: Run business validation checks and serve template data for validators.

## 7. Services (`src/services/`)
- `appService.js`: Business logic for creating and deleting applications (collection prefixes, metadata, ownership links).
- `pageService.js` (embedded inside controller structure): Not present as separate file (logic lives inside controller + Firestore service).
- `assetService.js`: Manages Firebase Storage workflows used by the asset controller.
- `buildService.js`: Helps trigger and monitor deployments/jobs.
- `firestoreService.js`: Shared utility that talks to Firestore (get, set, query, delete) so controllers stay clean.
- `mockFirestoreService.js`: Fake Firestore implementation used only in tests.
- `githubService.js`: Handles GitHub tokens/repos for deploys.
- `loggerService.js`: Provides the Winston logger with consistent formatting and files.
- `openAiService.js`: Wraps OpenAI requests so the controller only calls one helper.
- `userService.js`: Deals with Mudumbai user lookups and profile syncing.
- `validationService.js`: Runs cross-field business rules and returns pass/fail info.

## 8. Utilities (`src/utils/`)
- `constants.js`: Keeps reusable values (names, defaults) so they don’t float around in code.
- `errorHandler.js`: Central error formatter that turns thrown errors into JSON responses.
- `logger.js`: Offers a lightweight logger alias for places that just need `console` styling.
- `responseHandler.js`: Helper functions like `ok()` / `created()` to standardize success replies.
- `schemaDefinitions.js`: Joi schemas describing expected shape of payloads.
- `validator.js`: Validates requests, rejecting if required data is missing.

## 9. Tests (`src/tests/`)
- `apiTests/pageApi.test.js`: Makes sure the page-related endpoints behave the same way expected by the frontend.
- `services/firestoreService.test.js`: Verifies the Firestore helper does its job (using the mock service).
- `mockData/samplePage.json`: Sample page documents that tests reuse.
- `setup.js`: Boots Jest with any shared configuration before every test.

## 10. Supporting & log artifacts
- `logs/`: Contains `backend.log`, `backend-errors.log`, and `frontend.log`. These rotate so crashes and warnings stay searchable.
- `src/logs/`: Might be used to store runtime files; check if anything is written here during execution.
- `test-bucket.js`, `test-firebase-storage.js`: Manual scripts you can run to poke Firebase storage; keep for experiments or delete if unused.
- `mudumbai_logs.txt`: Manual log dump for quick sharing—safe to archive elsewhere.
- `backend.log` at repo root: Snapshot of what happened when the server last ran manually.

## 11. How things connect (simple flow)
1. `.env` tells `src/server.js` what port, Firebase projects, and secret keys to use.
2. `src/server.js` starts `src/app.js`, which wires middleware and `/api` routes.
3. Each route file forwards HTTP calls to one controller.
4. Controllers validate input, call a service (Firestore, Github, OpenAI, etc.), then use `responseHandler` to reply.
5. `loggerService` keeps a uniform log trail for every folder.
6. Tests under `src/tests` simulate clients so you can confirm the API behaves before deploying.

## 12. Quick cleanup hints
- Avoid committing `node_modules/`, `logs/`, or `.env` (personal secrets).
- Keep `serviceAccountKey.json` safe; rotate it if credentials change.
- When you recreate `.env`, mirror `.env.local.example`.

Let me know if you want this converted into another format or expanded further.



