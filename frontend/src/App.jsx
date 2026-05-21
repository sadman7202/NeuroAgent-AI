import React, { useState } from "react";
import "./App.css";
import { getDemoPatient, analyzePatient } from "./services/api";

const toPercent = (value) => {
  if (typeof value !== "number") return 0;
  return Math.round(value * 100);
};

const formatLabel = (value) => {
  if (!value) return "N/A";

  return String(value)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const safeValue = (value) => {
  if (value === undefined || value === null || value === "") return "N/A";
  return value;
};

const getPriorityClass = (priority) => {
  const value = String(priority || "").toLowerCase();

  if (value === "high") return "status-red";
  if (value === "medium") return "status-amber";
  if (value === "low") return "status-green";

  return "status-neutral";
};

const getRiskClass = (score) => {
  if (typeof score !== "number") return "risk-low";

  if (score >= 0.7) return "risk-high";
  if (score >= 0.4) return "risk-med";

  return "risk-low";
};

const getFeatureUnit = (key) => {
  const units = {
    walking_speed: " m/s",
    hnr: " dB",
  };

  return units[key] || "";
};

const AgentCard = ({ title, agentData, features, featureData }) => {
  if (!agentData) return null;

  return (
    <div className="card agent-card">
      <div className="agent-card-header">
        <div>
          <h3>{title}</h3>
          <p className="agent-subtitle">{formatLabel(agentData.prediction)}</p>
        </div>

        <span className={`badge ${getRiskClass(agentData.risk_score)}`}>
          {toPercent(agentData.risk_score)}% Risk
        </span>
      </div>

      <div className="agent-stats">
        <div className="stat-item">
          <label>Confidence</label>
          <span>{toPercent(agentData.confidence)}%</span>
        </div>

        <div className="stat-item">
          <label>Severity</label>
          <span>{formatLabel(agentData.severity)}</span>
        </div>
      </div>

      <p className="agent-explanation">
        {safeValue(agentData.explanation)}
      </p>

      <div className="feature-badges">
        {agentData.top_features?.map((feature) => (
          <span key={feature} className="feature-badge">
            {formatLabel(feature)}
          </span>
        ))}
      </div>

      <div className="feature-details">
        {features.map((feature) => (
          <div key={feature.key} className="feature-row">
            <span className="feature-label">{feature.label}</span>
            <span className="feature-value">
              {safeValue(featureData?.[feature.key])}
              {featureData?.[feature.key] !== undefined ? getFeatureUnit(feature.key) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [patient, setPatient] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const handleLoadDemo = async () => {
    setLoadingPatient(true);
    setError("");
    setStatusMsg("");

    try {
      const data = await getDemoPatient();

      // Supports both backend response styles:
      // 1. direct patient object
      // 2. { patient: {...} }
      const loadedPatient = data.patient ?? data;

      setPatient(loadedPatient);
      setAnalysis(null);
    } catch (err) {
      console.error(err);
      setError("Could not load demo patient. Check if the backend is running.");
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!patient) return;

    setLoadingAnalysis(true);
    setError("");
    setStatusMsg("");

    try {
      const result = await analyzePatient(patient);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Check backend connection and request format.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleAction = (action) => {
    setStatusMsg(`Action recorded: ${action}`);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const coordinator = analysis?.agent_results?.coordinator;
  const triage = analysis?.agent_results?.triage;
  const critic = analysis?.agent_results?.critic;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <h1>NeuroAgent-PD</h1>
          <span>Clinical AI v0.1</span>
        </div>

        <nav>
          <ul>
            <li className="active">Patient Case</li>
            <li>Agent Analysis</li>
            <li>Reports</li>
            <li>Settings</li>
          </ul>
        </nav>

        <button className="logout-btn" type="button">
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2>Diagnostic Dashboard</h2>

          <div className="top-bar-right">
            <span className="icon-btn">?</span>
            <span className="icon-btn">🔔</span>

            <div className="doctor-profile">
              <strong>Dr. Neurologist</strong>
              <span>Senior Clinician</span>
            </div>
          </div>
        </header>

        <section className="content-body">
          <div className="breadcrumb">Patients &gt; Analysis Report</div>

          <div className="page-header">
            <div>
              <h1>Neurological Assessment</h1>
              <p className="page-subtitle">
                Multi-agent clinical decision-support view for Parkinson’s risk analysis.
              </p>
            </div>

            <div className="header-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleLoadDemo}
                disabled={loadingPatient || loadingAnalysis}
              >
                {loadingPatient ? "Loading..." : "Load Demo Patient"}
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={handleRunAnalysis}
                disabled={loadingAnalysis || !patient}
              >
                {loadingAnalysis ? "Analyzing..." : "Run Agent Analysis"}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {statusMsg && <div className="status-toast">{statusMsg}</div>}

          {!patient && (
            <div className="empty-state">
              <h2>No patient loaded</h2>
              <p>Load a demo patient case to begin AI-assisted assessment.</p>
            </div>
          )}

          {patient && (
            <div className="dashboard-grid">
              <div className="grid-main">
                <div className="card patient-profile">
                  <div className="card-title-row">
                    <h3>Patient Profile</h3>
                    <span className="patient-id-badge">
                      {safeValue(patient.patient_id)}
                    </span>
                  </div>

                  <div className="patient-data">
                    <div className="data-box">
                      <label>Age</label>
                      <span>{safeValue(patient.age)} Years</span>
                    </div>

                    <div className="data-box">
                      <label>Gender</label>
                      <span>{formatLabel(patient.gender)}</span>
                    </div>

                    <div className="data-box">
                      <label>Disease Duration</label>
                      <span>
                        {safeValue(patient.clinical?.disease_duration_years)} Years
                      </span>
                    </div>

                    <div className="data-box">
                      <label>Medication Response</label>
                      <span>
                        {formatLabel(patient.clinical?.medication_response)}
                      </span>
                    </div>

                    <div className="data-box">
                      <label>UPDRS Score</label>
                      <span>{safeValue(patient.clinical?.updrs_score)}</span>
                    </div>

                    <div className="data-box">
                      <label>Tremor Score</label>
                      <span>{safeValue(patient.clinical?.tremor_score)}</span>
                    </div>
                  </div>

                  <div className="clinical-notes">
                    <label>Clinical Notes</label>
                    <p>{safeValue(patient.notes)}</p>
                  </div>
                </div>

                {analysis && (
                  <>
                    <div className="agent-cards-container">
                      <AgentCard
                        title="Clinical Agent"
                        agentData={analysis.agent_results.clinical}
                        featureData={patient.clinical}
                        features={[
                          { label: "UPDRS Score", key: "updrs_score" },
                          { label: "Tremor Score", key: "tremor_score" },
                          { label: "Rigidity Score", key: "rigidity_score" },
                          { label: "Bradykinesia Score", key: "bradykinesia_score" },
                        ]}
                      />

                      <AgentCard
                        title="Speech Agent"
                        agentData={analysis.agent_results.speech}
                        featureData={patient.speech}
                        features={[
                          { label: "Jitter", key: "jitter" },
                          { label: "Shimmer", key: "shimmer" },
                          { label: "HNR", key: "hnr" },
                          { label: "Pitch Variation", key: "pitch_variation" },
                        ]}
                      />

                      <AgentCard
                        title="Gait Agent"
                        agentData={analysis.agent_results.gait}
                        featureData={patient.gait}
                        features={[
                          { label: "Walking Speed", key: "walking_speed" },
                          { label: "Stride Variability", key: "stride_variability" },
                          { label: "Freezing Index", key: "freezing_index" },
                          { label: "Balance Score", key: "balance_score" },
                        ]}
                      />
                    </div>

                    <div className="card report-section">
                      <h3>Doctor’s Clinical Summary</h3>

                      <div className="summary-box">
                        <label>Automated Synthesis</label>
                        <p>{safeValue(analysis.report?.summary)}</p>
                      </div>

                      <div className="explanation-box">
                        <label>Clinical Interpretation</label>
                        <p>{safeValue(analysis.report?.doctor_facing_explanation)}</p>
                      </div>

                      <div className="report-footer-actions">
                        <button
                          className="btn btn-outline-danger"
                          type="button"
                          onClick={() => handleAction("Rejected output")}
                        >
                          Reject Output
                        </button>

                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => handleAction("Requested more data")}
                        >
                          Request More Data
                        </button>

                        <button
                          className="btn btn-success"
                          type="button"
                          onClick={() => handleAction("Approved report")}
                        >
                          Approve Report
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="grid-side">
                {!analysis && (
                  <div className="card waiting-card">
                    <h3>Analysis Pending</h3>
                    <p>
                      Run the agent analysis to generate unified risk, triage,
                      safety warnings, and a doctor-facing report.
                    </p>
                  </div>
                )}

                {analysis && coordinator && (
                  <div className={`card risk-card ${getRiskClass(coordinator.final_risk_score)}`}>
                    <div className="risk-header">
                      <div className="risk-value">
                        <span>{toPercent(coordinator.final_risk_score)}</span>/100
                      </div>
                      <h3>Unified Risk Analysis</h3>
                    </div>

                    <div className="prediction-label">
                      {formatLabel(coordinator.final_prediction)}
                    </div>

                    <p className="agreement-text">
                      {safeValue(coordinator.agent_agreement)}
                    </p>

                    <p className="risk-explanation">
                      {safeValue(coordinator.explanation)}
                    </p>

                    <div className="supporting-agents">
                      {coordinator.supporting_agents?.length > 0 ? (
                        coordinator.supporting_agents.map((agent) => (
                          <span key={agent} className="support-badge">
                            {formatLabel(agent)}
                          </span>
                        ))
                      ) : (
                        <span className="support-badge">No elevated-risk agent</span>
                      )}
                    </div>
                  </div>
                )}

                {analysis && triage && (
                  <div className={`card triage-panel ${getPriorityClass(triage.priority)}`}>
                    <div className="triage-header">
                      <span className="priority-badge">
                        Priority {formatLabel(triage.priority)}
                      </span>
                      <h3>Triage Level</h3>
                    </div>

                    <div className="triage-type">
                      {formatLabel(triage.triage_level)}
                    </div>

                    <div className="recommendation-box">
                      <label>Recommendation</label>
                      <p>{safeValue(triage.recommendation)}</p>
                    </div>

                    <button
                      className="btn btn-accent full-width"
                      type="button"
                      onClick={() => handleAction("Escalated to neurologist")}
                    >
                      Escalate to Neurologist
                    </button>
                  </div>
                )}

                {analysis && critic && (
                  <div className="card safety-monitor">
                    <div className="safety-header">
                      <span className="safety-icon">🛡️</span>
                      <h3>Safety Monitor</h3>
                    </div>

                    <div className="review-status">
                      Status:{" "}
                      <strong>
                        {critic.requires_human_review
                          ? "Requires Human Review"
                          : "No Critical Warning"}
                      </strong>
                    </div>

                    <ul className="warnings-list">
                      {critic.warnings?.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>

                    <footer className="safety-disclaimer">
                      This is clinical decision support only. Not a final medical diagnosis.
                    </footer>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;