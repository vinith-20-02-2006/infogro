const API_URL = "http://127.0.0.1:8000";

const CertificateService = {
  /**
   * Fetch list of all certificates
   */
  async listCertificates() {
    const res = await fetch(`${API_URL}/certificate/list_certificates`);
    if (!res.ok) {
      throw new Error(`Failed to fetch certificates: ${res.statusText}`);
    }
    return await res.json();
  },

  /**
   * Search for eligible students for certificate generation
   * @param {string} query Search term (student name or register ID)
   */
  async searchEligibleStudents(query = "") {
    const url = query && query.trim().length > 0
      ? `${API_URL}/certificate/search_eligible_students?q=${encodeURIComponent(query)}`
      : `${API_URL}/certificate/search_eligible_students`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Search error: ${res.statusText}`);
    }
    return await res.json();
  },

  /**
   * Generate a new certificate
   * @param {Object} formData Certificate payload
   */
  async generateCertificate(formData) {
    const res = await fetch(`${API_URL}/certificate/generate_certificate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to generate certificate.");
      error.responseData = data;
      throw error;
    }
    return data;
  },

  getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    try {
      const tokensStr = localStorage.getItem("authTokens");
      if (tokensStr) {
        const tokens = JSON.parse(tokensStr);
        if (tokens && tokens.access) {
          headers["Authorization"] = `Bearer ${tokens.access}`;
        }
      }
    } catch (e) {
      console.error("Error reading auth token:", e);
    }
    return headers;
  },

  /**
   * Update an existing certificate and trigger image re-generation
   * @param {Object} editData Certificate update payload
   */
  async updateCertificate(editData) {
    const res = await fetch(`${API_URL}/certificate/update_certificate`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(editData),
    });

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || "Failed to update certificate.");
      error.responseData = data;
      throw error;
    }
    return data;
  },

  /**
   * Get direct download URL for a certificate JPG
   * @param {string} registerId Student Register ID
   */
  getDownloadUrl(registerId) {
    return `${API_URL}/certificate/download_certificate_jpg?register_id=${registerId}`;
  },

  /**
   * Helper to get full API media URL
   */
  getApiUrl() {
    return API_URL;
  }
};

export default CertificateService;
