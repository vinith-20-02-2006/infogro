import React, {
    useState,
    useContext,
    useEffect,
    useCallback
} from "react";

import "./Course.css";

import Addcourse from "./addcourse/Addcourse";
import Updatecourse from "./updatecourse/Updatecourse";
import Deletecourse from "./deletecourse/Deletecourse";

import AuthContext from "../../services/AuthContext";


function Course() {

    const [addPopupVisible, setAddPopupVisible] = useState(false);
    const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
    const [deletePopupVisible, setDeletePopupVisible] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const { getData } = useContext(AuthContext);

    const [courses, setCourses] = useState([]);

    const [value, setValue] = useState(null);


    // =====================================================
    // FETCH COURSES
    // =====================================================

    const fetchCourses = useCallback(async () => {

        try {

            const data = await getData(
                "fetch_course_datail"
            );

            console.log(
                "Courses fetched:",
                data
            );

            if (Array.isArray(data)) {

                setCourses(data);

            } else {

                setCourses([]);

            }

        } catch (err) {

            console.error(
                "Failed to fetch courses:",
                err
            );

        }

    }, [getData]);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        fetchCourses();

    }, [fetchCourses]);


    // =====================================================
    // ADD POPUP
    // =====================================================

    const toggleAddPopup = () => {

        setAddPopupVisible(
            !addPopupVisible
        );

    };


    // =====================================================
    // UPDATE POPUP
    // =====================================================

    const toggleUpdatePopup = () => {

        setUpdatePopupVisible(
            !updatePopupVisible
        );

    };


    // =====================================================
    // DELETE POPUP
    // =====================================================

    const toggleDeletePopup = () => {

        setDeletePopupVisible(
            !deletePopupVisible
        );

    };


    // =====================================================
    // AFTER COURSE CREATED
    // =====================================================

    const handleCourseCreated = async () => {

        console.log(
            "New course created. Refreshing list..."
        );

        // Fetch latest data from Django
        await fetchCourses();

        // Close popup
        setAddPopupVisible(false);

        // Go back to first page
        setCurrentPage(1);

    };


    // =====================================================
    // PAGINATION
    // =====================================================

    const itemsPerPage = 4;

    const indexOfLastItem =
        currentPage * itemsPerPage;

    const indexOfFirstItem =
        indexOfLastItem - itemsPerPage;

    const currentCourses =
        courses.slice(
            indexOfFirstItem,
            indexOfLastItem
        );


    const nextPage = () => {

        if (
            indexOfLastItem <
            courses.length
        ) {

            setCurrentPage(
                currentPage + 1
            );

        }

    };


    const prevPage = () => {

        if (currentPage > 1) {

            setCurrentPage(
                currentPage - 1
            );

        }

    };


    // =====================================================
    // UPDATE
    // =====================================================

    const handleUpdate = (course) => {

        setValue(course);

        toggleUpdatePopup();

    };


    // =====================================================
    // DELETE
    // =====================================================

    const handleDelete = (id) => {

        setValue(id);

        toggleDeletePopup();

    };


    return (

        <div className="course-page container-xxl flex-grow-1 container-p-y">


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="page-header">

                <div>

                    <h3 className="page-title">
                        Course Management
                    </h3>

                    <p className="page-subtitle">
                        Manage all available courses
                    </p>

                </div>


                <button
                    className="btn btn-primary add-btn"
                    onClick={toggleAddPopup}
                >

                    <i className="bx bx-plus me-2"></i>

                    Add Course

                </button>

            </div>


            {/* ================================================= */}
            {/* ADD COURSE POPUP */}
            {/* ================================================= */}

            {addPopupVisible && (

                <Addcourse
                    toggle={toggleAddPopup}
                    onSuccess={handleCourseCreated}
                />

            )}


            {/* ================================================= */}
            {/* COURSE TABLE */}
            {/* ================================================= */}

            <div className="card course-card">

                <div className="table-responsive">

                    <table className="table modern-table">

                        <thead>

                            <tr>

                                <th>ID</th>

                                <th>
                                    Course Name
                                </th>

                                <th>
                                    Fees
                                </th>

                                <th>
                                    Created Date
                                </th>

                                <th>
                                    Status
                                </th>

                                <th width="180">
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {currentCourses.length > 0 ? (

                                currentCourses.map(
                                    (course) => (

                                        <tr
                                            key={
                                                course.Course_id
                                            }
                                        >

                                            <td>
                                                #{course.Course_id}
                                            </td>


                                            <td>

                                                <strong>
                                                    {
                                                        course.Course_name
                                                    }
                                                </strong>

                                            </td>


                                            <td>

                                                ₹{" "}
                                                {
                                                    course.Course_Fees
                                                }

                                            </td>


                                            <td>

                                                {
                                                    course.Create_date
                                                        ? new Date(
                                                              course.Create_date
                                                          ).toLocaleDateString()
                                                        : "-"
                                                }

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        course.Course_Status ===
                                                        "Active"
                                                            ? "status active"
                                                            : "status inactive"
                                                    }
                                                >

                                                    {
                                                        course.Course_Status
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                <div className="action-buttons">

                                                    <button
                                                        className="btn btn-edit"
                                                        onClick={() =>
                                                            handleUpdate(
                                                                course
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        className="btn btn-delete"
                                                        onClick={() =>
                                                            handleDelete(
                                                                course.Course_id
                                                            )
                                                        }
                                                    >
                                                        Delete
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

                                        No courses found.

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ================================================= */}
                {/* UPDATE */}
                {/* ================================================= */}

                {updatePopupVisible && (

                    <Updatecourse
                        toggle={toggleUpdatePopup}
                        data={value}
                    />

                )}


                {/* ================================================= */}
                {/* DELETE */}
                {/* ================================================= */}

                {deletePopupVisible && (

                    <Deletecourse
                        toggle={toggleDeletePopup}
                        data={value}
                    />

                )}


                {/* ================================================= */}
                {/* PAGINATION */}
                {/* ================================================= */}

                <div className="card-footer bg-white border-0">

                    <div className="d-flex justify-content-end">

                        <button
                            className="btn btn-light me-2"
                            onClick={prevPage}
                            disabled={
                                currentPage === 1
                            }
                        >

                            <i className="bx bx-chevron-left"></i>

                            Previous

                        </button>


                        <button
                            className="btn btn-primary"
                            onClick={nextPage}
                            disabled={
                                indexOfLastItem >=
                                courses.length
                            }
                        >

                            Next

                            <i className="bx bx-chevron-right ms-1"></i>

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Course;