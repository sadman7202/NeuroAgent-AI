from fastapi import APIRouter

from app.schemas.patient_schema import PatientCase
from app.services.analysis_service import analyze_patient_case


router = APIRouter()


@router.post("/analyze")
def analyze_patient(patient_case: PatientCase):
    return analyze_patient_case(patient_case)


@router.get("/demo-patient")
def get_demo_patient():
    return {
        "patient_id": "PD-001",
        "age": 64,
        "gender": "male",
        "clinical": {
            "updrs_score": 38,
            "tremor_score": 3,
            "rigidity_score": 2,
            "bradykinesia_score": 3,
            "disease_duration_years": 4,
            "medication_response": "moderate",
        },
        "speech": {
            "jitter": 0.021,
            "shimmer": 0.034,
            "hnr": 17.4,
            "pitch_variation": 0.28,
        },
        "gait": {
            "walking_speed": 0.82,
            "stride_variability": 0.31,
            "freezing_index": 0.42,
            "balance_score": 0.58,
        },
        "notes": "Patient reports increasing hand tremor and walking instability.",
    }