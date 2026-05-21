def analyze_clinical(clinical_data):
    updrs = clinical_data.updrs_score
    tremor = clinical_data.tremor_score
    rigidity = clinical_data.rigidity_score
    bradykinesia = clinical_data.bradykinesia_score

    risk_score = min(
        1.0,
        (
            (updrs / 60) * 0.55
            + (tremor / 4) * 0.15
            + (rigidity / 4) * 0.15
            + (bradykinesia / 4) * 0.15
        ),
    )

    if updrs < 25:
        severity = "mild"
    elif updrs <= 45:
        severity = "moderate"
    else:
        severity = "severe"

    return {
        "agent_name": "clinical_agent",
        "risk_score": round(risk_score, 2),
        "prediction": "parkinson_pattern_detected" if risk_score >= 0.5 else "low_clinical_risk",
        "severity": severity,
        "confidence": round(min(0.95, 0.55 + risk_score * 0.4), 2),
        "top_features": [
            "updrs_score",
            "tremor_score",
            "rigidity_score",
            "bradykinesia_score",
        ],
        "explanation": (
            f"Clinical assessment suggests {severity} symptom severity based on UPDRS, tremor, rigidity, and bradykinesia scores."
        ),
    }