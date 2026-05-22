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

const getPageTitle = (activePage) => {
  const titles = {
    "patient-case": "Patient Case",
    "agent-analysis": "Agent Analysis",
    reports: "Reports",
    settings: "Settings",
  };

  return titles[activePage] || "Patient Case";
};

const getPageSubtitle = (activePage) => {
  const subtitles = {
    "patient-case": "Load and review the current Parkinson’s patient case.",
    "agent-analysis": "Review clinical, speech, gait, triage, and safety agent outputs.",
    reports: "Review the generated doctor-facing clinical summary.",
    settings: "MVP configuration and project status.",
  };

  return subtitles[activePage] || "";
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

      <p className="agent-explanation">{safeValue(agentData.explanation)}</p>

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
              {featureData?.[feature.key] !== undefined
                ? getFeatureUnit(feature.key)
                : ""}
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
  const [activePage, setActivePage] = useState("patient-case");

  const coordinator = analysis?.agent_results?.coordinator;
  const triage = analysis?.agent_results?.triage;
  const critic = analysis?.agent_results?.critic;

  const handleLoadDemo = async () => {
    setLoadingPatient(true);
    setError("");
    setStatusMsg("");

    try {
      const data = await getDemoPatient();
      const loadedPatient = data.patient ?? data;

      setPatient(loadedPatient);
      setAnalysis(null);
      setActivePage("patient-case");
      setStatusMsg("Demo patient loaded");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err) {
      console.error(err);
      setError("Could not load demo patient. Check if the backend is running.");
    } finally {
      setLoadingPatient(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!patient) {
      setStatusMsg("Load a patient case first");
      setTimeout(() => setStatusMsg(""), 2500);
      return;
    }

    setLoadingAnalysis(true);
    setError("");
    setStatusMsg("");

    try {
      const result = await analyzePatient(patient);
      setAnalysis(result);
      setActivePage("agent-analysis");
      setStatusMsg("Agent analysis completed");
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Check backend connection and request format.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    setError("");

    if (page === "agent-analysis" && !analysis) {
      setStatusMsg("Run agent analysis first to view agent outputs");
    } else if (page === "reports" && !analysis) {
      setStatusMsg("Run agent analysis first to generate a report");
    } else if (page === "settings") {
      setStatusMsg("Viewing MVP settings");
    } else {
      setStatusMsg("");
    }

    if (page === "agent-analysis" && !analysis) {
      setTimeout(() => setStatusMsg(""), 2500);
    }

    if (page === "reports" && !analysis) {
      setTimeout(() => setStatusMsg(""), 2500);
    }

    if (page === "settings") {
      setTimeout(() => setStatusMsg(""), 2500);
    }
  };

  const handleAction = (action) => {
    setStatusMsg(`Action recorded: ${action}`);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleLogout = () => {
    setPatient(null);
    setAnalysis(null);
    setError("");
    setStatusMsg("Demo session cleared");
    setActivePage("patient-case");
    setTimeout(() => setStatusMsg(""), 2500);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand">
          <h1>NeuroAgent-PD</h1>
          <span>Clinical AI v0.1</span>
        </div>

        <nav>
          <ul>
            <li className={activePage === "patient-case" ? "active" : ""}>
              <button type="button" onClick={() => handleNavigation("patient-case")}>
                Patient Case
              </button>
            </li>

            <li className={activePage === "agent-analysis" ? "active" : ""}>
              <button type="button" onClick={() => handleNavigation("agent-analysis")}>
                Agent Analysis
              </button>
            </li>

            <li className={activePage === "reports" ? "active" : ""}>
              <button type="button" onClick={() => handleNavigation("reports")}>
                Reports
              </button>
            </li>

            <li className={activePage === "settings" ? "active" : ""}>
              <button type="button" onClick={() => handleNavigation("settings")}>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <button className="logout-btn" type="button" onClick={handleLogout}>
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
          <div className="breadcrumb">Patients &gt; {getPageTitle(activePage)}</div>

          <div className="page-header">
            <div>
              <h1>{getPageTitle(activePage)}</h1>
              <p className="page-subtitle">{getPageSubtitle(activePage)}</p>
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

          {activePage === "patient-case" && (
            <>
              {!patient && (
                <div className="empty-state">
                  <h2>No patient loaded</h2>
                  <p>Load a demo patient case to begin AI-assisted assessment.</p>
                </div>
              )}

              {patient && (
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
                      <span>{formatLabel(patient.clinical?.medication_response)}</span>
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
              )}
            </>
          )}

          {activePage === "agent-analysis" && (
            <>
              {!patient && (
                <div className="empty-state">
                  <h2>No patient case available</h2>
                  <p>Load a demo patient before running agent analysis.</p>
                </div>
              )}

              {patient && !analysis && (
                <div className="empty-state">
                  <h2>Analysis not generated yet</h2>
                  <p>Click “Run Agent Analysis” to generate clinical, speech, gait, triage, and safety outputs.</p>
                </div>
              )}

              {patient && analysis && (
                <div className="dashboard-grid">
                  <div className="grid-main">
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
                  </div>

                  <div className="grid-side">
                    {coordinator && (
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

                    {triage && (
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

                    {critic && (
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
            </>
          )}

          {activePage === "reports" && (
            <>
              {!analysis && (
                <div className="empty-state">
                  <h2>No report generated</h2>
                  <p>Load a patient and run agent analysis to generate a doctor-facing report.</p>
                </div>
              )}

              {analysis && (
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
              )}
            </>
          )}

          {activePage === "settings" && (
            <div className="settings-grid">
              <div className="card settings-card">
                <h3>Project Status</h3>
                <p><strong>Version:</strong> Clinical AI v0.1</p>
                <p><strong>Mode:</strong> Rule-based Docker MVP</p>
                <p><strong>Backend:</strong> FastAPI</p>
                <p><strong>Frontend:</strong> Vite React</p>
              </div>

              <div className="card settings-card">
                <h3>Current MVP Modules</h3>
                <ul>
                  <li>Clinical Agent</li>
                  <li>Speech Agent</li>
                  <li>Gait Agent</li>
                  <li>Coordinator Agent</li>
                  <li>Triage Agent</li>
                  <li>Critic / Safety Agent</li>
                </ul>
              </div>

              <div className="card settings-card">
                <h3>Safety Notice</h3>
                <p>
                  This system is a clinical decision-support prototype only.
                  It does not provide final diagnosis, prescription, treatment,
                  or medical decision-making.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;