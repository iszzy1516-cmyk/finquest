"""Export/Import endpoints."""

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database import get_db
from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.services.export_service import ExportService, ImportService
from app.schemas.api import ApiResponse

router = APIRouter()


class ImportJsonRequest(BaseModel):
    data: dict


@router.get("/transactions.csv")
def export_transactions_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    svc = ExportService(db)
    csv_data = svc.export_transactions_csv(current_user.id, start_date, end_date)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )


@router.get("/full.json")
def export_full_json(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = ExportService(db)
    data = svc.export_full_json(current_user.id)
    return Response(
        content=json.dumps(data, default=str, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=finquest_export.json"}
    )


@router.post("/csv", response_model=ApiResponse[dict])
def import_csv(body: dict, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = ImportService(db)
    result = svc.import_csv(current_user.id, body.get("csv", ""))
    return ApiResponse(data=result)


@router.post("/json", response_model=ApiResponse[dict])
def import_json(body: ImportJsonRequest, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = ImportService(db)
    result = svc.import_json(current_user.id, body.data)
    return ApiResponse(data=result)


import json
