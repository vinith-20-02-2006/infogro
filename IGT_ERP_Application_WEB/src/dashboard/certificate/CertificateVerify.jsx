import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import "./Certificate.css";

const API_URL = "http://127.0.0.1:8000";

const CertificateVerify = () => {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState(searchParams.get("id") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = useCallback(async (tokenToVerify) => {
    const searchId = tokenToVerify || identifier;
    if (!searchId) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/adm/verify_certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: searchId.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setResult(data);
      } else {
        setResult({ valid: false, message: data.message || "Certificate Not Found / Invalid Certificate" });
      }
    } catch (err) {
      console.error("Verification error:", err);
      setResult({ valid: false, message: "Error contacting verification server." });
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    const initialId = searchParams.get("id");
    if (initialId) {
      setIdentifier(initialId);
      handleVerify(initialId);
    }
  }, [searchParams, handleVerify]);

  const onSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="container-xxl py-5">
      <div className="verify-wrapper">
        <h3 className="text-center mb-2">Certificate Verification</h3>
        <p className="text-center text-muted mb-4">
          Enter a Certificate ID or Verification Token to verify official completion records.
        </p>

        <form onSubmit={onSubmit} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="e.g. CERT-2026-000001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Certificate"}
            </button>
          </div>
        </form>

        {searched && !loading && (
          <div>
            {result && result.valid ? (
              <div>
                <div className="verify-badge-valid">
                  <i className="bx bx-check-circle me-1"></i> Official Certificate Verified
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label">Student Name</div>
                  <div className="detail-value">{result.student_name}</div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label">Course Name</div>
                  <div className="detail-value">{result.course_name}</div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label">Certificate ID</div>
                  <div className="detail-value">{result.certificate_id}</div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label">Issue Date</div>
                  <div className="detail-value">{String(result.issue_date).substring(0, 10)}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Certificate Status</div>
                  <div className="detail-value text-success font-weight-bold">{result.status}</div>
                </div>
              </div>
            ) : (
              <div className="verify-badge-invalid">
                <i className="bx bx-x-circle me-1"></i> {result?.message || "Certificate Not Found / Invalid Certificate"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateVerify;
