import os
import uuid

from fastapi import Request, Response

from persistence import repository as chat_repository


SESSION_COOKIE_NAME = "browser_session_id"
LEGACY_SESSION_COOKIE_NAME = "session_id"
SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180


def resolve_browser_session_id(request: Request) -> tuple[str, bool]:
    for cookie_name in (SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME):
        parsed = _parse_browser_session_id(request.cookies.get(cookie_name))
        if parsed is None:
            continue
        if chat_repository.touch_browser_session(parsed) is not None:
            return parsed, False
        if chat_repository.browser_session_has_references(parsed):
            chat_repository.create_browser_session(parsed)
            return parsed, False

    browser_session_id = str(uuid.uuid4())
    chat_repository.create_browser_session(browser_session_id)
    return browser_session_id, True


def _parse_browser_session_id(raw: str | None) -> str | None:
    raw = (raw or "").strip()
    try:
        return str(uuid.UUID(raw))
    except (TypeError, ValueError):
        return None


def set_browser_session_cookie(response: Response, browser_session_id: str) -> None:
    secure = _cookie_secure()
    same_site = _cookie_same_site()
    domain = os.getenv("BROWSER_SESSION_COOKIE_DOMAIN") or os.getenv("COOKIE_DOMAIN") or None
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=browser_session_id,
        max_age=SESSION_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=secure,
        samesite=same_site,
        path="/",
        domain=domain,
    )
    if LEGACY_SESSION_COOKIE_NAME != SESSION_COOKIE_NAME:
        response.delete_cookie(
            key=LEGACY_SESSION_COOKIE_NAME,
            path="/",
            domain=domain,
            secure=secure,
            samesite=same_site,
        )


def _cookie_same_site() -> str:
    configured = os.getenv("BROWSER_SESSION_COOKIE_SAMESITE") or os.getenv("COOKIE_SAMESITE")
    if configured:
        value = configured.strip().lower()
        if value in {"lax", "strict", "none"}:
            return value
    return "none" if _is_production_environment() else "lax"


def _cookie_secure() -> bool:
    configured = os.getenv("BROWSER_SESSION_COOKIE_SECURE") or os.getenv("COOKIE_SECURE")
    if configured is not None:
        return configured.strip().lower() in {"1", "true", "yes", "on"}
    return _is_production_environment()


def _is_production_environment() -> bool:
    environment = (
        os.getenv("GENESIS_ENV")
        or os.getenv("ENVIRONMENT")
        or os.getenv("ENV")
        or ""
    ).lower()
    if environment in {"production", "prod"}:
        return True
    return any(
        os.getenv(name)
        for name in (
            "RAILWAY_ENVIRONMENT",
            "RAILWAY_SERVICE_ID",
            "VERCEL",
            "RENDER",
            "FLY_APP_NAME",
        )
    )
