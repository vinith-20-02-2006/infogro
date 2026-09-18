import React, { useContext } from "react";
import AuthContext from "../../../services/AuthContext";

const Deletecourse = (props) => {

    const { Delete } = useContext(AuthContext);

    const handleSubmit = async () => {

        try {

            if (props.data) {

                const courseData = {
                    Course_id: props.data,
                };

                await Delete(
                    courseData,
                    "delete_course_datail",
                    "/course"
                );

                props.toggle();

            } else {

                throw new Error(
                    "Missing or invalid data for deletion"
                );

            }

        } catch (error) {

            console.error(
                "Delete operation failed:",
                error
            );

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

            <div
                className="modal-dialog modal-dialog-centered"
                role="document"
            >

                <div className="modal-content">

                    {/* =========================
                        HEADER
                    ========================== */}

                    <div className="modal-header">

                        <h5 className="modal-title">
                            Warning Message
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={props.toggle}
                            aria-label="Close"
                        ></button>

                    </div>


                    {/* =========================
                        BODY
                    ========================== */}

                    <div className="modal-body text-center">

                        <div className="mb-3">

                            <div
                                className="text-danger mb-3"
                                style={{ fontSize: "40px" }}
                            >
                                ⚠
                            </div>

                            <h5>
                                Are you sure you want to delete?
                            </h5>

                            <p className="text-muted mb-0">
                                This action cannot be undone.
                            </p>

                        </div>

                    </div>


                    {/* =========================
                        FOOTER
                    ========================== */}

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

export default Deletecourse;





