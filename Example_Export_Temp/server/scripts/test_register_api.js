const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const runTest = async () => {
    try {
        const form = new FormData();
        form.append('name', 'API Test Doctor');
        form.append('email', `apitest${Date.now()}@doc.com`);
        form.append('password', 'password123');
        form.append('role', 'doctor');

        // Doctor Specific Fields
        form.append('specialization', 'Virology');
        form.append('medicalLicense', 'TEST-LIC-999');
        form.append('hospitalName', 'Test Hospital');
        form.append('city', 'Test City');
        form.append('clinicAddress', '123 Test Lane');
        form.append('registrationYear', '2023');
        form.append('stateMedicalCouncil', 'Test Council');

        // Create a dummy file
        const filePath = path.join(__dirname, 'test_license.jpg');
        fs.writeFileSync(filePath, 'Dummy Image Content');
        form.append('licenseProof', fs.createReadStream(filePath), 'test_license.jpg');

        console.log('Sending Registration Request...');
        const response = await axios.post('http://localhost:5000/api/auth/register', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Registration Success:', response.status);
        console.log('Token:', response.data.token ? 'Received' : 'Missing');

        // Now Verify via Admin Endpoint (if possible, but we need admin token)
        // Or just trust the logs we added to server

    } catch (err) {
        console.error('Registration Failed:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
            console.error('Status:', err.response.status);
        }
    }
};

runTest();
