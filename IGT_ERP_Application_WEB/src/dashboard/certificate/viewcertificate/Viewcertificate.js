import React from "react";
import "./viewcertificate.css";
import CertificateService from "../../../services/CertificateService";

function Viewcertificate({ toggle, cert }) {
  if (!cert) return null;

  const API_URL = CertificateService.getApiUrl();
  const imageUrl = `${API_URL}${cert.certificate_image}${cert.certificate_image?.includes('?') ? '&' : '?'}t=${Date.now()}`;

  const handleDownload = () => {
    const downloadUrl = CertificateService.getDownloadUrl(cert.register_id || cert.certificate_id);
    window.open(downloadUrl, "_blank");
  };

  const handleWhatsApp = async () => {
    const rawPhone = cert.whatsapp_number || cert.phone_number;
    if (!rawPhone || !String(rawPhone).trim()) {
      alert("Student WhatsApp number is not available.");
      return;
    }
    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      alert("Student WhatsApp number is not available.");
      return;
    }
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const certId = cert.register_id || cert.certificate_id;
    const recipient = cert.student_name || "Student";
    const course = cert.course_name || "Course";
    const downloadUrl = CertificateService.getDownloadUrl(certId);

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const file = new File([blob], `Certificate_${certId}.jpg`, { type: "image/jpeg" });

      // 1. Native Web Share API (Mobile / supported browsers)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Certificate of Completion - ${recipient}`,
          text: `Congratulations ${recipient}! Here is your Certificate of Completion for ${course}.`,
          files: [file]
        });
        return;
      }

      // 2. Clipboard copy for desktop Ctrl+V paste
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/jpeg": blob })
          ]);
        } catch (clipErr) {
          console.log("Clipboard write image failed:", clipErr);
        }
      }
    } catch (err) {
      console.log("Fetch certificate image blob failed:", err);
    }

    // 3. Auto-download JPG file for manual attachment & open WhatsApp
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `Certificate_${certId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const message = `🎓 *CERTIFICATE OF COMPLETION (JPG)*\n\nStudent: *${recipient}*\nCourse: *${course}*\nStudent ID: *${certId}*\n\nDirect Certificate Image (JPG):\n${downloadUrl}\n\n_(The Certificate JPG file has been downloaded to your computer & copied to clipboard. Press Ctrl+V in WhatsApp to paste the image directly!)_`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content shadow-lg border-0" style={{ maxWidth: "800px" }}>
        <div className="popup-header">
          <h4>Certificate Preview - {cert.register_id || cert.certificate_id} ({cert.student_name})</h4>
          <button className="close-btn" onClick={toggle}>
            &times;
          </button>
        </div>

        <div className="popup-body text-center">
          <img src={imageUrl} alt="Certificate JPG" className="img-fluid rounded mb-3 shadow-sm border" style={{ maxHeight: "500px" }} />

          <div className="d-flex justify-content-center gap-2 mt-3">
            <button className="btn btn-success" onClick={handleDownload}>
              <i className="bx bx-download me-1"></i> Download JPG
            </button>
            <button className="btn btn-primary" style={{ background: "#25D366", border: "none" }} onClick={handleWhatsApp}>
              <i className="bx bxl-whatsapp me-1"></i> Share WhatsApp
            </button>
            <button className="btn btn-secondary" onClick={toggle}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Viewcertificate;
