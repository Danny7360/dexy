from fastapi import FastAPI

from dexy.api.routes.health import router as health_router
from dexy.api.routes.prototype import router as prototype_router
from dexy.api.routes.wallets import router as wallets_router
from dexy.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")
app.include_router(health_router)
app.include_router(prototype_router)
app.include_router(wallets_router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "message": "Dexy API is running. Start with /v1/wallets/{wallet_address}/summary.",
    }
