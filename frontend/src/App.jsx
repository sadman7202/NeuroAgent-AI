import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  analyzePatient,
  getDemoPatient,
  getPatientById,
  getPatients,
} from "./services/api";

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

const PatientListPanel = ({
  patients,
  filteredPatients,
  selectedPatientId,
  searchValue,
  onSearchChange,
  onSelectPatient,
  loading,
}) => {
  const trimmedSearch = searchValue.trim();
  const showNoPatients = !loading && patients.length === 0;
  const showNoMatches =
    !loading && patients.length > 0 && filteredPatients.length === 0 && trimmedSearch;

  return (
    <div className="card patient-list-panel">
      <div className="patient-list-header">
        <h3>Patient Cases</h3>
        <span className="patient-count">{filteredPatients.length}</span>
      </div>

      <input
        className="patient-search-input"
        type="text"
        placeholder="Search by patient name or ID..."
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="patient-list">
        {loading && (
          <div className="patient-list-message">Loading patients...</div>
        )}

        {showNoPatients && (
          <div className="patient-list-message">No patients available.</div>
        )}

        {showNoMatches && (
          <div className="patient-list-message">No matching patient found.</div>
        )}

        {!loading && filteredPatients.length > 0 &&
          filteredPatients.map((entry) => {
            const medicationResponse =
              entry.medication_response ?? entry.clinical?.medication_response;
            const isSelected = selectedPatientId === entry.patient_id;

            return (
              <button
                key={entry.patient_id}
                type="button"
                className={`patient-list-item${isSelected ? " selected" : ""}`}
                onClick={() => onSelectPatient(entry.patient_id)}
              >
                <div className="patient-name-block">
                  <strong>{safeValue(entry.patient_name)}</strong>
                  <span>{safeValue(entry.patient_id)}</span>
                </div>

                <div className="patient-meta">
                  <span>Age {safeValue(entry.age)}</span>
                  <span>{formatLabel(entry.gender)}</span>
                </div>

                <div className="patient-meta">
                  <span>Medication Response</span>
                  <span>{formatLabel(medicationResponse)}</span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};

function App() {
  const [patient, setPatient] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [activePage, setActivePage] = useState("patient-case");

  const loadPatientList = async () => {
    setLoadingPatients(true);
    setError("");

    try {
      const data = await getPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Could not load patients. Check if the backend is running.");
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadPatientList();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();

    if (!term) return patients;

    return patients.filter((entry) => {
      const id = String(entry.patient_id || "").toLowerCase();
      const name = String(entry.patient_name || "").toLowerCase();

      return id.includes(term) || name.includes(term);
    });
  }, [patients, patientSearch]);

  const coordinator = analysis?.agent_results?.coordinator;
  const triage = analysis?.agent_results?.triage;
  const critic = analysis?.agent_results?.critic;
  const diseaseDuration =
    patient?.clinical?.disease_duration_years ?? patient?.disease_duration_years;
  const medicationResponse =
    patient?.clinical?.medication_response ?? patient?.medication_response;

  const handleSearchChange = (value) => {
    setPatientSearch(value);
  };

  const handleSelectPatient = async (patientId) => {
    if (!patientId) return;

    setLoadingPatient(true);
    setError("");
    setStatusMsg("");
    setAnalysis(null);

    try {
      const selectedPatient = await getPatientById(patientId);
      setPatient(selectedPatient);
      setActivePage("patient-case");
      const loadedName = selectedPatient?.patient_name || patientId;
      setStatusMsg(`Loaded patient ${loadedName}`);
      setTimeout(() => setStatusMsg(""), 2500);
    } catch (err) {
      console.error(err);
      setError("Could not load patient profile. Check if the backend is running.");
    } finally {
      setLoadingPatient(false);
    }
  };

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
      const demoName = loadedPatient?.patient_name;
      setStatusMsg(demoName ? `Loaded patient ${demoName}` : "Demo patient loaded");
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
      setStatusMsg("Run agent analysis first.");
      setTimeout(() => setStatusMsg(""), 2500);
      return;
    }

    if (page === "reports" && !analysis) {
      setStatusMsg("Run agent analysis first to generate a report.");
      setTimeout(() => setStatusMsg(""), 2500);
      return;
    }

    setStatusMsg("");
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
                disabled={loadingAnalysis || loadingPatient || !patient}
              >
                {loadingAnalysis ? "Analyzing..." : "Run Agent Analysis"}
              </button>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {statusMsg && <div className="status-toast">{statusMsg}</div>}

          {activePage === "patient-case" && (
            <div className="patient-case-layout">
              <PatientListPanel
                patients={patients}
                filteredPatients={filteredPatients}
                selectedPatientId={patient?.patient_id}
                searchValue={patientSearch}
                onSearchChange={handleSearchChange}
                onSelectPatient={handleSelectPatient}
                loading={loadingPatients}
              />

              <div className="patient-case-panel">
                {loadingPatient && !patient && (
                  <div className="empty-state">
                    <h2>Loading patient profile</h2>
                    <p>Please wait while we fetch the patient details.</p>
                  </div>
                )}

                {!loadingPatient && !patient && (
                  <div className="empty-state">
                    <h2>No patient selected</h2>
                    <p>
                      Select a patient from the patient cases menu or load the demo patient.
                    </p>
                  </div>
                )}

                {patient && (
                  <div className="card patient-profile">
                    <div className="card-title-row">
                      <div>
                        <h3>Patient Profile</h3>
                        <p className="patient-profile-name">
                          {safeValue(patient.patient_name)}
                        </p>
                      </div>
                      <span className="patient-id-badge">
                        {safeValue(patient.patient_id)}
                      </span>
                    </div>

                    <div className="patient-section">
                      <h4 className="patient-section-title">Clinical Snapshot</h4>
                      <div className="patient-data">
                        <div className="data-box">
                          <label>Age</label>
                          <span>
                            {typeof patient.age === "number"
                              ? `${patient.age} Years`
                              : safeValue(patient.age)}
                          </span>
                        </div>

                        <div className="data-box">
                          <label>Gender</label>
                          <span>{formatLabel(patient.gender)}</span>
                        </div>

                        <div className="data-box">
                          <label>Disease Duration</label>
                          <span>
                            {typeof diseaseDuration === "number"
                              ? `${diseaseDuration} Years`
                              : safeValue(diseaseDuration)}
                          </span>
                        </div>

                        <div className="data-box">
                          <label>Medication Response</label>
                          <span>{formatLabel(medicationResponse)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="patient-section">
                      <h4 className="patient-section-title">Clinical Scores</h4>
                      <div className="patient-data">
                        <div className="data-box">
                          <label>UPDRS Score</label>
                          <span>{safeValue(patient.clinical?.updrs_score)}</span>
                        </div>

                        <div className="data-box">
                          <label>Tremor Score</label>
                          <span>{safeValue(patient.clinical?.tremor_score)}</span>
                        </div>

                        <div className="data-box">
                          <label>Rigidity Score</label>
                          <span>{safeValue(patient.clinical?.rigidity_score)}</span>
                        </div>

                        <div className="data-box">
                          <label>Bradykinesia Score</label>
                          <span>{safeValue(patient.clinical?.bradykinesia_score)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="patient-section">
                      <h4 className="patient-section-title">Speech Features</h4>
                      <div className="patient-data">
                        <div className="data-box">
                          <label>Jitter</label>
                          <span>{safeValue(patient.speech?.jitter)}</span>
                        </div>

                        <div className="data-box">
                          <label>Shimmer</label>
                          <span>{safeValue(patient.speech?.shimmer)}</span>
                        </div>

                        <div className="data-box">
                          <label>HNR</label>
                          <span>{safeValue(patient.speech?.hnr)}</span>
                        </div>

                        <div className="data-box">
                          <label>Pitch Variation</label>
                          <span>{safeValue(patient.speech?.pitch_variation)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="patient-section">
                      <h4 className="patient-section-title">Gait Features</h4>
                      <div className="patient-data">
                        <div className="data-box">
                          <label>Walking Speed</label>
                          <span>{safeValue(patient.gait?.walking_speed)}</span>
                        </div>

                        <div className="data-box">
                          <label>Stride Variability</label>
                          <span>{safeValue(patient.gait?.stride_variability)}</span>
                        </div>

                        <div className="data-box">
                          <label>Freezing Index</label>
                          <span>{safeValue(patient.gait?.freezing_index)}</span>
                        </div>

                        <div className="data-box">
                          <label>Balance Score</label>
                          <span>{safeValue(patient.gait?.balance_score)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="clinical-notes">
                      <label>Clinical Notes</label>
                      <p>{safeValue(patient.notes)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePage === "agent-analysis" && (
            <>
              {!analysis && (
                <div className="empty-state">
                  <h2>Analysis not generated yet</h2>
                  <p>Select a patient and run agent analysis to view results.</p>
                </div>
              )}

              {analysis && (
                <div className="dashboard-grid">
                  <div className="grid-main">
                    <div className="agent-cards-container">
                      <AgentCard
                        title="Clinical Agent"
                        agentData={analysis.agent_results.clinical}
                        featureData={patient?.clinical}
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
                        featureData={patient?.speech}
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
                        featureData={patient?.gait}
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
            <div className="card settings-placeholder">
              <h3>Settings</h3>
              <p>Settings page is not implemented yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;