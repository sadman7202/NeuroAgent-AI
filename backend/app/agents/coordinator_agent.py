def coordinate_agents(clinical_result, speech_result, gait_result):
    clinical_risk = clinical_result["risk_score"]
    speech_risk = speech_result["risk_score"]
    gait_risk = gait_result["risk_score"]

    final_risk = (
        clinical_risk * 0.4
        + speech_risk * 0.3
        + gait_risk * 0.3
    )

    if final_risk < 0.4:
        final_prediction = "low_parkinson_risk"
    elif final_risk < 0.7:
        final_prediction = "moderate_parkinson_risk"
    else:
        final_prediction = "high_parkinson_risk"

    high_risk_agents = [
        result["agent_name"]
        for result in [clinical_result, speech_result, gait_result]
        if result["risk_score"] >= 0.5
    ]

    return {
        "agent_name": "coordinator_agent",
        "final_risk_score": round(final_risk, 2),
        "final_prediction": final_prediction,
        "agent_agreement": f"{len(high_risk_agents)} out of 3 agents detected elevated risk.",
        "supporting_agents": high_risk_agents,
        "explanation": (
            "Coordinator combined clinical, speech, and gait risk scores using weighted fusion."
        ),
    }