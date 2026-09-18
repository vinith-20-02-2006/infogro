import React, { useContext, useEffect, useState, useCallback } from "react";
import AuthContext from "../../services/AuthContext";
import igtLogo from "../../assets/img/igt_logo.png";
import "./Certificate.css";

const API_URL = "http://127.0.0.1:8000";

const Certificate = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentName, setStudentName] = useState(
    user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "" : ""
  );
  const [eligibility, setEligibility] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/adm/fetch_course_datail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const courseList = data.value || data || [];
        setCourses(courseList);
        if (courseList.length > 0) {
          setSelectedCourse(courseList[0].Course_id);
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }, []);

  const checkEligibility = useCallback(async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setMessage("");
    setCertificate(null);
    try {
      const userId = user?.user_id || user?.id || 1;
      const res = await fetch(`${API_URL}/adm/check_certificate_eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, course_id: parseInt(courseId) }),
      });
      const data = await res.json();
      setEligibility(data);

      const certRes = await fetch(`${API_URL}/adm/get_student_certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (certRes.ok) {
        const certs = await certRes.json();
        const match = certs.find((c) => c.Course_id === parseInt(courseId));
        if (match) {
          setCertificate(match);
          if (match.student_name) {
            setStudentName(match.student_name);
          }
        }
      }
    } catch (err) {
      console.error("Error checking eligibility:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourse) {
      checkEligibility(selectedCourse);
    }
  }, [selectedCourse, checkEligibility]);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage("");
    try {
      const userId = user?.user_id || user?.id || 1;
      const res = await fetch(`${API_URL}/adm/generate_certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          course_id: parseInt(selectedCourse),
          student_name: studentName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const certObj = data.data || data;
        setCertificate(certObj);
        setMessage("Certificate generated successfully!");
      } else {
        setMessage(data.message || "Failed to generate certificate.");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setMessage("Error generating certificate.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    const downloadUrl = `${API_URL}/adm/download_certificate_pdf?certificate_id=${certificate.certificate_id}&student_name=${encodeURIComponent(studentName || "")}`;
    window.open(downloadUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    if (!certificate) return;
    const courseName = certificate.Course_name || "Course";
    const certId = certificate.certificate_id;
    const recipientName = certificate.student_name || studentName || "Student";
    const verifyUrl = `http://localhost:3000/verify-certificate?id=${certificate.verification_token || certId}`;

    const text = `Congratulations ${recipientName}! You have successfully completed the ${courseName} course and received your official certificate.\n\nCertificate ID: ${certId}\nVerify Certificate:\n${verifyUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="certificate-container container-xxl">
      <div className="d-flex align-items-center mb-4">
        <img src={igtLogo} alt="IGT Logo" style={{ height: "60px", marginRight: "16px" }} />
        <h3 className="m-0" style={{ color: "#0F4C81", fontWeight: "bold" }}>
          Certificate Management
        </h3>
      </div>

      <div className="certificate-card">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label font-weight-bold">Select Course:</label>
            <select
              className="form-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.Course_id} value={c.Course_id}>
                  {c.Course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label font-weight-bold">Student Name on Certificate:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter Full Name (e.g. John Doe)"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4">Checking eligibility...</div>}

      {message && <div className="alert alert-info">{message}</div>}

      {eligibility && (
        <div className="certificate-card">
          <div className="certificate-header">
            <span className="certificate-title" style={{ color: "#0F4C81" }}>
              Certificate Eligibility Status
            </span>
            <span
              className={`status-badge ${
                eligibility.eligible ? "eligible" : "ineligible"
              }`}
            >
              {eligibility.eligible ? "ELIGIBLE" : "INELIGIBLE"}
            </span>
          </div>

          <div className="certificate-details-grid">
            <div className="detail-item">
              <div className="detail-label">Assignment Status</div>
              <div className="detail-value">
                {eligibility.enrollment?.assignment_status || "N/A"}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Assessment Status</div>
              <div className="detail-value">
                {eligibility.enrollment?.assessment_status || "N/A"}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Status Details</div>
              <div className="detail-value">{eligibility.reason}</div>
            </div>
          </div>

          {certificate ? (
            <div>
              <div className="alert alert-success mb-3">
                <strong>Certificate Issued:</strong> {certificate.certificate_id} | <strong>Name:</strong> {certificate.student_name || studentName} (Issued: {String(certificate.issue_date).substring(0, 10)})
              </div>

              <div className="action-buttons">
                <button className="btn btn-primary" style={{ backgroundColor: "#0F4C81", borderColor: "#0F4C81" }} onClick={handleDownload}>
                  <i className="bx bx-download me-1"></i> Download Certificate (PDF)
                </button>
                <button className="btn btn-whatsapp" onClick={handleWhatsAppShare}>
                  <i className="bx bxl-whatsapp me-1"></i> Share on WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <div>
              {eligibility.eligible ? (
                <button className="btn btn-success" style={{ backgroundColor: "#2E7D32" }} onClick={handleGenerate}>
                  <i className="bx bx-award me-1"></i> Generate Certificate
                </button>
              ) : (
                <button className="btn btn-secondary" disabled>
                  Generate Certificate (Not Qualified)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Certificate;
