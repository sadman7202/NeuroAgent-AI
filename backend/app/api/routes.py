from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.data.demo_patients import DEMO_PATIENTS
from app.schemas.patient_schema import PatientCase
from app.services.analysis_service import analyze_patient_case


router = APIRouter()


def get_patient_summary(patient: dict) -> dict:
    return {
        "patient_id": patient["patient_id"],
        "patient_name": patient["patient_name"],
        "age": patient["age"],
        "gender": patient["gender"],
        "disease_duration_years": patient["clinical"]["disease_duration_years"],
        "medication_response": patient["clinical"]["medication_response"],
        "notes": patient.get("notes", ""),
    }


@router.get("/patients")
def list_patients(search: Optional[str] = Query(default=None)):
    patients = DEMO_PATIENTS

    if search:
        query = search.strip().lower()
        patients = [
            patient
            for patient in DEMO_PATIENTS
            if query in patient["patient_id"].lower()
            or query in patient["patient_name"].lower()
        ]

    return [get_patient_summary(patient) for patient in patients]


@router.get("/patients/{patient_id}")
def get_patient_by_id(patient_id: str):
    for patient in DEMO_PATIENTS:
        if patient["patient_id"].lower() == patient_id.lower():
            return patient

    raise HTTPException(
        status_code=404,
        detail=f"Patient with ID {patient_id} was not found.",
    )


@router.get("/demo-patient")
def get_demo_patient():
    return DEMO_PATIENTS[0]


@router.post("/analyze")
def analyze_patient(patient_case: PatientCase):
    return analyze_patient_case(patient_case)