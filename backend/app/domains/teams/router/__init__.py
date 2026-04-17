from fastapi import APIRouter

from app.domains.teams.router.team_router import router as team_router

router = APIRouter()
router.include_router(team_router)

__all__ = ["router"]
