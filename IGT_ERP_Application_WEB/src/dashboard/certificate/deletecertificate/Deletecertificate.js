import React, { useContext } from "react";
import AuthContext from "../../../services/AuthContext";

const Deletecertificate = (props) => {
    const { Delete } = useContext(AuthContext);

    const handleSubmit = async () => {
        try {
            if (props.data) {
                const certId = props.data.register_id || props.data.certificate_id || props.data;
                const certData = {
                    certificate_id: certId,
                    register_id: certId
                };

                await Delete(
                    certData,
                    "delete_certificate"
                );

                if (props.onSuccess) {
                    props.onSuccess();
                }
                props.toggle();
            } else {
                throw new Error("Missing or invalid data for deletion");
            }
        } catch (error) {
            console.error("Delete operation failed:", error);
        }
    };

    return (
        <div
            className="modal fade show"
            tabIndex="-1"
            role="dialog"
            style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,0.5)"
            }}
        >
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Warning Message</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={props.toggle}
                            aria-label="Close"
                        ></button>
                    </div>

                    <div className="modal-body text-center">
                        <div className="mb-3">
                            <div className="text-danger mb-3" style={{ fontSize: "40px" }}>
                                ⚠
                            </div>
                            <h5>Are you sure you want to delete this certificate?</h5>
                            <p className="text-muted mb-0">
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={props.toggle}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="btn btn-danger"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Deletecertificate;
