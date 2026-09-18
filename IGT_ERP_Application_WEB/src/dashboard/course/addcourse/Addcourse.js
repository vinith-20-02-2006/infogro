import React, { useContext, useState } from "react";
import AuthContext from "../../../services/AuthContext";
// import "./addcourse.css";

const Addcourse = (props) => {

    const { insert } = useContext(AuthContext);

    const [validated, setValidated] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();

        const form = e.currentTarget;

        setError("");
        setSuccess("");


        // =========================
        // FORM VALIDATION
        // =========================

        if (!form.checkValidity()) {

            e.stopPropagation();

            setValidated(true);

            return;
        }


        // =========================
        // GET FORM DATA
        // =========================

        const courseName =
            form.Course_name.value.trim();

        const courseFees =
            form.Course_Fees.value;

        const courseStatus =
            form.Course_Status.value;


        // =========================
        // COURSE NAME VALIDATION
        // =========================

        if (courseName.length < 2) {

            setError(
                "Course name must contain at least 2 characters."
            );

            setValidated(true);

            return;
        }


        // =========================
        // COURSE DATA
        // =========================

        const courseData = {

            Course_name: courseName,

            Course_Fees: Number(courseFees),

            Course_Status: courseStatus,

        };


        console.log(
            "Sending Course:",
            courseData
        );


        try {

            setLoading(true);


            // =========================
            // INSERT
            // =========================

            const response = await insert(
                courseData,
                "course_create"
            );


            console.log(
                "Course created:",
                response
            );


            // =========================
            // SUCCESS
            // =========================

            setSuccess(
    "Course created successfully!"
);


// Clear form
form.reset();

setValidated(false);


// Refresh parent course list
if (props.onSuccess) {

    await props.onSuccess();

}


        } catch (error) {

            console.error(
                "Course creation error:",
                error
            );


            // =========================
            // DJANGO ERROR
            // =========================

            const responseData =
                error.responseData;


            console.log(
                "Django Error:",
                responseData
            );


            // Course name duplicate
            if (
                responseData &&
                responseData.Course_name
            ) {

                const message =
                    Array.isArray(
                        responseData.Course_name
                    )
                        ? responseData.Course_name[0]
                        : responseData.Course_name;


                setError(message);

            }

            // Detail error
            else if (
                responseData &&
                responseData.detail
            ) {

                setError(
                    responseData.detail
                );

            }

            // Other server error
            else {

                setError(
                    "Course could not be created. Please try again."
                );
            }

        } finally {

            setLoading(false);

        }

    };


return (
    <div
        className="modal fade show"
        tabIndex="-1"
        role="dialog"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
        <div
            className="modal-dialog modal-dialog-centered"
            role="document"
        >
            <div className="modal-content">

                {/* HEADER */}
                <div className="modal-header">

                    <h5 className="modal-title">
                        Add Course
                    </h5>

                    <button
                        type="button"
                        className="btn-close"
                        onClick={props.toggle}
                        aria-label="Close"
                    ></button>

                </div>

                {/* BODY */}
                <div className="modal-body">

                    {/* SUCCESS */}
                    {success && (
                        <div
                            className="alert alert-success"
                            role="alert"
                        >
                            <strong>Success!</strong>{" "}
                            {success}
                        </div>
                    )}

                    {/* ERROR */}
                    {error && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            <strong>Error!</strong>{" "}
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className={
                            validated ? "was-validated" : ""
                        }
                    >

                        {/* COURSE NAME */}
                        <div className="mb-3">

                            <label
                                htmlFor="Course_name"
                                className="form-label"
                            >
                                Course Name
                            </label>

                            <input
                                type="text"
                                name="Course_name"
                                id="Course_name"
                                className="form-control"
                                placeholder="Enter Course Name"
                                required
                                minLength="2"
                                maxLength="1000"
                            />

                            <div className="invalid-feedback">
                                Please enter a valid course name.
                            </div>

                        </div>


                        {/* COURSE FEES */}
                        <div className="mb-3">

                            <label
                                htmlFor="Course_Fees"
                                className="form-label"
                            >
                                Course Fees
                            </label>

                            <input
                                type="number"
                                name="Course_Fees"
                                id="Course_Fees"
                                className="form-control"
                                placeholder="Enter Course Fees"
                                min="0"
                                step="0.01"
                                required
                            />

                            <div className="invalid-feedback">
                                Please enter valid course fees.
                            </div>

                        </div>


                        {/* COURSE STATUS */}
                        <div className="mb-3">

                            <label
                                htmlFor="Course_Status"
                                className="form-label"
                            >
                                Course Status
                            </label>

                            <select
                                id="Course_Status"
                                name="Course_Status"
                                className="form-select"
                                required
                                defaultValue=""
                            >

                                <option value="" disabled>
                                    Select Course Status
                                </option>

                                <option value="Active">
                                    Active
                                </option>

                                <option value="Deactive">
                                    Deactive
                                </option>

                            </select>

                            <div className="invalid-feedback">
                                Please select course status.
                            </div>

                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="modal-footer px-0 pb-0">

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={props.toggle}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >

                                {loading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>

                                        Saving...
                                    </>
                                ) : (
                                    "Save Course"
                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </div>
    </div>
);
};


export default Addcourse;