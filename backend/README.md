# Genesis Backend

Start the local API server from the backend directory:

```powershell
python run_server.py
```

The frontend development server proxies `/api` to `http://127.0.0.1:8000` by default.
Verify the backend with:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing
```

## Browser Identity Cookies

The API stores only an opaque `browser_session_id` in an HttpOnly cookie. Conversation messages, stream events, and blueprint/project state live in SQLite. If the database is recreated while a browser still has an old cookie, the next request automatically receives a replacement browser identity and stale chat URLs return `SESSION_NOT_FOUND`.

Production defaults are optimized for split frontend/backend hosting such as Vercel + Railway: `SameSite=None; Secure`. Override with `BROWSER_SESSION_COOKIE_SAMESITE`, `BROWSER_SESSION_COOKIE_SECURE`, and `BROWSER_SESSION_COOKIE_DOMAIN` when deploying behind a same-site custom domain or Alibaba Cloud ECS.
