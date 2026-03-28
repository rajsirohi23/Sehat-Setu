// Doctor Dashboard JavaScript
// Handles all doctor dashboard functionality

class DoctorDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.loadDoctorData();
        this.setupNavigation();
        this.loadDashboardData();
        this.fetchDoctorProfile();
    }

    loadDoctorData() {
        // Get doctor data from localStorage
        const doctorName = localStorage.getItem('userName') || 'Doctor';
        const userId = localStorage.getItem('userId');

        // If no user data, redirect to login
        if (!doctorName || !userId) {
            window.location.href = 'login.html';
            return;
        }

        // Update UI with doctor data
        document.getElementById('welcomeMessage').textContent = `Welcome, Dr. ${doctorName}!`;
        document.getElementById('doctorName').textContent = `Dr. ${doctorName}`;
        document.getElementById('doctorSpecialty').textContent = 'General Medicine';
        
        // Set avatar initial
        const initial = doctorName.charAt(0).toUpperCase();
        document.getElementById('doctorAvatar').textContent = initial;
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                this.switchSection(section);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;

            // Load section-specific data
            this.loadSectionData(sectionName);
        }
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'patients':
                this.loadPatients();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'consultations':
                this.loadConsultations();
                break;
            case 'prescriptions':
                this.loadPrescriptions();
                break;
            case 'profile':
                this.fetchDoctorProfile();
                break;
        }
    }

    async fetchDoctorProfile() {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) { window.location.href = 'login.html'; return; }

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.user.profile;
                const email = data.user.email;

                // Update header info
                document.getElementById('doctorSpecialty').textContent = profile.specialty || 'General Medicine';

                // Populate profile form
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
                set('profileName', profile.name);
                set('profileEmail', email);
                set('profilePhone', profile.phone);
                set('profileLicense', profile.licenseNumber);
                set('profileExperience', profile.experience);
                set('profileAddress', profile.clinicAddress);
                set('profileBio', profile.bio);

                // Specialty dropdown
                const specialtyEl = document.getElementById('profileSpecialty');
                if (specialtyEl && profile.specialty) specialtyEl.value = profile.specialty;
            }
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
        }
    }

    loadDashboardData() {
        // Load today's schedule
        this.loadTodaySchedule();
        
        // Load recent activities
        this.loadRecentActivities();
    }

    loadTodaySchedule() {
        const container = document.getElementById('todaySchedule');
        if (!container) return;

        const schedule = [
            { time: '09:00 AM', patient: 'John Smith', type: 'Follow-up', id: 'demo1' },
            { time: '10:30 AM', patient: 'Sarah Johnson', type: 'New Consultation', id: 'demo2' },
            { time: '02:00 PM', patient: 'Michael Brown', type: 'Check-up', id: 'demo3' }
        ];

        container.innerHTML = schedule.map(apt => `
            <div class="appointment-item appointment-scheduled">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-time">${apt.time}</div>
                        <div class="appointment-patient">${apt.patient} - ${apt.type}</div>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn btn-sm btn-success" onclick="startVideoCall('${apt.id}')">
                            <i class="fas fa-video"></i> Start
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        const activities = [
            { icon: 'user-check', title: 'Completed consultation with John Smith', time: '30 minutes ago' },
            { icon: 'prescription', title: 'Prescribed medication to Sarah Johnson', time: '1 hour ago' },
            { icon: 'calendar-check', title: 'Scheduled follow-up for Michael Brown', time: '2 hours ago' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="record-item">
                <div class="record-header">
                    <h4 class="record-title">
                        <i class="fas fa-${activity.icon}" style="margin-right: 0.5rem; color: #2c5282;"></i>
                        ${activity.title}
                    </h4>
                    <span class="record-date">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    async loadPatients() {
        const container = document.getElementById('patientsList');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#2c5282;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`${CONFIG.API_BASE_URL}/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch patients');
            const data = await response.json();
            this.patients = data.data || [];

            if (this.patients.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:#64748b;grid-column:1/-1;">
                        <i class="fas fa-users" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;"></i>
                        <p style="font-size:1.1rem;">No patients registered yet</p>
                    </div>`;
                return;
            }

            this.renderPatients(this.patients);

            // Setup search/filter
            const searchInput = document.getElementById('patientSearch');
            const statusFilter = document.getElementById('statusFilter');
            if (searchInput) searchInput.addEventListener('input', () => this.filterPatients());
            if (statusFilter) statusFilter.addEventListener('change', () => this.filterPatients());

        } catch (error) {
            console.error('Error loading patients:', error);
            container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading patients</div>`;
        }
    }

    renderPatients(patients) {
        const container = document.getElementById('patientsList');
        if (!container) return;

        container.innerHTML = patients.map(patient => {
            const age = patient.dateOfBirth
                ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
                : 'N/A';
            const lastVisit = patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A';
            const conditions = patient.medicalHistory?.map(h => h.condition).join(', ') || 'None recorded';

            return `
            <div class="patient-card">
                <div class="patient-header">
                    <div>
                        <h4 class="patient-name">${patient.name}</h4>
                        <div class="patient-id">ID: ${patient._id.slice(-6).toUpperCase()}</div>
                    </div>
                    <span class="status-badge status-active">REGISTERED</span>
                </div>
                <div class="patient-info">
                    <div><strong>Age:</strong> ${age}</div>
                    <div><strong>Gender:</strong> ${patient.gender || 'N/A'}</div>
                    <div><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${patient.phone || 'N/A'}</div>
                    <div><strong>Condition:</strong> ${conditions}</div>
                    <div><strong>Last Updated:</strong> ${lastVisit}</div>
                </div>
                <div class="patient-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewPatientDetails('${patient._id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="viewMedicalHistory('${patient._id}', '${patient.name}')">
                        <i class="fas fa-history"></i> Medical History
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    filterPatients() {
        const search = (document.getElementById('patientSearch')?.value || '').toLowerCase();
        const status = document.getElementById('statusFilter')?.value || '';

        const filtered = this.patients.filter(p => {
            const matchSearch = !search ||
                p.name.toLowerCase().includes(search) ||
                p._id.includes(search) ||
                (p.medicalHistory?.some(h => h.condition?.toLowerCase().includes(search)));
            return matchSearch;
        });

        this.renderPatients(filtered);
    }

    async loadAppointments() {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#2c5282;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            const appointments = data.data || [];

            if (appointments.length === 0) {
                container.innerHTML = `<div style="text-align:center;padding:3rem;color:#64748b;">
                    <i class="fas fa-calendar-times" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;"></i>
                    <p>No appointments yet</p></div>`;
                return;
            }

            container.innerHTML = appointments.map(apt => {
                const patient = apt.patientId;
                const aptDate = new Date(apt.appointmentDate).toLocaleDateString();
                const roomName = 'sehat-setu-' + apt._id.slice(-8);
                return `
                <div class="appointment-item appointment-${apt.status}">
                    <div class="appointment-header">
                        <div>
                            <div class="appointment-time">${aptDate} at ${apt.appointmentTime}</div>
                            <div class="appointment-patient">${patient?.name || 'Patient'} - ${apt.type}</div>
                        </div>
                        <div class="appointment-actions">
                            ${apt.status === 'scheduled' ? `
                                ${apt.type === 'video' ? `
                                    <button class="btn btn-sm btn-success" onclick="window.open('https://meet.jit.si/${roomName}','_blank')">
                                        <i class="fas fa-video"></i> Join Call
                                    </button>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="doctorCancelAppointment('${apt._id}')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            ` : `<span style="color:#64748b;font-size:0.9rem;">${apt.status.toUpperCase()}</span>`}
                        </div>
                    </div>
                    <div class="record-meta">
                        <span><strong>Reason:</strong> ${apt.reason}</span>
                        <span><strong>Status:</strong> ${apt.status}</span>
                    </div>
                </div>`;
            }).join('');
        } catch (error) {
            container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading appointments</div>`;
        }
    }

    async loadConsultations() {
        const container = document.getElementById('consultationsList');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#2c5282;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const localConsults = JSON.parse(localStorage.getItem('doctorConsultations') || '[]');

            let dbConsults = [];
            if (response.ok) {
                const data = await response.json();
                dbConsults = (data.data || []).map(apt => ({
                    id: apt._id,
                    patient: apt.patientId?.name || 'Patient',
                    date: new Date(apt.appointmentDate).toLocaleDateString(),
                    diagnosis: apt.diagnosis || '',
                    notes: apt.consultationNotes || apt.reason,
                    status: apt.status,
                    type: apt.type,
                    source: 'db'
                }));
            }

            const allConsults = [...localConsults, ...dbConsults];
            // Store in window cache so onclick can reference by index safely
            window._consultCache = allConsults;

            if (allConsults.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:#64748b;">
                        <i class="fas fa-stethoscope" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;"></i>
                        <p style="font-size:1.1rem;">No consultation records yet</p>
                        <p>Click "New Consultation" to add one</p>
                    </div>`;
                return;
            }

            container.innerHTML = allConsults.map((c, i) => `
                <div class="record-item" style="border-left-color:${c.status === 'completed' ? '#48bb78' : '#2c5282'};">
                    <div class="record-header">
                        <h4 class="record-title">
                            <i class="fas fa-user" style="color:#2c5282;margin-right:0.5rem;"></i>${c.patient}
                        </h4>
                        <span class="record-date">${c.date}</span>
                    </div>
                    <div class="record-content">
                        ${c.diagnosis ? `<p><strong>Diagnosis:</strong> ${c.diagnosis}</p>` : ''}
                        <p><strong>Notes:</strong> ${c.notes}</p>
                        ${c.type ? `<p><strong>Type:</strong> ${c.type}</p>` : ''}
                        <p><strong>Status:</strong> <span style="color:${c.status === 'completed' ? '#48bb78' : '#2c5282'};font-weight:600;">${(c.status || 'recorded').toUpperCase()}</span></p>
                    </div>
                    <div class="record-meta">
                        <button class="btn btn-sm btn-outline" onclick="viewConsultationDetail(window._consultCache[${i}])">
                            <i class="fas fa-eye"></i> View Full Record
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="downloadConsultation(window._consultCache[${i}])">
                            <i class="fas fa-download"></i> Download
                        </button>
                        ${c.source === 'db' && c.status === 'scheduled' ? `
                        <button class="btn btn-sm btn-success" onclick="markConsultationComplete('${c.id}')">
                            <i class="fas fa-check"></i> Mark Complete
                        </button>` : ''}
                    </div>
                </div>`).join('');
        } catch (error) {
            console.error('Error loading consultations:', error);
            container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading consultations</div>`;
        }
    }

    async loadPrescriptions() {
        const container = document.getElementById('prescriptionsList');
        if (!container) return;

        // Show loading
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #2c5282;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            
            if (!token) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Please log in to view prescription requests</div>';
                return;
            }

            // Fetch prescription requests from backend
            const response = await fetch(`${CONFIG.API_BASE_URL}/prescription-requests`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch prescription requests');
            }

            const data = await response.json();
            const requests = data.data || [];

            if (requests.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #64748b;">
                        <i class="fas fa-prescription-bottle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p style="font-size: 1.1rem;">No prescription requests</p>
                        <p>Patients haven't submitted any prescription requests yet</p>
                    </div>
                `;
                return;
            }

            // Display prescription requests
            container.innerHTML = requests.map(req => {
                const statusColors = {
                    pending: { color: '#fbbf24', bg: '#fffbeb', text: '⏳ PENDING' },
                    approved: { color: '#48bb78', bg: '#f0fdf4', text: '✓ APPROVED' },
                    rejected: { color: '#ef4444', bg: '#fef2f2', text: '✗ REJECTED' }
                };
                const statusStyle = statusColors[req.status] || statusColors.pending;
                
                // Get patient name from populated patientId
                const patientName = req.patientId?.name || 'Unknown Patient';

                return `
                    <div class="record-item" style="border-left-color: ${statusStyle.color}; background: ${statusStyle.bg};">
                        <div class="record-header">
                            <h4 class="record-title">
                                <i class="fas fa-prescription" style="color: ${statusStyle.color}; margin-right: 0.5rem;"></i>
                                ${patientName} - ${req.reason}
                            </h4>
                            <span class="record-date">${new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="record-content">
                            <p><strong>Patient:</strong> ${patientName}</p>
                            <p><strong>Requested Doctor:</strong> ${req.doctorName}</p>
                            <p><strong>Reason:</strong> ${req.reason}</p>
                            <p><strong>Details:</strong> ${req.details}</p>
                            ${req.currentMedications ? `<p><strong>Current Medications:</strong> ${req.currentMedications}</p>` : ''}
                            <p><strong>Contact Method:</strong> ${req.contactMethod}</p>
                            <p><strong>Status:</strong> <span style="color: ${statusStyle.color}; font-weight: 600;">${statusStyle.text}</span></p>
                        </div>
                        <div class="record-meta">
                            ${req.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" onclick="approvePrescriptionRequest('${req._id}')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="rejectPrescriptionRequest('${req._id}')">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline" onclick="viewPatientDetails('${req.patientId?._id || req.patientId}')">
                                <i class="fas fa-user"></i> View Patient
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading prescription requests:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Error loading prescription requests</p>
                    <p style="font-size: 0.9rem;">${error.message}</p>
                </div>
            `;
        }
    }
}

// Global functions for button actions
async function approvePrescriptionRequest(requestId) {
    if (!confirm('Are you sure you want to approve this prescription request?')) {
        return;
    }

    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/prescription-requests/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Prescription request approved successfully!', 'success');
            // Reload prescriptions
            if (window.doctorDashboard) {
                window.doctorDashboard.loadPrescriptions();
            }
        } else {
            throw new Error('Failed to approve prescription request');
        }
    } catch (error) {
        console.error('Error approving prescription:', error);
        showNotification('Error approving prescription request', 'error');
    }
}

async function rejectPrescriptionRequest(requestId) {
    if (!confirm('Are you sure you want to reject this prescription request?')) {
        return;
    }

    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/prescription-requests/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Prescription request rejected', 'info');
            // Reload prescriptions
            if (window.doctorDashboard) {
                window.doctorDashboard.loadPrescriptions();
            }
        } else {
            throw new Error('Failed to reject prescription request');
        }
    } catch (error) {
        console.error('Error rejecting prescription:', error);
        showNotification('Error rejecting prescription request', 'error');
    }
}

function viewPatientDetails(patientId) {
    const patient = window.doctorDashboard?.patients?.find(p => p._id === patientId);
    if (!patient) { showNotification('Patient not found', 'error'); return; }

    const existing = document.getElementById('patientDetailModal');
    if (existing) existing.remove();

    const age = patient.dateOfBirth
        ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : 'N/A';
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A';
    const allergies = patient.allergies?.join(', ') || 'None';
    const conditions = patient.medicalHistory?.map(h => h.condition).join(', ') || 'None recorded';

    const modal = document.createElement('div');
    modal.id = 'patientDetailModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-user" style="color:#2c5282;margin-right:0.5rem;"></i>${patient.name}</h3>
                <button onclick="document.getElementById('patientDetailModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Age</div>
                    <div style="font-weight:600;">${age} years</div>
                </div>
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Gender</div>
                    <div style="font-weight:600;">${patient.gender || 'N/A'}</div>
                </div>
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Blood Group</div>
                    <div style="font-weight:600;">${patient.bloodGroup || 'N/A'}</div>
                </div>
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Date of Birth</div>
                    <div style="font-weight:600;">${dob}</div>
                </div>
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Phone</div>
                    <div style="font-weight:600;">${patient.phone || 'N/A'}</div>
                </div>
                <div style="background:#f8fafc;padding:1rem;border-radius:12px;">
                    <div style="color:#64748b;font-size:0.85rem;">Allergies</div>
                    <div style="font-weight:600;">${allergies}</div>
                </div>
            </div>
            <div style="background:#f8fafc;padding:1rem;border-radius:12px;margin-bottom:1.5rem;">
                <div style="color:#64748b;font-size:0.85rem;margin-bottom:0.5rem;">Medical Conditions</div>
                <div style="font-weight:600;">${conditions}</div>
            </div>
            <div style="display:flex;gap:1rem;">
                <button class="btn btn-primary" style="flex:1;" onclick="document.getElementById('patientDetailModal').remove(); viewMedicalHistory('${patient._id}','${patient.name}')">
                    <i class="fas fa-history"></i> Medical History
                </button>
                <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('patientDetailModal').remove()">Close</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function viewMedicalHistory(patientId, patientName) {
    const existing = document.getElementById('medHistoryModal');
    if (existing) existing.remove();

    const patient = window.doctorDashboard?.patients?.find(p => p._id === patientId);
    const history = patient?.medicalHistory || [];

    const modal = document.createElement('div');
    modal.id = 'medHistoryModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-history" style="color:#2c5282;margin-right:0.5rem;"></i>Medical History - ${patientName}</h3>
                <button onclick="document.getElementById('medHistoryModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            ${history.length > 0 ? history.map(h => `
                <div style="background:#f8fafc;border-radius:12px;padding:1rem;margin-bottom:1rem;border-left:4px solid #2c5282;">
                    <div style="font-weight:600;color:#2c3748;">${h.condition}</div>
                    ${h.diagnosedDate ? `<div style="color:#64748b;font-size:0.9rem;">Diagnosed: ${new Date(h.diagnosedDate).toLocaleDateString()}</div>` : ''}
                    ${h.notes ? `<div style="color:#4a5568;margin-top:0.5rem;">${h.notes}</div>` : ''}
                </div>`).join('') : `
                <div style="text-align:center;padding:2rem;color:#64748b;">
                    <i class="fas fa-notes-medical" style="font-size:2rem;margin-bottom:1rem;opacity:0.5;"></i>
                    <p>No medical history recorded</p>
                </div>`}
            <button class="btn btn-outline" style="width:100%;margin-top:1rem;" onclick="document.getElementById('medHistoryModal').remove()">Close</button>
        </div>`;
    document.body.appendChild(modal);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Placeholder functions for other buttons
function addAppointment() {
    // Remove existing modal if any
    const existing = document.getElementById('addAppointmentModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'addAppointmentModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-calendar-plus" style="color:#2c5282;margin-right:0.5rem;"></i>Add Appointment</h3>
                <button onclick="document.getElementById('addAppointmentModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            <form id="addAppointmentForm">
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Patient Name</label>
                    <input type="text" id="newAptPatient" required placeholder="Enter patient name" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Date</label>
                    <input type="date" id="newAptDate" required min="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Time</label>
                    <select id="newAptTime" required style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                        <option value="">Select time...</option>
                        ${['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'].map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Type</label>
                    <select id="newAptType" required style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                        <option value="video">Video Consultation</option>
                        <option value="in-person">In-Person</option>
                        <option value="phone">Phone Call</option>
                    </select>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Notes</label>
                    <textarea id="newAptNotes" rows="3" placeholder="Any notes..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;resize:vertical;"></textarea>
                </div>
                <button type="submit" style="width:100%;padding:1rem;background:linear-gradient(135deg,#2c5282,#2a4365);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">
                    <i class="fas fa-calendar-check"></i> Add Appointment
                </button>
            </form>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('addAppointmentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const patient = document.getElementById('newAptPatient').value;
        const date = document.getElementById('newAptDate').value;
        const time = document.getElementById('newAptTime').value;
        const type = document.getElementById('newAptType').value;

        // Add to today's schedule display
        const scheduleContainer = document.getElementById('todaySchedule');
        const newItem = document.createElement('div');
        newItem.className = 'appointment-item appointment-scheduled';
        const roomId = 'sehat-setu-' + Math.random().toString(36).substr(2, 8);
        newItem.innerHTML = `
            <div class="appointment-header">
                <div>
                    <div class="appointment-time">${time}</div>
                    <div class="appointment-patient">${patient} - ${type === 'video' ? 'Video Consultation' : type}</div>
                </div>
                <div class="appointment-actions">
                    ${type === 'video' ? `<button class="btn btn-sm btn-success" onclick="startVideoCall('${roomId}')"><i class="fas fa-video"></i> Start</button>` : ''}
                </div>
            </div>`;
        scheduleContainer.appendChild(newItem);

        document.getElementById('addAppointmentModal').remove();
        showNotification(`Appointment added for ${patient} on ${date} at ${time}`, 'success');
    });
}

function startVideoCall(roomId) {
    const doctorName = encodeURIComponent(localStorage.getItem('userName') || 'Doctor');
    const room = roomId.startsWith('sehat-setu-') ? roomId : 'sehat-setu-' + roomId;
    const url = `https://meet.jit.si/${room}#userInfo.displayName="Dr. ${doctorName}"`;
    window.open(url, '_blank');
    showNotification('Opening video call room...', 'success');
}

function exportPatientList() {
    const patients = window.doctorDashboard?.patients || [];
    if (patients.length === 0) { showNotification('No patients to export', 'info'); return; }

    const csv = ['Name,Age,Gender,Blood Group,Phone,Conditions'].concat(
        patients.map(p => {
            const age = p.dateOfBirth ? Math.floor((new Date() - new Date(p.dateOfBirth)) / (365.25*24*60*60*1000)) : '';
            const conditions = p.medicalHistory?.map(h => h.condition).join('; ') || '';
            return `"${p.name}","${age}","${p.gender||''}","${p.bloodGroup||''}","${p.phone||''}","${conditions}"`;
        })
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Patient list exported!', 'success');
}

function addNewPatient() {
    showNotification('Patients register themselves via the patient portal', 'info');
}

function scheduleAppointment() {
    // Doctors can't book appointments directly - patients do that
    // But doctors can add notes/reminders
    showNotification('Patients book appointments from their dashboard. Use "Add Appointment" on the main dashboard to add a manual slot.', 'info');
}

function newConsultation() {
    const existing = document.getElementById('newConsultModal');
    if (existing) existing.remove();

    // Get patients list for dropdown
    const patients = window.doctorDashboard?.patients || [];
    const patientOptions = patients.length > 0
        ? patients.map(p => `<option value="${p.name}">${p.name}</option>`).join('')
        : '<option value="">Type patient name below</option>';

    const modal = document.createElement('div');
    modal.id = 'newConsultModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-stethoscope" style="color:#2c5282;margin-right:0.5rem;"></i>New Consultation</h3>
                <button onclick="document.getElementById('newConsultModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            <form id="newConsultForm">
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Patient Name</label>
                    ${patients.length > 0
                        ? `<select id="consultPatient" required style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                            <option value="">Select patient...</option>
                            ${patientOptions}
                           </select>`
                        : `<input type="text" id="consultPatient" required placeholder="Enter patient name" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">`
                    }
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Date</label>
                    <input type="date" id="consultDate" required value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Diagnosis</label>
                    <input type="text" id="consultDiagnosis" required placeholder="e.g. Hypertension, Diabetes..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Symptoms</label>
                    <input type="text" id="consultSymptoms" placeholder="e.g. Headache, fever, fatigue..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Prescription / Treatment</label>
                    <input type="text" id="consultPrescription" placeholder="e.g. Paracetamol 500mg twice daily..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Consultation Notes</label>
                    <textarea id="consultNotes" required rows="4" placeholder="Detailed notes about the consultation..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;resize:vertical;"></textarea>
                </div>
                <button type="submit" style="width:100%;padding:1rem;background:linear-gradient(135deg,#2c5282,#2a4365);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">
                    <i class="fas fa-save"></i> Save Consultation
                </button>
            </form>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('newConsultForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const consult = {
            id: Date.now().toString(),
            patient: document.getElementById('consultPatient').value,
            date: document.getElementById('consultDate').value,
            diagnosis: document.getElementById('consultDiagnosis').value,
            symptoms: document.getElementById('consultSymptoms').value,
            prescription: document.getElementById('consultPrescription').value,
            notes: document.getElementById('consultNotes').value,
            status: 'completed',
            source: 'local',
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        const existing = JSON.parse(localStorage.getItem('doctorConsultations') || '[]');
        existing.unshift(consult);
        localStorage.setItem('doctorConsultations', JSON.stringify(existing));

        document.getElementById('newConsultModal').remove();
        showNotification('Consultation saved successfully!', 'success');
        window.doctorDashboard.loadConsultations();
    });
}

function viewConsultationDetail(consult) {
    const existing = document.getElementById('consultDetailModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'consultDetailModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:550px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-file-medical" style="color:#2c5282;margin-right:0.5rem;"></i>Consultation Record</h3>
                <button onclick="document.getElementById('consultDetailModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:1.5rem;margin-bottom:1rem;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div><div style="color:#64748b;font-size:0.85rem;">Patient</div><div style="font-weight:600;">${consult.patient}</div></div>
                    <div><div style="color:#64748b;font-size:0.85rem;">Date</div><div style="font-weight:600;">${consult.date}</div></div>
                    ${consult.diagnosis ? `<div style="grid-column:1/-1;"><div style="color:#64748b;font-size:0.85rem;">Diagnosis</div><div style="font-weight:600;">${consult.diagnosis}</div></div>` : ''}
                    ${consult.symptoms ? `<div style="grid-column:1/-1;"><div style="color:#64748b;font-size:0.85rem;">Symptoms</div><div style="font-weight:600;">${consult.symptoms}</div></div>` : ''}
                    ${consult.prescription ? `<div style="grid-column:1/-1;"><div style="color:#64748b;font-size:0.85rem;">Prescription</div><div style="font-weight:600;">${consult.prescription}</div></div>` : ''}
                    <div style="grid-column:1/-1;"><div style="color:#64748b;font-size:0.85rem;">Notes</div><div style="font-weight:600;">${consult.notes}</div></div>
                </div>
            </div>
            <div style="display:flex;gap:1rem;">
                <button class="btn btn-primary" style="flex:1;" onclick="downloadConsultation(${JSON.stringify(consult).replace(/"/g, '&quot;')}); document.getElementById('consultDetailModal').remove();">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-outline" style="flex:1;" onclick="document.getElementById('consultDetailModal').remove()">Close</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function downloadConsultation(consult) {
    const doctorName = localStorage.getItem('userName') || 'Doctor';
    const content = `SEHAT SETU - CONSULTATION RECORD
=====================================
Doctor: Dr. ${doctorName}
Patient: ${consult.patient}
Date: ${consult.date}
-------------------------------------
Diagnosis: ${consult.diagnosis || 'N/A'}
Symptoms: ${consult.symptoms || 'N/A'}
Prescription: ${consult.prescription || 'N/A'}
Notes: ${consult.notes}
Status: ${(consult.status || 'completed').toUpperCase()}
=====================================
Generated: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation-${consult.patient.replace(/\s+/g,'-')}-${consult.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Consultation record downloaded!', 'success');
}

async function markConsultationComplete(appointmentId) {
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        if (response.ok) {
            showNotification('Consultation marked as complete!', 'success');
            window.doctorDashboard.loadConsultations();
        }
    } catch (e) {
        showNotification('Error updating consultation', 'error');
    }
}

function createPrescription() {
    const existing = document.getElementById('createPrescModal');
    if (existing) existing.remove();

    const patients = window.doctorDashboard?.patients || [];
    const patientOptions = patients.length > 0
        ? patients.map(p => `<option value="${p._id || p.id}">${p.name}</option>`).join('')
        : '<option value="">No patients loaded</option>';

    const modal = document.createElement('div');
    modal.id = 'createPrescModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:520px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;font-size:1.4rem;"><i class="fas fa-prescription" style="color:#2c5282;margin-right:0.5rem;"></i>Create Prescription</h3>
                <button onclick="document.getElementById('createPrescModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
            </div>
            <form id="createPrescForm">
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Patient</label>
                    ${patients.length > 0
                        ? `<select id="prescPatient" required style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                            <option value="">Select patient...</option>${patientOptions}</select>`
                        : `<input type="text" id="prescPatient" required placeholder="Patient name" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">`
                    }
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Medication Name</label>
                    <input type="text" id="prescMedication" required placeholder="e.g. Paracetamol 500mg" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Dosage</label>
                        <input type="text" id="prescDosage" required placeholder="e.g. 1 tablet" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Frequency</label>
                        <select id="prescFrequency" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                            <option>Once daily</option>
                            <option>Twice daily</option>
                            <option>Three times daily</option>
                            <option>As needed</option>
                        </select>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Duration</label>
                        <input type="text" id="prescDuration" placeholder="e.g. 7 days" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                    </div>
                    <div>
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Date</label>
                        <input type="date" id="prescDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                    </div>
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;margin-bottom:0.5rem;font-weight:500;">Instructions / Notes</label>
                    <textarea id="prescInstructions" rows="3" placeholder="Special instructions, warnings, etc." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;resize:vertical;"></textarea>
                </div>
                <div style="display:flex;gap:1rem;">
                    <button type="submit" style="flex:1;padding:1rem;background:linear-gradient(135deg,#2c5282,#2a4365);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">
                        <i class="fas fa-save"></i> Save & Download
                    </button>
                    <button type="button" onclick="document.getElementById('createPrescModal').remove()" style="flex:1;padding:1rem;border:2px solid #2c5282;color:#2c5282;background:transparent;border-radius:12px;font-size:1rem;cursor:pointer;">Cancel</button>
                </div>
            </form>
        </div>`;
    document.body.appendChild(modal);

    document.getElementById('createPrescForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const doctorName = localStorage.getItem('userName') || 'Doctor';
        const patientEl = document.getElementById('prescPatient');
        const patientName = patientEl.tagName === 'SELECT'
            ? patientEl.options[patientEl.selectedIndex]?.text || patientEl.value
            : patientEl.value;

        const content = `SEHAT SETU - PRESCRIPTION
=====================================
Doctor: Dr. ${doctorName}
Patient: ${patientName}
Date: ${document.getElementById('prescDate').value}
-------------------------------------
Medication: ${document.getElementById('prescMedication').value}
Dosage: ${document.getElementById('prescDosage').value}
Frequency: ${document.getElementById('prescFrequency').value}
Duration: ${document.getElementById('prescDuration').value || 'As directed'}
Instructions: ${document.getElementById('prescInstructions').value || 'None'}
=====================================
Generated: ${new Date().toLocaleString()}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${patientName.replace(/\s+/g,'-')}-${document.getElementById('prescDate').value}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        document.getElementById('createPrescModal').remove();
        showNotification('Prescription created and downloaded!', 'success');
    });
}

async function downloadReport() {
    const token = localStorage.getItem('userToken');
    const doctorName = localStorage.getItem('userName') || 'Doctor';

    try {
        // Fetch appointments for the report
        const response = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.ok ? await response.json() : { data: [] };
        const appointments = data.data || [];

        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        const scheduled = appointments.filter(a => a.status === 'scheduled').length;
        const cancelled = appointments.filter(a => a.status === 'cancelled').length;

        const content = `SEHAT SETU - PRACTICE ANALYTICS REPORT
=====================================
Doctor: Dr. ${doctorName}
Generated: ${new Date().toLocaleString()}
=====================================

APPOINTMENT SUMMARY
-------------------
Total Appointments: ${total}
Completed: ${completed}
Scheduled (Upcoming): ${scheduled}
Cancelled: ${cancelled}
Completion Rate: ${total > 0 ? Math.round((completed/total)*100) : 0}%

RECENT APPOINTMENTS
-------------------
${appointments.slice(0, 10).map(a =>
    `${new Date(a.appointmentDate).toLocaleDateString()} | ${a.appointmentTime} | ${a.patientId?.name || 'Patient'} | ${a.status.toUpperCase()}`
).join('\n') || 'No appointments found'}

=====================================
Report generated by Sehat Setu`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `practice-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Report downloaded!', 'success');
    } catch (e) {
        showNotification('Error generating report', 'error');
    }
}

async function updateDoctorProfile() {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    const body = {
        name: document.getElementById('profileName')?.value,
        phone: document.getElementById('profilePhone')?.value,
        licenseNumber: document.getElementById('profileLicense')?.value,
        specialty: document.getElementById('profileSpecialty')?.value,
        experience: document.getElementById('profileExperience')?.value,
        clinicAddress: document.getElementById('profileAddress')?.value,
        bio: document.getElementById('profileBio')?.value
    };

    // Remove empty fields
    Object.keys(body).forEach(k => { if (!body[k]) delete body[k]; });

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (response.ok) {
            showNotification('Profile updated successfully!', 'success');
            // Update header display
            if (body.name) {
                document.getElementById('doctorName').textContent = body.name;
                localStorage.setItem('userName', body.name);
            }
            if (body.specialty) document.getElementById('doctorSpecialty').textContent = body.specialty;
        } else {
            const err = await response.json();
            showNotification(err.message || 'Failed to update profile', 'error');
        }
    } catch (e) {
        showNotification('Error updating profile', 'error');
    }
}

async function doctorCancelAppointment(appointmentId) {
    if (!confirm('Cancel this appointment?')) return;
    try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${CONFIG.API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            showNotification('Appointment cancelled', 'success');
            window.doctorDashboard.loadAppointments();
        }
    } catch (e) {
        showNotification('Error cancelling appointment', 'error');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.doctorDashboard = new DoctorDashboard();
});

