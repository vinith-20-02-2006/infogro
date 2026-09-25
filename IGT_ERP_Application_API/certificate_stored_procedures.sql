-- Certificate Module Stored Procedures
-- File: certificate_stored_procedures.sql

DELIMITER //

-- 1. sp_certificate_get_all
DROP PROCEDURE IF EXISTS `sp_certificate_get_all` //
CREATE PROCEDURE `sp_certificate_get_all`()
BEGIN
    SELECT 
        c.certificate_id,
        c.register_id,
        c.student_name,
        COALESCE(c.course_name, cr.Course_name, 'Course') AS course_name,
        c.issue_date,
        c.joining_date,
        c.assignment_status,
        c.assessment_status,
        c.assignment_score,
        c.assessment_score,
        c.certificate_image,
        c.verification_token,
        c.whatsapp_number,
        c.certificate_status
    FROM certificate c
    LEFT JOIN course cr ON c.course_id = cr.Course_id
    ORDER BY c.create_date DESC;
END //

-- 2. sp_certificate_get_by_id
DROP PROCEDURE IF EXISTS `sp_certificate_get_by_id` //
CREATE PROCEDURE `sp_certificate_get_by_id`(
    IN p_register_id VARCHAR(50)
)
BEGIN
    SELECT 
        c.certificate_id,
        c.register_id,
        c.student_name,
        COALESCE(c.course_name, cr.Course_name, 'Course') AS course_name,
        c.issue_date,
        c.joining_date,
        c.assignment_status,
        c.assessment_status,
        c.assignment_score,
        c.assessment_score,
        c.certificate_image,
        c.verification_token,
        c.whatsapp_number,
        c.certificate_status
    FROM certificate c
    LEFT JOIN course cr ON c.course_id = cr.Course_id
    WHERE c.register_id = p_register_id OR c.certificate_id = p_register_id;
END //

-- 3. sp_certificate_generate
DROP PROCEDURE IF EXISTS `sp_certificate_generate` //
CREATE PROCEDURE `sp_certificate_generate`(
    IN p_cert_id VARCHAR(50),
    IN p_token VARCHAR(100),
    IN p_user_id INT,
    IN p_course_id BIGINT,
    IN p_student_name VARCHAR(255)
)
BEGIN
    INSERT INTO certificate (certificate_id, verification_token, user_id, course_id, student_name, issue_date, certificate_status, create_date, update_date)
    VALUES (p_cert_id, p_token, p_user_id, p_course_id, p_student_name, NOW(), 'Active', NOW(), NOW());
    
    SELECT cert.*, c.Course_name, u.username, u.first_name, u.last_name
    FROM certificate cert
    JOIN course c ON cert.course_id = c.Course_id
    JOIN auth_user u ON cert.user_id = u.id
    WHERE cert.certificate_id = p_cert_id;
END //

-- 4. sp_certificate_update
DROP PROCEDURE IF EXISTS `sp_certificate_update` //
CREATE PROCEDURE `sp_certificate_update`(
    IN p_register_id VARCHAR(50),
    IN p_student_name VARCHAR(255),
    IN p_course_name VARCHAR(255),
    IN p_issue_date DATE,
    IN p_joining_date DATE,
    IN p_assignment_status VARCHAR(50),
    IN p_assessment_status VARCHAR(50),
    IN p_assignment_score INT,
    IN p_assessment_score INT,
    IN p_whatsapp_number VARCHAR(20)
)
BEGIN
    UPDATE certificate
    SET 
        student_name = COALESCE(p_student_name, student_name),
        course_name = COALESCE(p_course_name, course_name),
        issue_date = COALESCE(p_issue_date, issue_date),
        joining_date = COALESCE(p_joining_date, joining_date),
        assignment_status = COALESCE(p_assignment_status, assignment_status),
        assessment_status = COALESCE(p_assessment_status, assessment_status),
        assignment_score = COALESCE(p_assignment_score, assignment_score),
        assessment_score = COALESCE(p_assessment_score, assessment_score),
        whatsapp_number = COALESCE(p_whatsapp_number, whatsapp_number),
        update_date = NOW()
    WHERE register_id = p_register_id OR certificate_id = p_register_id;

    SELECT * FROM certificate 
    WHERE register_id = p_register_id OR certificate_id = p_register_id;
END //

-- 5. sp_certificate_delete
DROP PROCEDURE IF EXISTS `sp_certificate_delete` //
CREATE PROCEDURE `sp_certificate_delete`(
    IN p_register_id VARCHAR(50)
)
BEGIN
    DELETE FROM certificate 
    WHERE register_id = p_register_id OR certificate_id = p_register_id;
END //

-- 6. sp_check_certificate_eligibility
DROP PROCEDURE IF EXISTS `sp_check_certificate_eligibility` //
CREATE PROCEDURE `sp_check_certificate_eligibility`(
    IN p_user_id INT, 
    IN p_course_id BIGINT
)
BEGIN
    SELECT e.*, c.Course_name, u.username, u.first_name, u.last_name
    FROM enrollment e
    JOIN course c ON e.course_id = c.Course_id
    JOIN auth_user u ON e.user_id = u.id
    WHERE e.user_id = p_user_id AND e.course_id = p_course_id;
END //

DELIMITER ;
