const { checkEmailExist } = require("../controllers/userController");
const pool = require("../services/db");

module.exports = {
    createNewUser: (data, callback) => {
        const SQLSTATEMENT = 'CALL create_new_user($1, $2, $3, $4)';
        const VALUES = [data.email, data.phone, data.identification_type || 'national_id', data.identification_number];
        pool.query(SQLSTATEMENT, VALUES, (error, result) => {
            if (error) {
                return callback(error, null);
            }
            // Fetch the newly created user to return details
            const userSQL = `
                SELECT user_id, email, phone, created_at
                FROM "User"
                WHERE email = $1;
            `;
            pool.query(userSQL, [data.email], (userError, userResult) => {
                if (userError) {
                    return callback(userError, null);
                }
                callback(null, userResult);
            });
        });
    },

    verifyUserWithOtp: (data, callback) => {
        const SQLSTATEMENT = 'CALL verify_user_with_otp($1, $2, NULL, NULL)';
        const VALUES = [data.identification_number, data.otp];
        pool.query(SQLSTATEMENT, VALUES, (error, result) => {
            if (error) {
                return callback(error, null);
            }
            // Extract OUT parameters from the result
            const { p_user_id, p_token } = result.rows[0] || {};
            if (!p_user_id || !p_token) {
                return callback(new Error('Verification failed'), null);
            }
            callback(null, { user_id: p_user_id, token: p_token });
        });
    },

    readLoggedInUser: (data, callback) => {
        const SQLSTATEMENT = `
            SELECT user_id, email, phone, created_at, updated_at
            FROM "User"
            WHERE user_id = $1;
        `;
        const VALUES = [data.user_id];
        pool.query(SQLSTATEMENT, VALUES, callback);
    },

    readUserByIdentificationNo: (data, callback) => {
        const SQLSTATEMENT = `
            SELECT i.identification_id, i.mobile_number
            FROM Identification i
            WHERE i.number = $1;
        `;
        const VALUES = [data.identification_number];
        pool.query(SQLSTATEMENT, VALUES, callback);
    },

    updateVerificationWithOtp: (data, callback) => {
        const SQLSTATEMENT = `
            UPDATE Verification
            SET otp_code = $1, otp_sent_at = CURRENT_TIMESTAMP, otp_expiry = CURRENT_TIMESTAMP + INTERVAL '5 minutes', verified = FALSE
            WHERE identification_id = $2
            RETURNING user_id;
        `;
        const VALUES = [data.otp_code, data.identification_id];
        pool.query(SQLSTATEMENT, VALUES, callback);
    },

    checkEmailExist: (data, callback) => {
        const SQLSTATEMENT = `
            SELECT user_id FROM "User" WHERE email = $1;
        `;
        const VALUES = [data.email];
        pool.query(SQLSTATEMENT, VALUES, callback); 
    }
};