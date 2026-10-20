from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.applications.router import router as applications_router
from app.modules.auth.router import router as auth_router
from app.modules.assistant.router import router as assistant_router
from app.modules.distribution.router import router as distribution_router
from app.modules.listings.router import router as listings_router
from app.modules.requests.router import router as requests_router
from app.modules.inbox.router import router as inbox_router
from app.modules.records.router import router as records_router
from app.modules.health.router import router as health_router
from app.modules.properties.router import router as properties_router


def create_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(
        title="Immo Bell API",
        version="0.1.0",
        docs_url="/docs" if s.env != "prod" else None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_origins,  # liste explicite, jamais "*" avec des cookies
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(listings_router)
    app.include_router(requests_router)
    app.include_router(inbox_router)
    app.include_router(records_router)
    app.include_router(properties_router)
    app.include_router(distribution_router)
    app.include_router(applications_router)
    app.include_router(assistant_router)
    return app


app = create_app()
