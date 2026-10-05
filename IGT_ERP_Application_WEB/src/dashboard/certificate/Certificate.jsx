import React, {
    useState,
    useEffect,
    useCallback,
    useContext
} from "react";

import "./Certificate.css";

import Addcertificate from "./addcertificate/Addcertificate";
import Updatecertificate from "./updatecertificate/Updatecertificate";
import Viewcertificate from "./viewcertificate/Viewcertificate";
import Deletecertificate from "./deletecertificate/Deletecertificate";

import AuthContext from "../../services/AuthContext";


function Certificate() {

    // View Modes: 'list' (table view) or 'add' (full-page Add Certificate screen)
    const [viewMode, setViewMode] = useState("list");

    const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
    const [viewPopupVisible, setViewPopupVisible] = useState(false);
    const [deletePopupVisible, setDeletePopupVisible] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [certificates, setCertificates] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoGenerating, setAutoGenerating] = useState(false);
    const [whatsappStatusMap, setWhatsappStatusMap] = useState({});

    const { getData, insert, API_URL } = useContext(AuthContext);


    const getDownloadUrl = (registerId) => {
        return `${API_URL}/adm/download_certificate_jpg?register_id=${registerId}`;
    };


    // =====================================================
    // FETCH CERTIFICATES FROM DATABASE
    // =====================================================

    const fetchCertificates = useCallback(async () => {

        setLoading(true);

        try {

            const data = await getData("list_certificates");

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

    }, [getData]);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchCertificates();

    }, [fetchCertificates, viewMode]);


    // =====================================================
    // TOGGLE POPUPS & VIEWS
    // =====================================================

    const toggleUpdatePopup = () => {

        setUpdatePopupVisible(!updatePopupVisible);

    };

    const toggleViewPopup = () => {

        setViewPopupVisible(!viewPopupVisible);

    };

    const toggleDeletePopup = () => {

        setDeletePopupVisible(!deletePopupVisible);

    };


    // =====================================================
    // HANDLERS
    // =====================================================

    const handleCertificateCreated = async () => {

        await fetchCertificates();

        setViewMode("list");

        setSelectedCert(null);

        setCurrentPage(1);

    };

    const handleCertificateUpdated = handleCertificateCreated;

    const handleOpenAdd = () => {

        setSelectedCert(null);

        setViewMode("add");

    };

    const handleAutoGenerateCertificates = async () => {
        if (autoGenerating) return;
        setAutoGenerating(true);

        try {
            const res = await insert({}, "auto_generate_certificates");
            console.log("Auto generate certificates response:", res);

            if (res && res.message) {
                alert(res.message);
            } else {
                alert("Auto certificate generation completed.");
            }

            await fetchCertificates();
            setCurrentPage(1);

        } catch (err) {
            console.error("Auto certificate generation failed:", err);
            alert("Failed to auto generate certificates. Please try again.");
        } finally {
            setAutoGenerating(false);
        }
    };


    const handleOpenEdit = (cert) => {

        setSelectedCert(cert);

        setViewMode("edit");

    };

    const handleOpenView = (cert) => {

        setSelectedCert(cert);

        toggleViewPopup();

    };

    const handleDelete = (cert) => {

        setSelectedCert(cert);

        toggleDeletePopup();

    };

    const handleWhatsAppShare = async (cert) => {
        const certKey = cert.register_id || cert.certificate_id;
        setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: "loading" }));

        let rawPhone = cert.whatsapp_number || cert.phone_number;
        if (!rawPhone || !String(rawPhone).trim()) {
            setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: "error" }));
            alert(`Student ${cert.student_name || 'Student'} does not have a registered WhatsApp number in the database.`);
            setTimeout(() => {
                setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: null }));
            }, 3000);
            return;
        }

        let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
        if (!cleanPhone) {
            setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: "error" }));
            alert("Valid registered WhatsApp number is required.");
            setTimeout(() => {
                setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: null }));
            }, 3000);
            return;
        }
        if (cleanPhone.length === 10) {
            cleanPhone = "91" + cleanPhone;
        }

        const certId = cert.register_id || cert.certificate_id;
        const recipient = cert.student_name || "Student";
        const course = cert.course_name || "Course";
        const downloadUrl = getDownloadUrl(certId);

        try {
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
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

        const message = `🎓 *CERTIFICATE OF COMPLETION (JPG FORMAT)*\n\nStudent Name: *${recipient}*\nCourse: *${course}*\nCertificate ID: *${certId}*\n\nDirect JPG Certificate Image Link:\n${downloadUrl}\n\n_(Press Ctrl+V in WhatsApp to paste the JPG image directly!)_`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");

        setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: "sent" }));
        setTimeout(() => {
            setWhatsappStatusMap((prev) => ({ ...prev, [certKey]: null }));
        }, 4000);
    };

    const handleDownloadCertificate = (cert) => {
        const certId = cert.register_id || cert.certificate_id;
        if (!certId) {
            alert("Certificate is not available for download.");
            return;
        }
        const downloadUrl = getDownloadUrl(certId);
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
            {(viewMode === "add" || viewMode === "edit") && (

                <Addcertificate
                    onBack={() => {
                        setViewMode("list");
                        setSelectedCert(null);
                    }}
                    onSuccess={handleCertificateCreated}
                    editData={viewMode === "edit" ? selectedCert : null}
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


                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className="btn btn-primary add-btn"
                                onClick={handleOpenAdd}
                            >
                                <i className="bx bx-plus me-2"></i>
                                Add Certificate
                            </button>

                            <button
                                className="btn btn-primary add-btn"
                                onClick={handleAutoGenerateCertificates}
                                disabled={autoGenerating}
                            >
                                {autoGenerating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bx bx-cog me-2"></i>
                                        Auto Certificate Generation
                                    </>
                                )}
                            </button>
                        </div>

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
                                                                className="btn btn-action btn-delete"
                                                                title="Delete Certificate"
                                                                onClick={() =>
                                                                    handleDelete(cert)
                                                                }
                                                            >
                                                                <i className="bx bx-trash me-1"></i>
                                                                Delete
                                                            </button>

                                                            {(() => {
                                                                const status = whatsappStatusMap[cert.register_id || cert.certificate_id];
                                                                if (status === "loading") {
                                                                    return (
                                                                        <button
                                                                            className="btn btn-action btn-whatsapp"
                                                                            style={{ color: "#25D366", borderColor: "#25D366" }}
                                                                            title="Sending Certificate..."
                                                                            disabled
                                                                        >
                                                                            <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                                                                        </button>
                                                                    );
                                                                }
                                                                if (status === "sent") {
                                                                    return (
                                                                        <button
                                                                            className="btn btn-action btn-success"
                                                                            style={{ backgroundColor: "#25D366", color: "#FFFFFF", borderColor: "#25D366" }}
                                                                            title="Sent!"
                                                                        >
                                                                            <i className="bx bx-check font-weight-bold"></i>
                                                                        </button>
                                                                    );
                                                                }
                                                                if (status === "error") {
                                                                    return (
                                                                        <button
                                                                            className="btn btn-action btn-danger"
                                                                            title="Missing WhatsApp Number"
                                                                            onClick={() => handleWhatsAppShare(cert)}
                                                                        >
                                                                            <i className="bx bx-error-circle"></i>
                                                                        </button>
                                                                    );
                                                                }
                                                                return (
                                                                    <button
                                                                        className="btn btn-action btn-whatsapp"
                                                                        style={{ color: "#25D366", borderColor: "#25D366" }}
                                                                        title="Share on WhatsApp"
                                                                        onClick={() => handleWhatsAppShare(cert)}
                                                                    >
                                                                        <i className="bx bxl-whatsapp"></i>
                                                                    </button>
                                                                );
                                                            })()}

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


            {/* ================================================= */}
            {/* DELETE POPUP */}
            {/* ================================================= */}

            {deletePopupVisible && (

                <Deletecertificate
                    toggle={toggleDeletePopup}
                    data={selectedCert}
                    onSuccess={handleCertificateCreated}
                />

            )}

        </div>

    );

}


export default Certificate;
