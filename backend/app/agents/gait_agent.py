def analyze_gait(gait_data):
    walking_speed = gait_data.walking_speed
    stride_variability = gait_data.stride_variability
    freezing_index = gait_data.freezing_index
    balance_score = gait_data.balance_score

    speed_risk = max(0.0, min(1.0, (1.4 - walking_speed) / 1.4))
    stride_risk = min(1.0, stride_variability / 0.6)
    freezing_risk = min(1.0, freezing_index / 0.8)
    balance_risk = max(0.0, min(1.0, 1 - balance_score))

    risk_score = (
        speed_risk * 0.25
        + stride_risk * 0.25
        + freezing_risk * 0.3
        + balance_risk * 0.2
    )

    return {
        "agent_name": "gait_agent",
        "risk_score": round(risk_score, 2),
        "prediction": "gait_instability_detected" if risk_score >= 0.5 else "low_gait_risk",
        "severity": "movement_abnormality" if risk_score >= 0.5 else "normal_or_mild",
        "confidence": round(min(0.9, 0.5 + risk_score * 0.4), 2),
        "top_features": [
            "walking_speed",
            "stride_variability",
            "freezing_index",
            "balance_score",
        ],
        "explanation": (
            "Gait agent analyzed walking speed, stride variability, freezing index, and balance score."
        ),
    }