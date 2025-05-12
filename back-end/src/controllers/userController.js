const { DatabaseError } = require('pg');
const userModel = require('../models/userModel.js');
const crypto = require('crypto'); // For generating OTP
const { enableCompileCache } = require('module');

module.exports = {
    sendOtp: (req, res, next) => {
        console.log('Request to send OTP');
        const { identification_number } = req.body;

        if (!identification_number) {
            return res.status(400).json({ message: 'Missing identification number.' });
        }

        const data = { identification_number };

        const callback = (error, results) => {
            if (error) {
                console.error(`Error finding user: ${error}`);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (!results.rows || results.rows.length === 0) {
                return res.status(404).json({ message: `Identification number ${identification_number} not found.` });
            }

            const { identification_id, mobile_number } = results.rows[0];
            const otp_code = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit OTP

            const updateData = {
                otp_code: otp_code,
                identification_id: identification_id
            };

            // Update Verification with new OTP
            userModel.updateVerificationWithOtp(updateData, (updateError, updateResult) => {
                if (updateError) {
                    console.error(`Error updating OTP: ${updateError}`);
                    return res.status(500).json({ message: 'Failed to generate OTP.' });
                }

                // Simulate sending OTP (replace with real SMS service)
                console.log(`OTP ${otp_code} sent to ${mobile_number}`);
                res.locals.user_id = updateResult.rows[0].user_id;
                res.status(200).json({ message: `OTP sent to ${mobile_number}.` });
            });
        };

        userModel.readUserByIdentificationNo(data, callback);
    },

    verifyOtp: (req, res, next) => {
        console.log('Request to verify OTP');
        const { identification_number, otp } = req.body;

        if (!identification_number || !otp) {
            return res.status(400).json({ message: 'Missing identification number or OTP.' });
        }

        const data = { identification_number, otp };
        const callback = (error, results) => {
            if (error) {
                console.error(`Error verifying OTP: ${error}`);
                return res.status(401).json({ message: error.message || 'OTP verification failed.' });
            }

            res.locals.user_id = results.user_id;
            next(); // Pass to jwtMiddleware.generateToken
        };

        userModel.verifyUserWithOtp(data, callback);
    },

    register: (req, res, next) => {
        console.log('A registration was made');
        const { email, phone, identification_type, identification_number } = req.body;

        // if (!email || !phone || !identification_number) {
        //     return res.status(400).json({ message: 'Missing required data (email, phone, or identification number).' });
        // }

        const data = {
            email,
            phone,
            identification_type: identification_type || 'national_id',
            identification_number
        };

        const callback = (error, results) => {
            if (error) {
                console.error(`Error registering user: ${error}`);
                return res.status(500).json({ message: 'User registration failed.' });
            }

            res.locals.message = `User ${email} successfully created.`;
            res.locals.user_id = results.rows[0].user_id;
            next(); // Pass to jwtMiddleware.generateToken
        };

        userModel.createNewUser(data, callback);
    },

    checkEmailExist: (req, res, next) => {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Missing email.' });
        }

        const data = {
            email: email
        }

        const callback = (error, results) => {
            if (error) {
                console.error(`Error checking email: ${error}`);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (results.rows.length > 0) {
                return res.status(409).json({ message: 'Email already exists. Please try another email.' });
            }

            next();
        };

        userModel.checkEmailExist(data, callback);
    },

    readLoggedInPlayer: (req, res, next) => {
        const data = { user_id: res.locals.user_id };

        if (!data.user_id) {
            return res.status(400).json({ message: 'User ID not found in session.' });
        }

        const callback = (error, results) => {
            if (error) {
                console.error(`Error reading logged-in user: ${error}`);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (!results.rows || results.rows.length === 0) {
                return res.status(404).json({ message: `User with ID ${data.user_id} does not exist.` });
            }

            return res.status(200).json(results.rows[0]);
        };

        userModel.readLoggedInUser(data, callback);
    }
};