import React, {
    useState,
    useEffect,
    useCallback
} from "react";

import "./Certificate.css";

import Addcertificate from "./addcertificate/Addcertificate";
import Updatecertificate from "./updatecertificate/Updatecertificate";
import Viewcertificate from "./viewcertificate/Viewcertificate";

import CertificateService from "../../services/CertificateService";


function Certificate() {

    // View Modes: 'list' (table view) or 'add' (full-page Add Certificate screen)
    const [viewMode, setViewMode] = useState("list");

    const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
    const [viewPopupVisible, setViewPopupVisible] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [certificates, setCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [loading, setLoading] = useState(false);


    // =====================================================
    // FETCH CERTIFICATES FROM DATABASE
    // =====================================================

    const fetchCertificates = useCallback(async () => {

        setLoading(true);

        try {

            const data = await CertificateService.listCertificates();

            console.log("Certificates fetched:", data);

            if (Array.isArray(data)) {

                setCertificates(data);

            } else {

                setCertificates([]);

            }

        } catch (err) {

            console.error("Failed to fetch certificates:", err);

            setCertificates([]);

        } finally {

            setLoading(false);

        }

    }, []);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchCertificates();

    }, [fetchCertificates]);


    // =====================================================
    // TOGGLE POPUPS & VIEWS
    // =====================================================

    const toggleUpdatePopup = () => {

        setUpdatePopupVisible(!updatePopupVisible);

    };

    const toggleViewPopup = () => {

        setViewPopupVisible(!viewPopupVisible);

    };


    // =====================================================
    // HANDLERS
    // =====================================================

    const handleCertificateCreated = async () => {

        await fetchCertificates();

        setViewMode("list");

        setCurrentPage(1);

    };

    const handleCertificateUpdated = async () => {

        await fetchCertificates();

        setUpdatePopupVisible(false);

    };

    const handleOpenEdit = (cert) => {

        setSelectedCert(cert);

        toggleUpdatePopup();

    };

    const handleOpenView = (cert) => {

        setSelectedCert(cert);

        toggleViewPopup();

    };

    const handleWhatsAppShare = async (cert) => {
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

    const handleDownloadCertificate = (cert) => {
        const certId = cert.register_id || cert.certificate_id;
        if (!certId) {
            alert("Certificate is not available for download.");
            return;
        }
        const downloadUrl = CertificateService.getDownloadUrl(certId);
        if (!downloadUrl) {
            alert("Certificate is not available for download.");
            return;
        }

        const studentName = cert.student_name ? cert.student_name.replace(/\s+/g, "_") : "Student";
        const fileName = `${studentName}_Certificate.jpg`;

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };


    // =====================================================
    // PAGINATION
    // =====================================================

    const itemsPerPage = 4;

    const indexOfLastItem = currentPage * itemsPerPage;

    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentCertificates = certificates.slice(
        indexOfFirstItem,
        indexOfLastItem
    );


    const nextPage = () => {

        if (indexOfLastItem < certificates.length) {

            setCurrentPage(currentPage + 1);

        }

    };

    const prevPage = () => {

        if (currentPage > 1) {

            setCurrentPage(currentPage - 1);

        }

    };


    return (

        <div className="certificate-page container-xxl flex-grow-1 container-p-y">


            {/* ========================================================================= */}
            {/* VIEW MODE 1: FULL-PAGE ADD CERTIFICATE SCREEN                             */}
            {/* ========================================================================= */}
            {viewMode === "add" && (

                <Addcertificate
                    onBack={() => setViewMode("list")}
                    onSuccess={handleCertificateCreated}
                />

            )}


            {/* ========================================================================= */}
            {/* VIEW MODE 2: CERTIFICATE TABLE LIST PAGE (DEFAULT)                        */}
            {/* ========================================================================= */}
            {viewMode === "list" && (

                <>

                    {/* PAGE HEADER */}
                    <div className="page-header">

                        <div>

                            <h3 className="page-title">
                                Certificate Management
                            </h3>

                            <p className="page-subtitle">
                                Manage all issued student certificates
                            </p>

                        </div>


                        <button
                            className="btn btn-primary add-btn"
                            onClick={() => setViewMode("add")}
                        >

                            <i className="bx bx-plus me-2"></i>

                            Add Certificate

                        </button>

                    </div>


                    {/* CERTIFICATE TABLE CARD */}
                    <div className="card certificate-card">

                        <div className="table-responsive">

                            <table className="table modern-table">

                                <thead>

                                    <tr>

                                        <th>ID</th>

                                        <th>
                                            Student Name
                                        </th>

                                        <th>
                                            Course
                                        </th>

                                        <th>
                                            Issue Date
                                        </th>

                                        <th>
                                            Download
                                        </th>

                                        <th width="220">
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {currentCertificates.length > 0 ? (

                                        currentCertificates.map(
                                            (cert, index) => (

                                                <tr
                                                    key={
                                                        cert.certificate_id ||
                                                        cert.register_id ||
                                                        index
                                                    }
                                                >

                                                    <td>
                                                        #{cert.register_id || cert.certificate_id}
                                                    </td>


                                                    <td>

                                                        <strong>
                                                            {cert.student_name}
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        {cert.course_name}

                                                    </td>


                                                    <td>

                                                        {cert.issue_date}

                                                    </td>


                                                    <td>

                                                        <button
                                                            className="btn btn-action btn-download"
                                                            title="Download Certificate JPG"
                                                            onClick={() => handleDownloadCertificate(cert)}
                                                        >
                                                            <i className="bx bx-download"></i>
                                                        </button>

                                                    </td>


                                                    <td>

                                                        <div className="action-buttons">

                                                            <button
                                                                className="btn btn-action btn-view"
                                                                title="View Certificate"
                                                                onClick={() =>
                                                                    handleOpenView(cert)
                                                                }
                                                            >
                                                                <i className="bx bx-show me-1"></i>
                                                                View
                                                            </button>


                                                            <button
                                                                className="btn btn-action btn-edit"
                                                                title="Edit Certificate"
                                                                onClick={() =>
                                                                    handleOpenEdit(cert)
                                                                }
                                                            >
                                                                <i className="bx bx-edit-alt me-1"></i>
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="btn btn-action btn-whatsapp"
                                                                style={{ color: "#25D366", borderColor: "#25D366" }}
                                                                title="Share on WhatsApp"
                                                                onClick={() =>
                                                                    handleWhatsAppShare(cert)
                                                                }
                                                            >
                                                                <i className="bx bxl-whatsapp me-1"></i>
                                                                WhatsApp
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="6"
                                                className="text-center py-4"
                                            >

                                                {loading
                                                    ? "Loading certificates..."
                                                    : "No certificates found."}

                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>


                        {/* PAGINATION */}
                        <div className="card-footer bg-white border-0">

                            <div className="d-flex justify-content-end">

                                <button
                                    className="btn btn-light me-2"
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                >

                                    <i className="bx bx-chevron-left"></i>

                                    Previous

                                </button>


                                <button
                                    className="btn btn-primary"
                                    style={{ background: "#4F46E5", border: "none" }}
                                    onClick={nextPage}
                                    disabled={
                                        indexOfLastItem >= certificates.length
                                    }
                                >

                                    Next

                                    <i className="bx bx-chevron-right ms-1"></i>

                                </button>

                            </div>

                        </div>

                    </div>

                </>

            )}


            {/* ================================================= */}
            {/* UPDATE POPUP */}
            {/* ================================================= */}

            {updatePopupVisible && (

                <Updatecertificate
                    toggle={toggleUpdatePopup}
                    data={selectedCert}
                    onSuccess={handleCertificateUpdated}
                />

            )}


            {/* ================================================= */}
            {/* VIEW POPUP */}
            {/* ================================================= */}

            {viewPopupVisible && (

                <Viewcertificate
                    toggle={toggleViewPopup}
                    cert={selectedCert}
                />

            )}

        </div>

    );

}


export default Certificate;
