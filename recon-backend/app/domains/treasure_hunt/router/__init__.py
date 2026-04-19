from fastapi import APIRouter

from app.domains.treasure_hunt.router.treasure_hunt_router import router as treasure_hunt_router

router = APIRouter()
router.include_router(treasure_hunt_router)

__all__ = ["router"]
