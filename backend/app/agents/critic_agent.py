def run_critic(clinical_result, speech_result, gait_result, coordinator_result):
    warnings = []

    if clinical_result["confidence"] < 0.65:
        warnings.append("Clinical agent confidence is relatively low.")

    if speech_result["confidence"] < 0.65:
        warnings.append("Speech agent confidence is relatively low.")

    if gait_result["confidence"] < 0.65:
        warnings.append("Gait agent confidence is relatively low.")

    if len(coordinator_result["supporting_agents"]) < 2:
        warnings.append("Fewer than two agents detected elevated risk. Human review is recommended.")

    warnings.append(
        "This system is a clinical decision-support prototype and does not provide a final medical diagnosis."
    )

    return {
        "agent_name": "critic_agent",
        "requires_human_review": True,
        "warnings": warnings,
    }