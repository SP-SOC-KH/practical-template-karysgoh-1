const { query } = require('../database');
const { SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR, RAISE_EXCEPTION } = require('../errors');

module.exports.retrieveAll = function retrieveAll() {
    const sql = `SELECT adm_no, stud_name, gender, crse_code, gpa, gpa_last_updated FROM student`;
    return query(sql).then(function (result) {
        return result.rows;
    });
};

module.exports.enrolNewStudent = function enrolNewStudent(adminNumber, studentName, gender, address, dob, nationality, courseCode) {
    const sql = 'CALL enrol_new_student($1, $2, $3, $4, $5, $6, $7, $8)'; // To match the new method signature of the stored procedure
    return query(sql, [adminNumber, studentName, gender, address, dob, nationality, courseCode, '']) // Pass an empty string for the OUT parameter
        .then(function (result) {
            console.log(result); // For debugging purpose

            // Check if the result contains an error message
            if (result.rows.length === 1 && result.rows[0].errMsg) { // Check if there is an error message
                throw new RAISE_EXCEPTION(result.rows[0].errMsg); // Throw the error message
            }
        })
        .catch(function (error) {
            // Handle unique violation error (duplicate student)
            if (error.code === SQL_ERROR_CODE.UNIQUE_VIOLATION) {
                throw new UNIQUE_VIOLATION_ERROR(`Student with adm no ${adminNumber} already exists! Cannot create duplicate.`);
            }

            // Handle other SQL exceptions raised
            if (error.code === SQL_ERROR_CODE.RAISE_EXCEPTION) {
                throw new RAISE_EXCEPTION(error.message);
            }

            // Throw any other error that occurs
            throw error;
        });
};


