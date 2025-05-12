const { getClient, query } = require('../services/db'); // Import getClient and query

async function createTablesAndInsertAdmin() {
    const client = await getClient();
    try {
        await client.query('BEGIN'); // Start a transaction

        const sqlStatements = [
            `DROP TABLE IF EXISTS Notification, Session, UserPermissionRole, Permission, Verification, Billings, Availability, MedicalRecords, Appointment, EmergencyContact, PatientStatus, Patient, HealthcareFacilityPhysician, PhysicianCertification, PhysicianSpecialization, Physician, "User", Role, HealthcareFacility, Specialization, Identification CASCADE;`,

            `-- Create base tables with no dependencies first
            CREATE TABLE Specialization (
                specialization_id SERIAL PRIMARY KEY,
                specialization_name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `CREATE TABLE HealthcareFacility (
                facility_id SERIAL PRIMARY KEY,
                facility_name VARCHAR(100) NOT NULL,
                address VARCHAR(255),
                postal_code VARCHAR(20),
                phone VARCHAR(20),
                no_of_staff INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `CREATE TABLE Role (
                role_id SERIAL PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `CREATE TABLE "User" (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `-- Create tables with dependencies
            CREATE TABLE Identification (
                identification_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type VARCHAR(50),
                number VARCHAR(50) NOT NULL,
                mobile_number VARCHAR(20) NOT NULL,
                issued_date DATE,
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES "User"(user_id)
            );`,

            `CREATE TABLE Verification (
                verification_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                identification_id INTEGER NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                otp_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                otp_expiry TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 minutes',
                verified BOOLEAN DEFAULT FALSE,
                verified_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES "User"(user_id),
                FOREIGN KEY (identification_id) REFERENCES Identification(identification_id)
            );`,

            `CREATE TABLE Session (
                session_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
                FOREIGN KEY (user_id) REFERENCES "User"(user_id)
            );`,

            `CREATE TABLE Physician (
                physician_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                current_no INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES "User"(user_id)
            );`,

            `CREATE TABLE PhysicianSpecialization (
                physician_id INTEGER NOT NULL,
                specialization_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (physician_id, specialization_id),
                FOREIGN KEY (physician_id) REFERENCES Physician(physician_id),
                FOREIGN KEY (specialization_id) REFERENCES Specialization(specialization_id)
            );`,

            `CREATE TABLE PhysicianCertification (
                certification_id SERIAL PRIMARY KEY,
                physician_id INTEGER NOT NULL,
                certification_name VARCHAR(100) NOT NULL,
                issuing_authority VARCHAR(100),
                issue_date DATE,
                expiry_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (physician_id) REFERENCES Physician(physician_id)
            );`,

            `CREATE TABLE HealthcareFacilityPhysician (
                facility_id INTEGER NOT NULL,
                physician_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (facility_id, physician_id),
                FOREIGN KEY (facility_id) REFERENCES HealthcareFacility(facility_id),
                FOREIGN KEY (physician_id) REFERENCES Physician(physician_id)
            );`,

            `CREATE TABLE Patient (
                patient_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                address VARCHAR(255),
                postal_code VARCHAR(20),
                gender VARCHAR(20),
                dob DATE,
                blood_type VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES "User"(user_id)
            );`,

            `CREATE TABLE PatientStatus (
                status_id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                facility_id INTEGER NOT NULL,
                start_date DATE,
                end_date DATE,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
                FOREIGN KEY (facility_id) REFERENCES HealthcareFacility(facility_id)
            );`,

            `CREATE TABLE EmergencyContact (
                contact_id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                contact_no VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
            );`,

            `CREATE TABLE Appointment (
                appt_id SERIAL PRIMARY KEY,
                physician_id INTEGER NOT NULL,
                patient_id INTEGER NOT NULL,
                date_time TIMESTAMP NOT NULL,
                status VARCHAR(50),
                facility_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (physician_id) REFERENCES Physician(physician_id),
                FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
                FOREIGN KEY (facility_id) REFERENCES HealthcareFacility(facility_id)
            );`,

            `CREATE TABLE MedicalRecords (
                record_id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                issued_by INTEGER NOT NULL,
                record_type VARCHAR(50),
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
                FOREIGN KEY (issued_by) REFERENCES Physician(physician_id)
            );`,

            `CREATE TABLE Availability (
                availability_id SERIAL PRIMARY KEY,
                physician_id INTEGER NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                is_booked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (physician_id) REFERENCES Physician(physician_id)
            );`,

            `CREATE TABLE Billings (
                bill_id SERIAL PRIMARY KEY,
                patient_id INTEGER NOT NULL,
                appt_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES Patient(patient_id),
                FOREIGN KEY (appt_id) REFERENCES Appointment(appt_id)
            );`,

            `CREATE TABLE Permission (
                permission_id SERIAL PRIMARY KEY,
                permission_name VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,

            `CREATE TABLE UserPermissionRole (
                user_permission_id SERIAL PRIMARY KEY,
                permission_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (permission_id) REFERENCES Permission(permission_id),
                FOREIGN KEY (user_id) REFERENCES "User"(user_id),
                FOREIGN KEY (role_id) REFERENCES Role(role_id)
            );`,

            `CREATE TABLE Notification (
                notification_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type VARCHAR(50),
                message TEXT,
                status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES "User"(user_id)
            );`,

            `-- Insert initial data
            INSERT INTO Role (role_name) VALUES 
                ('admin'),
                ('physician'),
                ('patient');`,

            `-- Insert admin user
            INSERT INTO "User" (email, phone)
            VALUES ('admin@example.com', '+6512345678');`,

            `-- Insert initial identification for admin
            INSERT INTO Identification (user_id, type, number, mobile_number)
            VALUES (1, 'nric', 'A1234567A', '+6512345678');`,

            `-- Insert initial verification for admin
            INSERT INTO Verification (user_id, identification_id, otp_code)
            VALUES (1, 1, '123456');` // Placeholder OTP for initial setup
        ];

        for (const sql of sqlStatements) {
            await client.query(sql);
            console.log(`Executed SQL: ${sql.substring(0, 50)}...`);
        }

        await client.query('COMMIT');
        console.log('All tables created and admin user inserted successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating tables or inserting data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Execute the script
(async () => {
    try {
        await createTablesAndInsertAdmin();
    } catch (error) {
        console.error('Script execution failed:', error);
        process.exit(1);
    }
})();