import React, { useContext } from "react";
import AuthContext from "../../../services/AuthContext";

const Updatecourse = (props) => {

    const { update } = useContext(AuthContext);

    const handleSubmit = async (e) => {

        e.preventDefault();

        const courseData = {
            Course_id: e.target.Course_id.value,
            Course_name: e.target.Course_name.value,
            Course_Fees: e.target.Course_Fees.value,
            Course_Status: e.target.Course_Status.value
        };

        console.log(courseData);

        try {

            await update(
                courseData,
                "update_course_datail",
                "/course"
            );

            props.toggle();

        } catch (error) {

            console.error(
                "Update operation failed:",
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
                            Update Course
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

                    <div className="modal-body">

                        <form onSubmit={handleSubmit}>

                            {/* Hidden Course ID */}

                            <input
                                type="hidden"
                                name="Course_id"
                                defaultValue={props.data.Course_id}
                            />


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
                                    defaultValue={props.data.Course_name}
                                    className="form-control"
                                    name="Course_name"
                                    id="Course_name"
                                    placeholder="Enter Course Name"
                                    required
                                />

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
                                    defaultValue={props.data.Course_Fees}
                                    className="form-control"
                                    id="Course_Fees"
                                    name="Course_Fees"
                                    placeholder="Enter Course Fees"
                                    min="0"
                                    step="0.01"
                                    required
                                />

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
                                    defaultValue={props.data.Course_Status}
                                    required
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

                            </div>


                            {/* =========================
                                FOOTER
                            ========================== */}

                            <div className="modal-footer px-0 pb-0">

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={props.toggle}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-success"
                                >
                                    Update Course
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default Updatecourse;