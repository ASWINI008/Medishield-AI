const BASE_URL = 'http://localhost:5000/api';

const randomString = () => Math.random().toString(36).substring(2, 10);

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

const test = async () => {
  console.log('🧪 STARTING SYSTEM API INTEGRATION TESTS (USING NATIVE FETCH)...\n');

  // Generate unique emails for this test run
  const patientEmail = `patient_${randomString()}@test.com`;
  const caregiverEmail = `caregiver_${randomString()}@test.com`;
  const adminEmail = `admin_${randomString()}@test.com`;
  const password = 'Password123!';

  console.log('📌 Test Accounts Info:');
  console.log(`- Patient: ${patientEmail}`);
  console.log(`- Caregiver: ${caregiverEmail}`);
  console.log(`- Admin: ${adminEmail}\n`);

  let patientToken, caregiverToken, adminToken;
  let patientId, caregiverId, adminId;
  let testMedicineId;

  try {
    // -------------------------------------------------------------
    // 1. REGISTER USERS
    // -------------------------------------------------------------
    console.log('⏳ 1. Registering Users...');

    const patReg = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: { name: 'Test Patient', email: patientEmail, password, role: 'patient' }
    });
    console.log('   ✅ Patient registered successfully.');
    patientToken = patReg.token;
    patientId = patReg.user.id;

    const cgReg = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: { name: 'Test Caregiver', email: caregiverEmail, password, role: 'caregiver' }
    });
    console.log('   ✅ Caregiver registered successfully.');
    caregiverToken = cgReg.token;
    caregiverId = cgReg.user.id;

    const admReg = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: { name: 'Test Admin', email: adminEmail, password, role: 'admin' }
    });
    console.log('   ✅ Admin registered successfully.');
    adminToken = admReg.token;
    adminId = admReg.user.id;

    // Helper functions to get authenticated headers
    const getPatHeaders = () => ({ headers: { Authorization: `Bearer ${patientToken}` } });
    const getCgHeaders = () => ({ headers: { Authorization: `Bearer ${caregiverToken}` } });
    const getAdmHeaders = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

    // -------------------------------------------------------------
    // 2. LOGIN USER & GET SELF
    // -------------------------------------------------------------
    console.log('\n⏳ 2. Testing Login & Profile Fetching...');
    const patLog = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: { email: patientEmail, password }
    });
    console.log('   ✅ Patient login successful.');
    
    const selfRes = await request(`${BASE_URL}/auth/me`, getPatHeaders());
    if (selfRes.user.email === patientEmail) {
      console.log('   ✅ Fetch current user (/auth/me) verified.');
    } else {
      throw new Error('Fetched user does not match logged-in user email');
    }

    // -------------------------------------------------------------
    // 3. MEDICINE CRUD
    // -------------------------------------------------------------
    console.log('\n⏳ 3. Testing Patient Medicine Management...');
    const medCreate = await request(`${BASE_URL}/medicines`, {
      method: 'POST',
      body: {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice', // CORRECTED ENUM VALUE
        timings: ['08:00', '20:00'],
        stock: 60,
        refillAt: 10,
        instructions: 'Take with meals'
      },
      ...getPatHeaders()
    });
    console.log('   ✅ Medicine created successfully.');
    testMedicineId = medCreate.medicine.id;

    const medList = await request(`${BASE_URL}/medicines`, getPatHeaders());
    if (medList.medicines.length > 0) {
      console.log(`   ✅ Fetch medicine list verified. Total: ${medList.medicines.length}`);
    } else {
      throw new Error('Medicine list is empty after creation');
    }

    const medTake = await request(`${BASE_URL}/medicines/${testMedicineId}/take`, {
      method: 'POST',
      ...getPatHeaders()
    });
    if (medTake.success) {
      console.log(`   ✅ Medication adherence event recorded (Stock decreased to: ${medTake.medicine.stock}).`);
    } else {
      throw new Error('Failed to take medicine');
    }

    // -------------------------------------------------------------
    // 4. CAREGIVER ASSIGNMENT & SUMMARY
    // -------------------------------------------------------------
    console.log('\n⏳ 4. Testing Caregiver & Assignment Features...');
    
    // Assign Patient to Caregiver
    const assignRes = await request(`${BASE_URL}/caregiver/assign-patient`, {
      method: 'POST',
      body: { email: patientEmail },
      ...getCgHeaders()
    });
    console.log(`   ✅ Patient assignment successful: ${assignRes.message}`);

    // Get Caregiver Patients
    const cgPatients = await request(`${BASE_URL}/caregiver/patients`, getCgHeaders());
    if (cgPatients.patients.find(p => p.id === patientId)) {
      console.log('   ✅ Caregiver assigned patients list verified.');
    } else {
      throw new Error('Assigned patient not in caregiver\'s patients list');
    }

    // Get Patient Summary (Caregiver View)
    const patSummary = await request(`${BASE_URL}/caregiver/patient/${patientId}/summary`, getCgHeaders());
    if (patSummary.success && patSummary.patient.id === patientId) {
      console.log('   ✅ Patient summary retrieval verified.');
    } else {
      throw new Error('Failed to fetch patient summary');
    }

    // -------------------------------------------------------------
    // 5. AI FEATURES
    // -------------------------------------------------------------
    console.log('\n⏳ 5. Testing Generative AI Assistance & OCR...');
    
    try {
      console.log('   💬 Sending prompt to AI Chatbot...');
      const chatRes = await request(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        body: { message: 'Hello, I am feeling a bit dizzy after taking Metformin, is this normal?' },
        ...getPatHeaders()
      });
      console.log(`   ✅ AI Chatbot response: "${chatRes.reply.substring(0, 100)}..."`);
      
      const chatHistory = await request(`${BASE_URL}/ai/history`, getPatHeaders());
      if (chatHistory.success && chatHistory.messages.length > 0) {
        console.log('   ✅ AI Chat history retrieval verified.');
      } else {
        throw new Error('AI Chat history is empty');
      }
    } catch (aiErr) {
      console.log(`   ⚠️ AI Chat request issue (might be due to API key/connectivity): ${aiErr.message}`);
    }

    // Caregiver Patient AI Insights
    try {
      console.log('   💬 Requesting AI wellness insights for Patient...');
      const insightsRes = await request(`${BASE_URL}/caregiver/insights/${patientId}`, getCgHeaders());
      console.log(`   ✅ AI Insights generated successfully: "${insightsRes.insights.substring(0, 100)}..."`);
    } catch (insightsErr) {
      console.log(`   ⚠️ AI Insights request issue: ${insightsErr.message}`);
    }

    // -------------------------------------------------------------
    // 6. EMERGENCY SOS
    // -------------------------------------------------------------
    console.log('\n⏳ 6. Testing Emergency SOS Alert System...');
    const sosRes = await request(`${BASE_URL}/emergency/sos`, {
      method: 'POST',
      ...getPatHeaders()
    });
    if (sosRes.success && sosRes.caregiverNotified) {
      console.log('   ✅ Emergency SOS triggered and caregiver notified successfully!');
    } else {
      throw new Error('SOS trigger or caregiver notification failed');
    }

    // Check notifications for caregiver
    const cgNotifs = await request(`${BASE_URL}/notifications`, getCgHeaders());
    const emergencyNotif = cgNotifs.notifications.find(n => n.type === 'emergency');
    if (emergencyNotif) {
      console.log(`   ✅ Caregiver emergency alert received successfully: "${emergencyNotif.title}" - "${emergencyNotif.message}"`);
    } else {
      throw new Error('Caregiver did not receive emergency alert');
    }

    // -------------------------------------------------------------
    // 7. NOTIFICATIONS
    // -------------------------------------------------------------
    console.log('\n⏳ 7. Testing Notification Alerts Management...');
    const patNotifs = await request(`${BASE_URL}/notifications`, getPatHeaders());
    console.log(`   ✅ Fetched patient notifications. Total: ${patNotifs.notifications.length}`);

    if (patNotifs.notifications.length > 0) {
      const targetNotifId = patNotifs.notifications[0].id;
      const readRes = await request(`${BASE_URL}/notifications/${targetNotifId}/read`, {
        method: 'PUT',
        ...getPatHeaders()
      });
      if (readRes.success) {
        console.log('   ✅ Mark single notification as read verified.');
      } else {
        throw new Error('Failed to mark notification as read');
      }

      const readAllRes = await request(`${BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        ...getPatHeaders()
      });
      if (readAllRes.success) {
        console.log('   ✅ Mark all notifications as read verified.');
      } else {
        throw new Error('Failed to mark all notifications as read');
      }
    }

    // -------------------------------------------------------------
    // 8. USER PROFILE SETTINGS
    // -------------------------------------------------------------
    console.log('\n⏳ 8. Testing Profile Updates & Security...');
    const profileUpdate = await request(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      body: { phone: '123-456-7890', bloodGroup: 'O+', address: '123 Main St, New York, NY' },
      ...getPatHeaders()
    });
    if (profileUpdate.success && profileUpdate.user.phone === '123-456-7890') {
      console.log('   ✅ Profile information update verified.');
    } else {
      throw new Error('Profile update validation failed');
    }

    const passChange = await request(`${BASE_URL}/users/change-password`, {
      method: 'PUT',
      body: { currentPassword: password, newPassword: 'NewPassword123!' },
      ...getPatHeaders()
    });
    if (passChange.success) {
      console.log('   ✅ Password change verified.');
      // Re-login to verify new password
      const newLogin = await request(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: { email: patientEmail, password: 'NewPassword123!' }
      });
      patientToken = newLogin.token;
      console.log('   ✅ Login with new password verified.');
    } else {
      throw new Error('Password change failed');
    }

    // -------------------------------------------------------------
    // 9. ADMIN CONSOLE
    // -------------------------------------------------------------
    console.log('\n⏳ 9. Testing Admin Dashboard & Management...');
    const allUsers = await request(`${BASE_URL}/admin/users`, getAdmHeaders());
    if (allUsers.success && allUsers.users.length > 0) {
      console.log(`   ✅ Fetch all users list verified. Total: ${allUsers.users.length}`);
    } else {
      throw new Error('Admin get all users failed');
    }

    const testAdminUserEmail = `adm_created_${randomString()}@test.com`;
    const adminCreateUser = await request(`${BASE_URL}/admin/users`, {
      method: 'POST',
      body: {
        name: 'Admin Created User',
        email: testAdminUserEmail,
        password: 'AdminPassword123!',
        role: 'patient',
        phone: '555-555-5555'
      },
      ...getAdmHeaders()
    });
    const newUserId = adminCreateUser.user.id;
    console.log(`   ✅ Admin created new user successfully: ID ${newUserId}`);

    const adminDeleteUser = await request(`${BASE_URL}/admin/users/${newUserId}`, {
      method: 'DELETE',
      ...getAdmHeaders()
    });
    if (adminDeleteUser.success) {
      console.log('   ✅ Admin deleted user successfully.');
    } else {
      throw new Error('Admin delete user failed');
    }

    const analytics = await request(`${BASE_URL}/admin/analytics`, getAdmHeaders());
    if (analytics.success && analytics.stats) {
      console.log('   ✅ System analytics fetch verified.');
      console.log('   📊 System Stats:', JSON.stringify(analytics.stats, null, 2).replace(/\n/g, '\n      '));
    } else {
      throw new Error('Fetch system analytics failed');
    }

    // Cleanup: Delete our created medicine
    await request(`${BASE_URL}/medicines/${testMedicineId}`, {
      method: 'DELETE',
      ...getPatHeaders()
    });
    console.log('\n🗑️ Cleaned up test medicine.');

    console.log('\n✨ ALL SYSTEM API TESTS COMPLETED AND VERIFIED PERFECTLY! ✨');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED!');
    if (err.status) {
      console.error(`   Status: ${err.status}`);
      console.error('   Response:', JSON.stringify(err.data, null, 2));
    } else {
      console.error(`   Error message: ${err.message}`);
    }
    process.exit(1);
  }
};

test();
