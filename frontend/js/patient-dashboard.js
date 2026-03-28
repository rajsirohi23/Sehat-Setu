// Patient Dashboard JavaScript
// Handles all patient dashboard functionality

class PatientDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.healthMetrics = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupNavigation();
        this.setupEventListeners();
        this.loadHealthMetrics();
        this.loadDashboardData();
    }

    loadUserData() {
        // Get user data from localStorage (set during login)
        const userName = localStorage.getItem('userName');
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');

        // If no user data, redirect to login
        if (!userName || !userId) {
            console.log('No user data found, fetching from API...');
            this.fetchUserProfile();
            return;
        }

        // Update UI with user data
        document.getElementById('welcomeMessage').textContent = `Welcome back, ${userName}!`;
        document.getElementById('patientName').textContent = userName;
        document.getElementById('patientId').textContent = `ID: ${userId.substring(0, 8)}`;
        
        // Set avatar initial
        const initial = userName.charAt(0).toUpperCase();
        document.getElementById('userAvatar').textContent = initial;

        // Load profile data
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').value = userName;
            document.getElementById('profileEmail').value = userEmail || '';
        }
    }

    async fetchUserProfile() {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.user.profile;
                
                // Save to localStorage
                localStorage.setItem('userName', profile.name);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userEmail', data.user.email);
                
                // Update UI
                this.loadUserData();
                
                // Load complete profile data into form
                this.loadProfileData(profile, data.user.email);
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            window.location.href = 'login.html';
        }
    }

    loadProfileData(profile, email) {
        console.log('Loading profile data:', profile);
        
        // Populate profile form fields
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').value = profile.name || '';
            document.getElementById('profileEmail').value = email || '';
            document.getElementById('profilePhone').value = profile.phone || '';
            
            console.log('Phone:', profile.phone);
            console.log('DOB:', profile.dateOfBirth);
            console.log('Gender:', profile.gender);
            console.log('Blood Group:', profile.bloodGroup);
            
            // Date of birth
            if (profile.dateOfBirth) {
                const dob = new Date(profile.dateOfBirth);
                const formattedDate = dob.toISOString().split('T')[0];
                document.getElementById('profileDOB').value = formattedDate;
                console.log('Formatted DOB:', formattedDate);
            }
            
            // Gender
            if (profile.gender) {
                document.getElementById('profileGender').value = profile.gender;
            }
            
            // Blood Group
            if (profile.bloodGroup) {
                document.getElementById('profileBloodGroup').value = profile.bloodGroup;
            }
            
            // Emergency Contact
            if (profile.emergencyContact) {
                const emergencyInput = document.getElementById('profileEmergencyContact');
                if (emergencyInput) {
                    emergencyInput.value = profile.emergencyContact.phone || '';
                }
            }
            
            // Medical Conditions
            if (profile.medicalHistory && profile.medicalHistory.length > 0) {
                const conditions = profile.medicalHistory.map(h => h.condition).join(', ');
                const medicalConditionsInput = document.getElementById('profileMedicalConditions');
                if (medicalConditionsInput) {
                    medicalConditionsInput.value = conditions;
                }
            }
            
            // Allergies
            if (profile.allergies && profile.allergies.length > 0) {
                const allergiesInput = document.getElementById('profileAllergies');
                if (allergiesInput) {
                    allergiesInput.value = profile.allergies.join(', ');
                }
            }
        } else {
            console.log('Profile form not found - user might not be on profile page yet');
        }
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
            case 'medical-records':
                this.loadMedicalRecords();
                break;
            case 'prescriptions':
                this.loadPrescriptions();
                break;
            case 'documents':
                this.loadDocuments();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'profile':
                // Reload profile data when switching to profile section
                this.fetchUserProfile();
                break;
        }
    }

    setupEventListeners() {
        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // File upload
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }

        // Drag and drop
        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                this.handleFileUpload(e.dataTransfer.files);
            });
        }
    }

    loadHealthMetrics() {
        // Load from localStorage first (instant display)
        const savedMetrics = localStorage.getItem('healthMetrics');
        if (savedMetrics) {
            this.healthMetrics = JSON.parse(savedMetrics);
            this.renderHealthMetrics();
        } else {
            // Default metrics
            this.healthMetrics = [
                { type: 'weight', value: '70', unit: 'kg', label: 'Weight', color: '#4facfe' },
                { type: 'bloodPressure', value: '120/80', unit: '', label: 'Blood Pressure', color: '#43e97b' },
                { type: 'heartRate', value: '72', unit: 'bpm', label: 'Heart Rate', color: '#fa709a' },
                { type: 'temperature', value: '120', unit: '°F', label: 'Temperature', color: '#fee140' },
                { type: 'bloodSugar', value: '95', unit: 'mg/dL', label: 'Blood Sugar', color: '#30cfd0' },
                { type: 'bmi', value: '23.5', unit: '', label: 'BMI', color: '#a8edea' }
            ];
            this.renderHealthMetrics();
        }

        // Then sync with database
        this.syncHealthMetricsFromDB();
    }

    async syncHealthMetricsFromDB() {
        try {
            const token = localStorage.getItem('userToken');
            if (!token) return;

            const response = await fetch(`${CONFIG.API_BASE_URL}/health-metrics/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    // Update metrics with database data
                    data.data.forEach(dbMetric => {
                        const index = this.healthMetrics.findIndex(m => m.type === dbMetric.type);
                        if (index >= 0) {
                            this.healthMetrics[index] = {
                                type: dbMetric.type,
                                value: dbMetric.value,
                                unit: dbMetric.unit,
                                label: dbMetric.label,
                                color: dbMetric.color
                            };
                        } else {
                            this.healthMetrics.push({
                                type: dbMetric.type,
                                value: dbMetric.value,
                                unit: dbMetric.unit,
                                label: dbMetric.label,
                                color: dbMetric.color
                            });
                        }
                    });
                    
                    // Update localStorage
                    localStorage.setItem('healthMetrics', JSON.stringify(this.healthMetrics));
                    
                    // Re-render
                    this.renderHealthMetrics();
                }
            }
        } catch (error) {
            console.error('Error syncing health metrics:', error);
            // Continue with localStorage data
        }
    }

    renderHealthMetrics() {
        const container = document.getElementById('healthMetrics');
        if (!container) return;

        container.innerHTML = this.healthMetrics.map(metric => `
            <div class="metric-card" style="background: linear-gradient(135deg, ${metric.color} 0%, ${this.adjustColor(metric.color, -20)} 100%);">
                <div class="metric-value">${metric.value} ${metric.unit}</div>
                <div class="metric-label">${metric.label}</div>
            </div>
        `).join('');
    }

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    loadDashboardData() {
        // Load stats
        const stats = {
            consultations: 12,
            prescriptions: 8,
            documents: 15,
            nextAppointment: '2 days'
        };

        if (document.getElementById('consultationCount')) {
            document.getElementById('consultationCount').textContent = stats.consultations;
            document.getElementById('prescriptionCount').textContent = stats.prescriptions;
            document.getElementById('documentCount').textContent = stats.documents;
            document.getElementById('nextAppointment').textContent = stats.nextAppointment;
        }

        // Load recent activities
        this.loadRecentActivities();
    }

    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        const activities = [
            { icon: 'user-md', title: 'Consultation with Dr. Smith', date: '2 days ago', type: 'consultation' },
            { icon: 'pills', title: 'New prescription added', date: '3 days ago', type: 'prescription' },
            { icon: 'file-upload', title: 'Lab report uploaded', date: '5 days ago', type: 'document' },
            { icon: 'calendar-check', title: 'Appointment scheduled', date: '1 week ago', type: 'appointment' }
        ];

        container.innerHTML = activities.map(activity => `
            <div class="record-item">
                <div class="record-header">
                    <h4 class="record-title">
                        <i class="fas fa-${activity.icon}" style="margin-right: 0.5rem; color: #667eea;"></i>
                        ${activity.title}
                    </h4>
                    <span class="record-date">${activity.date}</span>
                </div>
            </div>
        `).join('');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        // Store in history for context
        if (!this._chatHistory) this._chatHistory = [];
        this._chatHistory.push({ role: 'user', text: message });

        this._getAIReply(message);
    }

    async _getAIReply(message) {
        const token = localStorage.getItem('userToken');

        // Show typing indicator
        const container = document.getElementById('chatMessages');
        const typingId = 'typing-' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div id="${typingId}" class="message bot-message" style="display:flex;align-items:flex-start;gap:0.75rem;margin-bottom:1rem;">
                <div class="message-avatar bot-avatar" style="flex-shrink:0;"><i class="fas fa-robot"></i></div>
                <div class="message-content" style="background:#f1f5f9;border-radius:12px;padding:0.75rem 1rem;">
                    <span style="display:inline-flex;gap:4px;align-items:center;">
                        <span style="width:7px;height:7px;background:#667eea;border-radius:50%;animation:bounce 1s infinite;"></span>
                        <span style="width:7px;height:7px;background:#667eea;border-radius:50%;animation:bounce 1s infinite 0.2s;"></span>
                        <span style="width:7px;height:7px;background:#667eea;border-radius:50%;animation:bounce 1s infinite 0.4s;"></span>
                    </span>
                </div>
            </div>`);
        container.scrollTop = container.scrollHeight;

        // Inject bounce animation if not present
        if (!document.getElementById('bounceStyle')) {
            const style = document.createElement('style');
            style.id = 'bounceStyle';
            style.textContent = '@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}';
            document.head.appendChild(style);
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: this._chatHistory.slice(-10) })
            });

            const data = await response.json();
            document.getElementById(typingId)?.remove();

            if (data.status === 'success') {
                this._chatHistory.push({ role: 'model', text: data.reply });
                this.addChatMessage(data.reply, 'bot');
            } else {
                this.addChatMessage(data.message || 'Sorry, something went wrong. Please try again.', 'bot');
            }
        } catch (err) {
            document.getElementById(typingId)?.remove();
            this.addChatMessage('Unable to connect to AI service. Please check your connection and try again.', 'bot');
        }
    }

    addChatMessage(message, sender) {
        const container = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const messageHTML = `
            <div class="message ${sender}">
                <div class="message-avatar ${sender === 'bot' ? 'bot-avatar' : 'user-avatar'}">
                    <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
                </div>
                <div class="message-content">
                    <p>${message}</p>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', messageHTML);
        container.scrollTop = container.scrollHeight;
    }

    // AI responses handled by _getAIReply via Gemini API

    async loadMedicalRecords() {
        const container = document.getElementById('medicalHistory');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#667eea;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            // Pull completed appointments as medical records
            let records = [];
            if (token) {
                const res = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    records = (data.data || []).filter(a => a.status === 'completed' || a.diagnosis);
                }
            }

            // Also include locally saved consultation records
            const userId = localStorage.getItem('userId') || 'guest';
            const localRecords = JSON.parse(localStorage.getItem(`medRecords_${userId}`) || '[]');
            window._medRecordCache = [...localRecords, ...records];

            if (window._medRecordCache.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:#64748b;">
                        <i class="fas fa-file-medical" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;"></i>
                        <p style="font-size:1.1rem;">No medical records yet</p>
                        <p>Records appear here after completed consultations</p>
                        <button class="btn btn-outline" style="margin-top:1rem;" onclick="addManualRecord()">
                            <i class="fas fa-plus"></i> Add Record Manually
                        </button>
                    </div>`;
                return;
            }

            container.innerHTML = window._medRecordCache.map((r, i) => {
                const isDb = !!r._id;
                const title = isDb ? `Consultation - Dr. ${r.doctorId?.name || 'Doctor'}` : r.title;
                const date = isDb ? new Date(r.appointmentDate).toLocaleDateString() : r.date;
                const doctor = isDb ? `Dr. ${r.doctorId?.name || 'Unknown'}` : r.doctor;
                const diagnosis = isDb ? (r.diagnosis || r.reason) : r.diagnosis;
                const notes = isDb ? (r.consultationNotes || r.reason) : r.notes;
                return `
                <div class="record-item">
                    <div class="record-header">
                        <h4 class="record-title">${title}</h4>
                        <span class="record-date">${date}</span>
                    </div>
                    <div class="record-content">
                        <p><strong>Doctor:</strong> ${doctor}</p>
                        <p><strong>Diagnosis:</strong> ${diagnosis || 'N/A'}</p>
                        <p><strong>Notes:</strong> ${notes || 'N/A'}</p>
                    </div>
                    <div class="record-meta">
                        <button class="btn btn-outline" onclick="downloadMedicalRecord(${i})">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-outline" onclick="shareMedicalRecord(${i})">
                            <i class="fas fa-share"></i> Share
                        </button>
                        ${!isDb ? `<button class="btn btn-danger" style="padding:0.5rem 1rem;" onclick="deleteManualRecord(${i})"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>`;
            }).join('') + `
            <div style="margin-top:1.5rem;">
                <button class="btn btn-outline" onclick="addManualRecord()">
                    <i class="fas fa-plus"></i> Add Record Manually
                </button>
            </div>`;
        } catch (err) {
            container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;">Error loading records</div>`;
        }
    }

    async loadPrescriptions() {
        const container = document.getElementById('prescriptionsList');
        if (!container) return;

        // Show loading
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #667eea;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            
            // Fetch prescription requests from backend
            let requests = [];
            if (token) {
                const response = await fetch(`${CONFIG.API_BASE_URL}/prescription-requests`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    requests = data.data || [];
                }
            }

            // Static prescriptions (in production, these would also come from backend)
            const prescriptions = [
                {
                    id: 'rx_001',
                    type: 'prescription',
                    medication: 'Amoxicillin 500mg',
                    dosage: '1 tablet',
                    frequency: '3 times daily',
                    duration: '7 days',
                    doctor: 'Dr. Sarah Johnson',
                    date: '2024-01-15',
                    status: 'active',
                    instructions: 'Take with food. Complete the full course even if symptoms improve.'
                },
                {
                    id: 'rx_002',
                    type: 'prescription',
                    medication: 'Ibuprofen 400mg',
                    dosage: '1 tablet',
                    frequency: 'As needed',
                    duration: '14 days',
                    doctor: 'Dr. Michael Chen',
                    date: '2023-12-10',
                    status: 'completed',
                    instructions: 'Take with food or milk. Do not exceed 3 tablets per day.'
                }
            ];

            // Convert backend requests to display format
            const formattedRequests = requests.map(req => ({
                id: req._id,
                type: 'request',
                doctor: req.doctorName,
                reason: req.reason,
                details: req.details,
                currentMeds: req.currentMedications,
                contact: req.contactMethod,
                requestDate: req.createdAt,
                status: req.status
            }));

            // Combine and sort
            const allItems = [...formattedRequests, ...prescriptions].sort((a, b) => {
                const dateA = new Date(a.requestDate || a.date);
                const dateB = new Date(b.requestDate || b.date);
                return dateB - dateA;
            });

            // Populate cache so downloadPrescription/printPrescription can find items by id
            window._prescriptionCache = allItems.map(item => ({ ...item, id: item.id || item._id }));

            if (allItems.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #64748b;">
                        <i class="fas fa-prescription-bottle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p style="font-size: 1.1rem;">No prescriptions yet</p>
                        <p>Click "Request Prescription" to get started</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = allItems.map(item => {
                if (item.type === 'request') {
                    const statusColors = {
                        pending: { color: '#fbbf24', bg: '#fffbeb', text: '⏳ PENDING APPROVAL' },
                        approved: { color: '#48bb78', bg: '#f0fdf4', text: '✓ APPROVED' },
                        rejected: { color: '#ef4444', bg: '#fef2f2', text: '✗ REJECTED' },
                        cancelled: { color: '#94a3b8', bg: '#f8fafc', text: '⊘ CANCELLED' }
                    };
                    const statusStyle = statusColors[item.status] || statusColors.pending;

                    return `
                        <div class="record-item" style="border-left-color: ${statusStyle.color}; background: ${statusStyle.bg};">
                            <div class="record-header">
                                <h4 class="record-title">
                                    <i class="fas fa-clock" style="color: ${statusStyle.color}; margin-right: 0.5rem;"></i>
                                    Prescription Request - ${item.reason}
                                </h4>
                                <span class="record-date">${new Date(item.requestDate).toLocaleDateString()}</span>
                            </div>
                            <div class="record-content">
                                <p><strong>Requested from:</strong> ${item.doctor}</p>
                                <p><strong>Reason:</strong> ${item.reason}</p>
                                <p><strong>Details:</strong> ${item.details}</p>
                                ${item.currentMeds ? `<p><strong>Current Medications:</strong> ${item.currentMeds}</p>` : ''}
                                <p><strong>Contact via:</strong> ${item.contact}</p>
                                <p><strong>Status:</strong> <span style="color: ${statusStyle.color}; font-weight: 600;">${statusStyle.text}</span></p>
                            </div>
                            <div class="record-meta">
                                ${item.status === 'pending' ? `
                                    <button class="btn btn-outline" onclick="cancelPrescriptionRequest('${item.id}')" style="border-color: #ef4444; color: #ef4444;">
                                        <i class="fas fa-times"></i> Cancel Request
                                    </button>
                                    <span style="color: #64748b; font-size: 0.9rem;">
                                        <i class="fas fa-info-circle"></i> Doctor will review soon
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="record-item" style="border-left-color: ${item.status === 'active' ? '#48bb78' : '#cbd5e1'};">
                            <div class="record-header">
                                <h4 class="record-title">${item.medication}</h4>
                                <span class="record-date">${new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <div class="record-content">
                                <p><strong>Dosage:</strong> ${item.dosage} ${item.frequency}</p>
                                <p><strong>Duration:</strong> ${item.duration}</p>
                                <p><strong>Prescribed by:</strong> ${item.doctor}</p>
                                <p><strong>Instructions:</strong> ${item.instructions}</p>
                                <p><strong>Status:</strong> <span style="color: ${item.status === 'active' ? '#48bb78' : '#64748b'}; font-weight: 600;">${item.status.toUpperCase()}</span></p>
                            </div>
                            <div class="record-meta">
                                <button class="btn btn-outline" onclick="downloadPrescription('${item.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn btn-outline" onclick="printPrescription('${item.id}')">
                                    <i class="fas fa-print"></i> Print
                                </button>
                            </div>
                        </div>
                    `;
                }
            }).join('');
        } catch (error) {
            console.error('Error loading prescriptions:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Error loading prescriptions</p>
                </div>
            `;
        }
    }

    _getDocStorageKey() {
        const userId = localStorage.getItem('userId') || 'guest';
        return `patientDocs_${userId}`;
    }

    _getDocs() {
        return JSON.parse(localStorage.getItem(this._getDocStorageKey()) || '[]');
    }

    _saveDocs(docs) {
        localStorage.setItem(this._getDocStorageKey(), JSON.stringify(docs));
    }

    _getFileIcon(mimeType, name) {
        if (mimeType.startsWith('image/')) return 'fa-file-image';
        if (mimeType.startsWith('video/')) return 'fa-file-video';
        if (mimeType.startsWith('audio/')) return 'fa-file-audio';
        if (mimeType === 'application/pdf' || name.endsWith('.pdf')) return 'fa-file-pdf';
        if (mimeType.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return 'fa-file-word';
        if (mimeType.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'fa-file-excel';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'fa-file-archive';
        return 'fa-file-alt';
    }

    _formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    loadDocuments() {
        const container = document.getElementById('uploadedFiles');
        if (!container) return;

        const docs = this._getDocs();
        window._docCache = docs;

        if (docs.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#64748b;">
                    <i class="fas fa-folder-open" style="font-size:3rem;margin-bottom:1rem;opacity:0.4;"></i>
                    <p style="font-size:1.1rem;">No documents uploaded yet</p>
                    <p>Use the upload area above to add files</p>
                </div>`;
            return;
        }

        container.innerHTML = docs.map((doc, i) => `
            <div class="file-item" id="doc-item-${i}">
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas ${this._getFileIcon(doc.mimeType, doc.name)}"></i>
                    </div>
                    <div class="file-details">
                        <h4>${doc.name}</h4>
                        <p>${this._formatSize(doc.size)} • ${doc.date}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-outline" title="Download" onclick="dashboard.downloadDocument(${i})">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-outline" title="View" onclick="dashboard.viewDocument(${i})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger" title="Delete" onclick="dashboard.deleteDocument(${i})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadAppointments() {
        const container = document.getElementById('appointmentsList');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#667eea;"></i></div>';

        try {
            const token = localStorage.getItem('userToken');
            let appointments = [];

            if (token) {
                const response = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    appointments = data.data || [];
                }
            }

            if (appointments.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:3rem;color:#64748b;">
                        <i class="fas fa-calendar-times" style="font-size:3rem;margin-bottom:1rem;opacity:0.5;"></i>
                        <p style="font-size:1.1rem;">No appointments yet</p>
                        <p>Click "Book Appointment" to schedule one</p>
                    </div>`;
                return;
            }

            const statusColors = {
                scheduled: '#48bb78',
                completed: '#667eea',
                cancelled: '#ef4444',
                'no-show': '#f59e0b'
            };

            container.innerHTML = appointments.map(apt => {
                const doctor = apt.doctorId;
                const color = statusColors[apt.status] || '#667eea';
                const aptDate = new Date(apt.appointmentDate);
                return `
                    <div class="record-item" style="border-left-color:${color};">
                        <div class="record-header">
                            <h4 class="record-title">
                                <i class="fas fa-user-md" style="margin-right:0.5rem;color:${color};"></i>
                                Dr. ${doctor?.name || 'Unknown'}
                            </h4>
                            <span class="record-date">${aptDate.toLocaleDateString()} at ${apt.appointmentTime}</span>
                        </div>
                        <div class="record-content">
                            <p><strong>Specialty:</strong> ${doctor?.specialty || 'General Medicine'}</p>
                            <p><strong>Type:</strong> ${apt.type === 'video' ? 'Video Consultation' : apt.type === 'in-person' ? 'In-Person' : 'Phone'}</p>
                            <p><strong>Reason:</strong> ${apt.reason}</p>
                            <p><strong>Status:</strong> <span style="color:${color};font-weight:600;">${apt.status.toUpperCase()}</span></p>
                        </div>
                        <div class="record-meta">
                            ${apt.status === 'scheduled' ? `
                                <button class="btn btn-outline" onclick="rescheduleAppointment('${apt._id}')">
                                    <i class="fas fa-calendar"></i> Reschedule
                                </button>
                                <button class="btn btn-danger" onclick="cancelAppointment('${apt._id}')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                                ${apt.type === 'video' ? `<button class="btn btn-success" onclick="joinVideoCall('${apt._id}')"><i class="fas fa-video"></i> Join Call</button>` : ''}
                            ` : ''}
                        </div>
                    </div>`;
            }).join('');
        } catch (error) {
            console.error('Error loading appointments:', error);
            container.innerHTML = `<div style="text-align:center;padding:2rem;color:#ef4444;"><i class="fas fa-exclamation-triangle"></i> Error loading appointments</div>`;
        }
    }

    handleFileUpload(files) {
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB per file
        const docs = this._getDocs();
        let uploaded = 0;

        Array.from(files).forEach(file => {
            if (file.size > MAX_SIZE) {
                this.showNotification(`${file.name} exceeds 50MB limit`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                docs.unshift({
                    name: file.name,
                    size: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    date: new Date().toLocaleDateString(),
                    dataUrl: e.target.result
                });
                this._saveDocs(docs);
                uploaded++;
                this.showNotification(`${file.name} uploaded successfully!`, 'success');
                this.loadDocuments();
            };
            reader.onerror = () => {
                this.showNotification(`Failed to read ${file.name}`, 'error');
            };
            reader.readAsDataURL(file);
        });
    }

    downloadDocument(index) {
        const docs = this._getDocs();
        const doc = docs[index];
        if (!doc) return;
        const a = document.createElement('a');
        a.href = doc.dataUrl;
        a.download = doc.name;
        a.click();
        this.showNotification(`Downloading ${doc.name}...`, 'info');
    }

    viewDocument(index) {
        const docs = this._getDocs();
        const doc = docs[index];
        if (!doc) return;

        // For images and PDFs, open in a modal viewer; others trigger download
        if (doc.mimeType.startsWith('image/') || doc.mimeType === 'application/pdf') {
            const existing = document.getElementById('docViewerModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'docViewerModal';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;padding:1rem;';
            modal.innerHTML = `
                <div style="width:100%;max-width:900px;background:white;border-radius:16px;overflow:hidden;max-height:90vh;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid #e2e8f0;flex-shrink:0;">
                        <span style="font-weight:600;color:#2c3748;font-size:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70%;">${doc.name}</span>
                        <div style="display:flex;gap:0.75rem;">
                            <button onclick="dashboard.downloadDocument(${index})" style="padding:0.5rem 1rem;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;">
                                <i class="fas fa-download"></i> Download
                            </button>
                            <button onclick="document.getElementById('docViewerModal').remove()" style="padding:0.5rem 1rem;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                    <div style="flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;background:#f8fafc;min-height:300px;">
                        ${doc.mimeType.startsWith('image/')
                            ? `<img src="${doc.dataUrl}" style="max-width:100%;max-height:75vh;object-fit:contain;" alt="${doc.name}">`
                            : `<iframe src="${doc.dataUrl}" style="width:100%;height:75vh;border:none;"></iframe>`
                        }
                    </div>
                </div>`;
            document.body.appendChild(modal);
            // Close on backdrop click
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        } else if (doc.mimeType.startsWith('video/')) {
            const existing = document.getElementById('docViewerModal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'docViewerModal';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10000;padding:1rem;';
            modal.innerHTML = `
                <div style="width:100%;max-width:800px;background:white;border-radius:16px;overflow:hidden;">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;border-bottom:1px solid #e2e8f0;">
                        <span style="font-weight:600;color:#2c3748;">${doc.name}</span>
                        <button onclick="document.getElementById('docViewerModal').remove()" style="padding:0.5rem 1rem;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                    <div style="padding:1rem;background:#000;">
                        <video controls style="width:100%;max-height:60vh;" src="${doc.dataUrl}"></video>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        } else {
            // For other file types, just download
            this.downloadDocument(index);
            this.showNotification(`Opening ${doc.name}...`, 'info');
        }
    }

    deleteDocument(index) {
        const docs = this._getDocs();
        const doc = docs[index];
        if (!doc) return;
        if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return;
        docs.splice(index, 1);
        this._saveDocs(docs);
        this.showNotification(`${doc.name} deleted`, 'success');
        this.loadDocuments();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // (downloadDocument, viewDocument, deleteDocument are defined above in the documents section)

    async rescheduleAppointment(appointmentId) {
        // Remove existing modal if any
        const existing = document.getElementById('rescheduleModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'rescheduleModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
        modal.innerHTML = `
            <div style="background:white;border-radius:20px;padding:2rem;max-width:400px;width:90%;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="color:#2d3748;font-size:1.3rem;"><i class="fas fa-calendar-alt" style="color:#667eea;margin-right:0.5rem;"></i>Reschedule Appointment</h3>
                    <button onclick="document.getElementById('rescheduleModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#64748b;">×</button>
                </div>
                <form id="rescheduleForm">
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">New Date</label>
                        <input type="date" id="newAptDate" required min="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;margin-bottom:0.5rem;font-weight:500;">New Time</label>
                        <select id="newAptTime" required style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;">
                            <option value="">Select time...</option>
                            ${['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM'].map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" style="width:100%;padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">
                        <i class="fas fa-calendar-check"></i> Confirm Reschedule
                    </button>
                </form>
            </div>`;
        document.body.appendChild(modal);

        document.getElementById('rescheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newDate = document.getElementById('newAptDate').value;
            const newTime = document.getElementById('newAptTime').value;
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(`${CONFIG.API_BASE_URL}/appointments/${appointmentId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appointmentDate: newDate, appointmentTime: newTime })
                });
                if (response.ok) {
                    document.getElementById('rescheduleModal').remove();
                    this.showNotification('Appointment rescheduled successfully!', 'success');
                    this.loadAppointments();
                } else {
                    this.showNotification('Error rescheduling appointment', 'error');
                }
            } catch (error) {
                this.showNotification('Error rescheduling appointment', 'error');
            }
        });
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch(`${CONFIG.API_BASE_URL}/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                this.showNotification('Appointment cancelled successfully', 'success');
                this.loadAppointments();
            } else {
                this.showNotification('Error cancelling appointment', 'error');
            }
        } catch (error) {
            this.showNotification('Error cancelling appointment', 'error');
        }
    }
}

// Add Reading Modal Functions
function showAddMetricModal() {
    const modal = document.createElement('div');
    modal.id = 'addMetricModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #2c3748;">Add Health Reading</h2>
                <button onclick="closeAddMetricModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="addMetricForm" onsubmit="saveHealthMetric(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Metric Type</label>
                    <select id="metricType" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                        <option value="">Select metric type</option>
                        <option value="weight">Weight (kg)</option>
                        <option value="bloodPressure">Blood Pressure</option>
                        <option value="heartRate">Heart Rate (bpm)</option>
                        <option value="temperature">Temperature (°F)</option>
                        <option value="bloodSugar">Blood Sugar (mg/dL)</option>
                        <option value="bmi">BMI</option>
                        <option value="oxygen">Oxygen Level (%)</option>
                        <option value="cholesterol">Cholesterol (mg/dL)</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Value</label>
                    <input type="text" id="metricValue" required placeholder="Enter value (e.g., 70 or 120/80)" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Date & Time</label>
                    <input type="datetime-local" id="metricDate" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Notes (Optional)</label>
                    <textarea id="metricNotes" rows="3" placeholder="Add any additional notes..." style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="closeAddMetricModal()" style="flex: 1; padding: 0.875rem; border: 2px solid #667eea; color: #667eea; background: transparent; border-radius: 12px; font-weight: 500; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" style="flex: 1; padding: 0.875rem; border: none; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 12px; font-weight: 500; cursor: pointer;">
                        <i class="fas fa-save"></i> Save Reading
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Set current date/time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('metricDate').value = now.toISOString().slice(0, 16);
}

function closeAddMetricModal() {
    const modal = document.getElementById('addMetricModal');
    if (modal) {
        modal.remove();
    }
}

function saveHealthMetric(event) {
    event.preventDefault();

    const type = document.getElementById('metricType').value;
    const value = document.getElementById('metricValue').value;
    const date = document.getElementById('metricDate').value;
    const notes = document.getElementById('metricNotes').value;

    const metricLabels = {
        weight: { label: 'Weight', unit: 'kg', color: '#4facfe' },
        bloodPressure: { label: 'Blood Pressure', unit: '', color: '#43e97b' },
        heartRate: { label: 'Heart Rate', unit: 'bpm', color: '#fa709a' },
        temperature: { label: 'Temperature', unit: '°F', color: '#fee140' },
        bloodSugar: { label: 'Blood Sugar', unit: 'mg/dL', color: '#30cfd0' },
        bmi: { label: 'BMI', unit: '', color: '#a8edea' },
        oxygen: { label: 'Oxygen Level', unit: '%', color: '#38f9d7' },
        cholesterol: { label: 'Cholesterol', unit: 'mg/dL', color: '#4facfe' }
    };

    const metricInfo = metricLabels[type];
    
    const metricData = {
        type,
        value,
        unit: metricInfo.unit,
        label: metricInfo.label,
        color: metricInfo.color,
        date,
        notes
    };

    // Save to localStorage first (instant)
    const existingIndex = dashboard.healthMetrics.findIndex(m => m.type === type);
    
    if (existingIndex >= 0) {
        dashboard.healthMetrics[existingIndex] = metricData;
    } else {
        dashboard.healthMetrics.push(metricData);
    }

    localStorage.setItem('healthMetrics', JSON.stringify(dashboard.healthMetrics));
    dashboard.renderHealthMetrics();

    // Then save to database (persistent)
    saveHealthMetricToDB(metricData);

    dashboard.showNotification(`${metricInfo.label} reading added successfully!`, 'success');
    closeAddMetricModal();
}

async function saveHealthMetricToDB(metricData) {
    try {
        const token = localStorage.getItem('userToken');
        if (!token) {
            console.log('No token, skipping database save');
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/health-metrics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: metricData.type,
                value: metricData.value,
                unit: metricData.unit,
                label: metricData.label,
                color: metricData.color,
                notes: metricData.notes,
                recordedAt: metricData.date
            })
        });

        if (response.ok) {
            console.log('Health metric saved to database successfully');
        } else {
            console.error('Failed to save to database, but saved locally');
        }
    } catch (error) {
        console.error('Error saving to database:', error);
        // Data is still saved in localStorage
    }
}

// Global functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

function downloadMedicalRecord(index) {
    const cache = window._medRecordCache || [];
    const r = cache[index];
    if (!r) return;

    const userName = localStorage.getItem('userName') || 'Patient';
    const isDb = !!r._id;
    const title = isDb ? `Consultation - Dr. ${r.doctorId?.name || 'Doctor'}` : r.title;
    const date = isDb ? new Date(r.appointmentDate).toLocaleDateString() : r.date;
    const doctor = isDb ? `Dr. ${r.doctorId?.name || 'Unknown'}` : r.doctor;
    const diagnosis = isDb ? (r.diagnosis || r.reason) : r.diagnosis;
    const notes = isDb ? (r.consultationNotes || r.reason) : r.notes;

    const content = `SEHAT SETU - MEDICAL RECORD
=====================================
Patient: ${userName}
Generated: ${new Date().toLocaleString()}
=====================================
Title: ${title}
Date: ${date}
Doctor: ${doctor}
Diagnosis: ${diagnosis || 'N/A'}
Notes: ${notes || 'N/A'}
=====================================
Sehat Setu - Unified Health Records`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${(title || 'record').replace(/\s+/g, '-')}-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    dashboard.showNotification('Medical record downloaded!', 'success');
}
function shareMedicalRecord(index) {
    const cache = window._medRecordCache || [];
    const r = cache[index];
    if (!r) return;
    const isDb = !!r._id;
    const title = isDb ? `Consultation - Dr. ${r.doctorId?.name || 'Doctor'}` : r.title;
    const text = `Medical Record: ${title}\nPatient: ${localStorage.getItem('userName') || 'Patient'}\nFrom: Sehat Setu`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => dashboard.showNotification('Record info copied to clipboard!', 'success'));
    } else {
        dashboard.showNotification('Share: ' + title, 'info');
    }
}

function addManualRecord() {
    const existing = document.getElementById('addRecordModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'addRecordModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;border-radius:20px;padding:2rem;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                <h3 style="color:#2c3748;"><i class="fas fa-file-medical" style="color:#667eea;margin-right:0.5rem;"></i>Add Medical Record</h3>
                <button onclick="document.getElementById('addRecordModal').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;">×</button>
            </div>
            <form id="addRecordForm">
                <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.5rem;font-weight:500;">Title</label>
                <input type="text" id="recTitle" required placeholder="e.g. Annual Checkup" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;"></div>
                <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.5rem;font-weight:500;">Date</label>
                <input type="date" id="recDate" required value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;"></div>
                <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.5rem;font-weight:500;">Doctor</label>
                <input type="text" id="recDoctor" placeholder="Doctor name" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;"></div>
                <div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:0.5rem;font-weight:500;">Diagnosis</label>
                <input type="text" id="recDiagnosis" placeholder="Diagnosis" style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;"></div>
                <div style="margin-bottom:1.5rem;"><label style="display:block;margin-bottom:0.5rem;font-weight:500;">Notes</label>
                <textarea id="recNotes" rows="3" placeholder="Additional notes..." style="width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:12px;font-size:1rem;resize:vertical;"></textarea></div>
                <button type="submit" style="width:100%;padding:1rem;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;">Save Record</button>
            </form>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('addRecordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = localStorage.getItem('userId') || 'guest';
        const key = `medRecords_${userId}`;
        const records = JSON.parse(localStorage.getItem(key) || '[]');
        records.unshift({
            title: document.getElementById('recTitle').value,
            date: document.getElementById('recDate').value,
            doctor: document.getElementById('recDoctor').value,
            diagnosis: document.getElementById('recDiagnosis').value,
            notes: document.getElementById('recNotes').value
        });
        localStorage.setItem(key, JSON.stringify(records));
        document.getElementById('addRecordModal').remove();
        dashboard.showNotification('Record saved!', 'success');
        dashboard.loadMedicalRecords();
    });
}

function deleteManualRecord(index) {
    const cache = window._medRecordCache || [];
    const r = cache[index];
    if (!r || r._id) return; // don't delete DB records
    if (!confirm('Delete this record?')) return;
    const userId = localStorage.getItem('userId') || 'guest';
    const key = `medRecords_${userId}`;
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = records.findIndex(rec => rec.title === r.title && rec.date === r.date);
    if (idx > -1) records.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(records));
    dashboard.showNotification('Record deleted', 'success');
    dashboard.loadMedicalRecords();
}

function downloadPrescription(prescriptionId) {
    // Find from the rendered list cache
    const cache = window._prescriptionCache || [];
    const rx = cache.find(p => p.id === prescriptionId);
    if (!rx) { dashboard.showNotification('Prescription not found', 'error'); return; }
    const userName = localStorage.getItem('userName') || 'Patient';
    const content = `SEHAT SETU - PRESCRIPTION
=====================================
Patient: ${userName}
Date: ${rx.date || new Date(rx.requestDate).toLocaleDateString()}
Doctor: ${rx.doctor}
=====================================
Medication: ${rx.medication || rx.reason}
Dosage: ${rx.dosage || 'As prescribed'}
Frequency: ${rx.frequency || 'As directed'}
Duration: ${rx.duration || 'As directed'}
Instructions: ${rx.instructions || rx.details || 'Follow doctor advice'}
Status: ${(rx.status || '').toUpperCase()}
=====================================
Generated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${(rx.medication || rx.reason || 'rx').replace(/\s+/g,'-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    dashboard.showNotification('Prescription downloaded!', 'success');
}

function printPrescription(prescriptionId) {
    const cache = window._prescriptionCache || [];
    const rx = cache.find(p => p.id === prescriptionId);
    if (!rx) { dashboard.showNotification('Prescription not found', 'error'); return; }
    const userName = localStorage.getItem('userName') || 'Patient';
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Prescription</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;}
    h1{color:#667eea;text-align:center;} .section{background:#f8fafc;padding:1rem;border-radius:8px;margin:1rem 0;}
    @media print{.no-print{display:none}}</style></head><body>
    <h1>SEHAT SETU</h1><p style="text-align:center;color:#64748b;">Prescription</p>
    <div class="section"><strong>Patient:</strong> ${userName}<br>
    <strong>Doctor:</strong> ${rx.doctor}<br>
    <strong>Date:</strong> ${rx.date || new Date(rx.requestDate).toLocaleDateString()}</div>
    <div class="section"><strong>Medication:</strong> ${rx.medication || rx.reason}<br>
    <strong>Dosage:</strong> ${rx.dosage || 'As prescribed'}<br>
    <strong>Frequency:</strong> ${rx.frequency || 'As directed'}<br>
    <strong>Duration:</strong> ${rx.duration || 'As directed'}<br>
    <strong>Instructions:</strong> ${rx.instructions || rx.details || 'Follow doctor advice'}</div>
    <button class="no-print" onclick="window.print()" style="padding:0.75rem 2rem;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">Print</button>
    </body></html>`);
    w.document.close();
    dashboard.showNotification('Opening print preview...', 'info');
}

function cancelPrescriptionRequest(requestId) {
    if (!confirm('Cancel this prescription request?')) return;
    const token = localStorage.getItem('userToken');
    fetch(`${CONFIG.API_BASE_URL}/prescription-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => {
        if (r.ok) {
            dashboard.showNotification('Request cancelled', 'success');
            dashboard.loadPrescriptions();
        } else {
            dashboard.showNotification('Could not cancel request', 'error');
        }
    }).catch(() => dashboard.showNotification('Error cancelling request', 'error'));
}
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = `
            <div class="message">
                <div class="message-avatar bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Hello! I'm your AI health assistant. How can I help you today?</p>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
        dashboard._chatHistory = [];
        dashboard.showNotification('Chat history cleared', 'success');
    }
}

function exportChatHistory() {
    const history = dashboard._chatHistory || [];
    if (history.length === 0) {
        dashboard.showNotification('No chat history to export', 'info');
        return;
    }
    const userName = localStorage.getItem('userName') || 'Patient';
    const lines = [`SEHAT SETU - AI Health Assistant Chat\n=====================================\nPatient: ${userName}\nDate: ${new Date().toLocaleString()}\n=====================================\n`];
    history.forEach(msg => {
        lines.push(`${msg.role === 'user' ? 'You' : 'AI Assistant'}: ${msg.text}\n`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    dashboard.showNotification('Chat exported!', 'success');
}

function generateHealthReport() {
    dashboard.showNotification('Generating health report...', 'info');
    
    // Get user data
    const userName = localStorage.getItem('userName') || 'Patient';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userId = localStorage.getItem('userId') || '';
    
    // Get health metrics
    const healthMetrics = dashboard.healthMetrics || [];
    
    // Create report content
    const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const reportContent = `
SEHAT SETU - HEALTH REPORT
Generated on: ${reportDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${userName}
Email: ${userEmail}
Patient ID: ${userId.substring(0, 8)}
Report Date: ${reportDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT HEALTH METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${healthMetrics.map(metric => `${metric.label}: ${metric.value} ${metric.unit}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEDICAL HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Annual Health Checkup (15/1/2024)
   Doctor: Dr. Sarah Johnson
   Diagnosis: Overall health is good. Blood pressure slightly elevated.
   Notes: Recommended lifestyle changes and follow-up in 3 months.

2. Flu Consultation (10/12/2023)
   Doctor: Dr. Michael Chen
   Diagnosis: Seasonal influenza
   Notes: Prescribed antiviral medication and rest.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report is generated from Sehat Setu health records system.
For medical advice, please consult with a qualified healthcare provider.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sehat Setu - Unified Health Records & Consultation Hub
www.sehatsetu.com | support@sehatsetu.com
    `.trim();
    
    // Download the report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sehat_Setu_Health_Report_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    dashboard.showNotification('Health report generated and downloaded successfully!', 'success');
}

function requestPrescription() {
    // Show modal for prescription request
    const modal = document.createElement('div');
    modal.id = 'prescriptionRequestModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #2c3748;">Request Prescription</h2>
                <button onclick="closePrescriptionModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="prescriptionRequestForm" onsubmit="submitPrescriptionRequest(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Select Doctor</label>
                    <select id="prescriptionDoctor" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                        <option value="">Choose a doctor</option>
                        <option value="Dr. Sarah Johnson">Dr. Sarah Johnson - General Medicine</option>
                        <option value="Dr. Michael Chen">Dr. Michael Chen - Cardiology</option>
                        <option value="Dr. Emily Davis">Dr. Emily Davis - Dermatology</option>
                        <option value="Dr. James Wilson">Dr. James Wilson - Pediatrics</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Reason for Prescription</label>
                    <select id="prescriptionReason" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                        <option value="">Select reason</option>
                        <option value="Refill existing medication">Refill existing medication</option>
                        <option value="New symptoms">New symptoms</option>
                        <option value="Follow-up treatment">Follow-up treatment</option>
                        <option value="Chronic condition management">Chronic condition management</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Symptoms / Details</label>
                    <textarea id="prescriptionDetails" required rows="4" placeholder="Describe your symptoms or reason for prescription request..." style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Current Medications (if any)</label>
                    <textarea id="prescriptionCurrentMeds" rows="2" placeholder="List any medications you're currently taking..." style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3748;">Preferred Contact Method</label>
                    <select id="prescriptionContact" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 1rem;">
                        <option value="email">Email</option>
                        <option value="phone">Phone Call</option>
                        <option value="sms">SMS</option>
                        <option value="app">In-App Notification</option>
                    </select>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="closePrescriptionModal()" style="flex: 1; padding: 0.875rem; border: 2px solid #667eea; color: #667eea; background: transparent; border-radius: 12px; font-weight: 500; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" style="flex: 1; padding: 0.875rem; border: none; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 12px; font-weight: 500; cursor: pointer;">
                        <i class="fas fa-paper-plane"></i> Submit Request
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

function closePrescriptionModal() {
    const modal = document.getElementById('prescriptionRequestModal');
    if (modal) {
        modal.remove();
    }
}

async function submitPrescriptionRequest(event) {
    event.preventDefault();
    
    const doctor = document.getElementById('prescriptionDoctor').value;
    const reason = document.getElementById('prescriptionReason').value;
    const details = document.getElementById('prescriptionDetails').value;
    const currentMeds = document.getElementById('prescriptionCurrentMeds').value;
    const contact = document.getElementById('prescriptionContact').value;
    
    try {
        const token = localStorage.getItem('userToken');
        if (!token) {
            dashboard.showNotification('Please login again', 'error');
            return;
        }

        // Send to backend API
        const response = await fetch(`${CONFIG.API_BASE_URL}/prescription-requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctorName: doctor,
                reason: reason,
                details: details,
                currentMedications: currentMeds,
                contactMethod: contact
            })
        });

        const data = await response.json();

        if (response.ok) {
            closePrescriptionModal();
            dashboard.showNotification(`Prescription request sent to ${doctor}. You will be contacted via ${contact}.`, 'success');
            
            // Reload prescriptions to show new request
            setTimeout(() => {
                dashboard.loadPrescriptions();
            }, 500);
        } else {
            dashboard.showNotification(data.message || 'Failed to submit request', 'error');
        }
    } catch (error) {
        console.error('Error submitting prescription request:', error);
        dashboard.showNotification('Error submitting request. Please try again.', 'error');
    }
}

function viewAllDocuments() {
    dashboard.showNotification('Opening document viewer...', 'info');
}

function uploadBulkDocuments() {
    const input = document.getElementById('fileInput');
    input.accept = '*/*';
    input.multiple = true;
    input.click();
}

function bookAppointment() {
    dashboard.showNotification('Appointment booking feature coming soon!', 'info');
}

async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const dob = document.getElementById('profileDOB').value;
    const gender = document.getElementById('profileGender').value;
    const bloodGroup = document.getElementById('profileBloodGroup').value;

    // Validate required fields
    if (!name || !email) {
        dashboard.showNotification('Name and email are required', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('userToken');
        if (!token) {
            dashboard.showNotification('Please login again', 'error');
            return;
        }

        // Update patient profile via API
        const response = await fetch(`${CONFIG.API_BASE_URL}/patients/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                phone,
                dateOfBirth: dob,
                gender,
                bloodGroup
            })
        });

        if (response.ok) {
            // Update localStorage
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            if (phone) localStorage.setItem('userPhone', phone);

            dashboard.showNotification('Profile updated successfully!', 'success');
            dashboard.loadUserData();
        } else {
            const data = await response.json();
            dashboard.showNotification(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        dashboard.showNotification('Error updating profile. Please try again.', 'error');
    }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('userToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    dashboard = new PatientDashboard();
});


