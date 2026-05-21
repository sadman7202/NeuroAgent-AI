const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Fetches demo patient data from the backend.
 * Backend endpoint: GET /demo-patient
 */
export const getDemoPatient = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/demo-patient`);

    if (!response.ok) {
      throw new Error(`Failed to fetch demo patient: ${response.statusText}`);
    }

    return await response.json();
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

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error (analyzePatient):", error);
    throw error;
  }
};