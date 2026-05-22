const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const parseResponse = async (response, context) => {
  if (!response.ok) {
    let details = "";

    try {
      details = await response.text();
    } catch (error) {
      details = "";
    }

    const message = details?.trim() || response.statusText || "Request failed";
    throw new Error(`${context}: ${message}`);
  }

  return response.json();
};

/**
 * Fetches patient summaries from the backend.
 * Backend endpoint: GET /patients
 */
export const getPatients = async (search = "") => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetch(`${API_BASE_URL}/patients${query}`);

    return await parseResponse(response, "Failed to fetch patients");
  } catch (error) {
    console.error("API Error (getPatients):", error);
    throw error;
  }
};

/**
 * Fetches a full patient profile by ID.
 * Backend endpoint: GET /patients/{patient_id}
 */
export const getPatientById = async (patientId) => {
  try {
    const encodedId = encodeURIComponent(patientId);
    const response = await fetch(`${API_BASE_URL}/patients/${encodedId}`);

    return await parseResponse(response, "Failed to fetch patient profile");
  } catch (error) {
    console.error("API Error (getPatientById):", error);
    throw error;
  }
};

/**
 * Fetches demo patient data from the backend.
 * Backend endpoint: GET /demo-patient
 */
export const getDemoPatient = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/demo-patient`);

    return await parseResponse(response, "Failed to fetch demo patient");
  } catch (error) {
    console.error("API Error (getDemoPatient):", error);
    throw error;
  }
};

/**
 * Sends patient data for AI agent analysis.
 * Backend endpoint: POST /analyze
 */
export const analyzePatient = async (patient) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patient),
    });

    return await parseResponse(response, "Analysis failed");
  } catch (error) {
    console.error("API Error (analyzePatient):", error);
    throw error;
  }
};