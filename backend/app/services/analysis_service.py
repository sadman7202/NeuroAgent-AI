from app.agents.clinical_agent import analyze_clinical
from app.agents.speech_agent import analyze_speech
from app.agents.gait_agent import analyze_gait
from app.agents.coordinator_agent import coordinate_agents
from app.agents.triage_agent import assign_triage
from app.agents.critic_agent import run_critic


def analyze_patient_case(patient_case):
    clinical_result = analyze_clinical(patient_case.clinical)
    speech_result = analyze_speech(patient_case.speech)
    gait_result = analyze_gait(patient_case.gait)

    coordinator_result = coordinate_agents(
        clinical_result,
        speech_result,
        gait_result,
    )

    triage_result = assign_triage(
        coordinator_result["final_risk_score"]
    )

    critic_result = run_critic(
        clinical_result,
        speech_result,
        gait_result,
        coordinator_result,
    )
    patient_name = getattr(patient_case, "patient_name", "Unknown Patient")

    report = {
        "patient_id": patient_case.patient_id,
        "patient_name": patient_name,
        "summary": (
            f"Patient {patient_name} ({patient_case.patient_id}) was analyzed by clinical, "
            f"speech, and gait agents. The final risk level is "
            f"{coordinator_result['final_prediction']} with a risk score of "
            f"{coordinator_result['final_risk_score']}."
        ),
        "doctor_facing_explanation": (
            "The system used multimodal agent outputs to estimate Parkinson-related risk. "
            "This result should be reviewed by a qualified neurologist before any clinical decision."
        ),
    }

    return {
        "patient": patient_case.model_dump(),
        "agent_results": {
            "clinical": clinical_result,
            "speech": speech_result,
            "gait": gait_result,
            "coordinator": coordinator_result,
            "triage": triage_result,
            "critic": critic_result,
        },
        "report": report,
    }