def analyze_speech(speech_data):
    jitter = speech_data.jitter
    shimmer = speech_data.shimmer
    hnr = speech_data.hnr
    pitch_variation = speech_data.pitch_variation

    jitter_score = min(1.0, jitter / 0.04)
    shimmer_score = min(1.0, shimmer / 0.07)
    hnr_score = max(0.0, min(1.0, (25 - hnr) / 25))
    pitch_score = min(1.0, pitch_variation / 0.5)

    risk_score = (
        jitter_score * 0.3
        + shimmer_score * 0.3
        + hnr_score * 0.2
        + pitch_score * 0.2
    )

    return {
        "agent_name": "speech_agent",
        "risk_score": round(risk_score, 2),
        "prediction": "voice_instability_detected" if risk_score >= 0.5 else "low_voice_risk",
        "severity": "speech_abnormality" if risk_score >= 0.5 else "normal_or_mild",
        "confidence": round(min(0.9, 0.5 + risk_score * 0.4), 2),
        "top_features": [
            "jitter",
            "shimmer",
            "hnr",
            "pitch_variation",
        ],
        "explanation": (
            "Speech agent analyzed jitter, shimmer, HNR, and pitch variation to estimate voice instability."
        ),
    }