# Genesis: AI-Powered Startup Blueprint Studio

Genesis is a local full-stack app for turning a startup idea into a structured business blueprint. The backend is a FastAPI service that runs the multi-agent simulation and stores sessions in SQLite. The frontend is a React + Vite app that provides the chat workspace, live debate feed, saved sessions, and blueprint viewer.

This README is focused on running the project locally from a fresh clone.

## What It Does

Genesis takes one business idea and routes it through specialist AI agents such as product, research, technical, finance, marketing, legal, and risk reviewers. The app streams the debate into the frontend and saves generated blueprint sections so the session can be resumed later.

The main local flow is:

1. Start the FastAPI backend on `http://127.0.0.1:8000`.
2. Start the Vite frontend on `http://localhost:3000`.
3. Open the frontend and submit a startup idea.
4. The frontend calls backend routes under `/api/*`.

## Project Structure

```text
.
|-- backend/
|   |-- main.py                  # FastAPI app entry point
|   |-- run_server.py            # Local backend runner
|   |-- requirements.txt         # Python dependencies
|   |-- api/                     # Chat, health, and session routes
|   |-- services/                # Application services
|   |-- persistence/             # SQLite persistence layer
|   |-- dynamic_engine/          # Multi-agent orchestration engine
|   `-- config/                  # Model and agent configuration
|-- frontend/
|   |-- App.jsx                  # Frontend route dispatcher
|   |-- vite.config.js           # Vite dev server config
|   |-- package.json             # Frontend scripts and dependencies
|   `-- src/
|       |-- pages/               # Landing, dashboard, blueprint pages
|       |-- components/          # UI components
|       |-- services/api.js      # Frontend API client
|       `-- utils/               # Blueprint helpers
|-- tests/                       # Backend-focused test suite
`-- README.md
```

## Prerequisites

- Python 3.12
- Node.js 18 or newer
- npm
- Git
- An OpenRouter API key for real simulations

On Windows, make sure `python --version` works from a new terminal after installing Python. If PowerShell blocks npm scripts, use `cmd /c npm ...` as shown below.

## Local Setup

Clone the repository and enter the project root:

```powershell
git clone https://github.com/ETHAN071104/Global_AI_Hackathon_Series_with_Qwen_Cloud.git
cd Global_AI_Hackathon_Series_with_Qwen_Cloud
```

You need two terminals:

- Terminal 1: backend
- Terminal 2: frontend

## Backend Setup

From the project root:

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create `backend\.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
FRONTEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DYNAMIC_ENGINE_DEBUG_RESEARCH=0
```

Start the backend:

```powershell
python run_server.py
```

Expected server address:

```text
http://127.0.0.1:8000
```

The local API routes should be available under `/api`, for example:

```text
http://127.0.0.1:8000/api/health
```

## Frontend Setup

Open a second terminal from the project root:

```powershell
cd frontend
cmd /c npm install
cmd /c npm run dev
```

The checked-in local frontend port is:

```text
http://localhost:3000
```

Open `http://localhost:3000` in your browser.

Note: older Vite examples often use port `5173`, but this project is configured to run the Vite dev server on port `3000`.

## Verify Frontend and Backend Connection

With the backend running, verify the health endpoint:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health -UseBasicParsing
```

Expected response body:

```json
{"status":"ok"}
```

For local development, the frontend should call relative `/api/*` URLs and Vite should proxy those requests to `http://127.0.0.1:8000`.

The expected Vite proxy shape is:

```js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  },
}
```

If you do not want to use the Vite proxy, set a direct API base URL for the frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Then restart the frontend dev server.

## Environment Variables

Backend variables are read from `backend\.env`.

| Variable | Required | Purpose | Local example |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | API key used by the LLM provider | `sk-or-...` |
| `FRONTEND_CORS_ORIGINS` | No | Allowed frontend origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `DYNAMIC_ENGINE_DEBUG_RESEARCH` | No | Enables extra research logging | `0` |
| `GENESIS_BACKEND_HOST` | No | Backend bind host | `127.0.0.1` |
| `GENESIS_BACKEND_PORT` | No | Backend bind port | `8000` |
| `BROWSER_SESSION_COOKIE_SAMESITE` | No | Cookie SameSite override | `lax` |
| `BROWSER_SESSION_COOKIE_SECURE` | No | Cookie Secure override | `false` |
| `BROWSER_SESSION_COOKIE_DOMAIN` | No | Optional shared cookie domain | `.example.com` |

Frontend variables are read from `frontend\.env` if you create one.

| Variable | Required | Purpose | Local example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | Direct backend API base URL when not using Vite proxy | `http://127.0.0.1:8000/api` |

## Common Troubleshooting

### `python` is not recognized

Install Python 3.12 and enable "Add python.exe to PATH" during installation. Open a new terminal and verify:

```powershell
python --version
```

### `npm` fails in PowerShell

If you see an execution policy error for `npm.ps1`, run npm through `cmd`:

```powershell
cmd /c npm install
cmd /c npm run dev
cmd /c npm run build
```

### `/api/health` returns 404

Confirm the backend is registering routers with the `/api` prefix in `backend/main.py`:

```python
app.include_router(chat_router, prefix="/api")
app.include_router(session_router, prefix="/api")
```

Also confirm the frontend proxy uses `/api`, not a stale alternate path such as `/backend`.

### Frontend cannot reach backend

Check the backend health endpoint directly:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health -UseBasicParsing
```

If it works directly but not from the browser, confirm `frontend/vite.config.js` proxies `/api` to `http://127.0.0.1:8000`, then restart the frontend dev server.

### Port `8000` is already in use

Stop the other process or run the backend on another port:

```powershell
$env:GENESIS_BACKEND_PORT="8001"
python run_server.py
```

If you change the backend port, also update the Vite proxy target or set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```

### Port `3000` is already in use

Stop the other frontend process or change the Vite dev server port in `frontend/vite.config.js`.

### Simulation starts but fails later

Confirm `OPENROUTER_API_KEY` is present in `backend\.env`, then restart the backend. A missing or invalid key can allow the app shell to load while the actual LLM simulation fails.

### Saved sessions look stale or disappear

Sessions are stored in SQLite and scoped to a browser identity cookie. If you delete local SQLite files, old browser cookies can point at missing sessions. The backend should recover by issuing a fresh browser identity, but you can also clear site data for `localhost:3000` during local debugging.

## Useful Commands

Run backend tests from the project root:

```powershell
python -m pytest tests
```

Build the frontend:

```powershell
cd frontend
cmd /c npm run build
```

Preview the production frontend build:

```powershell
cd frontend
cmd /c npm run preview
```

Run the CLI from the backend directory:

```powershell
cd backend
venv\Scripts\activate
python cli.py new "AI scheduling assistant for healthcare clinics"
python cli.py refine --chat-id=<chat-id> "Add HIPAA compliance risks"
python cli.py show --chat-id=<chat-id>
```

## Deployment Notes

For production, deploy the backend and frontend separately:

- Backend: FastAPI app from `backend/main.py`, usually behind an HTTPS domain.
- Frontend: built Vite output from `frontend/dist`.

Set the frontend deployment variable to the production API route prefix:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

Set backend CORS to the exact frontend origin:

```env
FRONTEND_CORS_ORIGINS=https://your-frontend-domain.com
```

For split-domain HTTPS deployments, cookie settings may need production-safe values such as `BROWSER_SESSION_COOKIE_SAMESITE=none` and `BROWSER_SESSION_COOKIE_SECURE=true`.
