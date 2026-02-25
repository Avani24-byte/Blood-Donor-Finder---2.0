// authentication state
let authToken = null;
// whether current user is an admin (controls adminNav and hidden admin section)
let isAdmin = false;
// admin role is handled in separate owner/admin panel; index page treats all users the same
let manualMode = false; // true when user signed in with name+phone without a valid JWT

// owner/admin dashboard token (separate from regular user auth)
let adminToken = null;

// determine API base URL (so that fetch works when static files are served via
// Live Server on a different port). If current origin is not port 3000 we assume
// the backend lives at http://localhost:3000.
const API_BASE = (function() {
    const loc = window.location;
    const isLocalHost = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
    // If on a non-3000 port (e.g., Live Server on 5500), connect to backend on 3000
    if (isLocalHost && loc.port && loc.port !== '3000') {
        return 'http://localhost:3000';
    }
    // If on port 3000 or no port (file protocol), requests are relative to current origin
    return '';
})();

function apiFetch(path, opts) {
    const fullUrl = API_BASE + path;
    console.log(`[API] Fetching: ${fullUrl}`);
    return fetch(fullUrl, opts);
}

// Data will now be stored on the backend; frontend fetches it via API
let donors = {};
let localDonorsCache = []; // donors added when backend unavailable
let currentInstitution = null;
let currentFilter = 'All';
let searchQuery = '';

// localStorage helpers
function saveCache() {
    try { localStorage.setItem('donorCache', JSON.stringify(localDonorsCache)); } catch {}
}
function loadCache() {
    try { const v = localStorage.getItem('donorCache'); if (v) localDonorsCache = JSON.parse(v); } catch {}
}

// build headers for fetch calls; skip Authorization when in manual mode or no token
function authHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (authToken && !manualMode) headers['Authorization'] = 'Bearer ' + authToken;
    return headers;
}

// add donor to local data structure and re‑render lists
function addLocalDonor(donor) {
    // record in cache so we can reapply after fresh loads
    localDonorsCache.push(donor);
    saveCache();
    if (!donors[donor.institution]) donors[donor.institution] = [];
    donors[donor.institution].push(donor);
    renderLists();
}

// Google credential callback (called by GSI)
async function handleCredentialResponse(response) {
    try {
        const res = await apiFetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        authToken = data.token;
        isAdmin = !!data.isAdmin;
        localStorage.setItem('authToken', authToken);
        showDashboard();
    } catch (err) {
        console.error('login error', err);
        alert('Login failed: ' + err.message);
    }
}

// manual sign‑in (name + phone number)
async function manualSignIn() {
    const name = document.getElementById('manualName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const msgDiv = document.getElementById('manualLoginMsg');
    msgDiv.textContent = '';

    if (!name || !phone) {
        msgDiv.textContent = 'Please provide both name and phone number';
        msgDiv.className = 'message error';
        return;
    }
    // basic phone validation – digits, optional +, 6–15 characters
    if (!/^\+?[0-9]{6,15}$/.test(phone)) {
        msgDiv.textContent = 'Phone number format is invalid';
        msgDiv.className = 'message error';
        return;
    }

    // try contacting backend; if that fails we'll fall back to offline mode
    try {
        const res = await apiFetch('/api/auth/manual', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ name, phone })
        });
        const data = await res.json();
        if (res.ok && data.token) {
            authToken = data.token;
            isAdmin = !!data.isAdmin;
            manualMode = false;
            localStorage.setItem('authToken', authToken);
            showDashboard();
            return;
        } else {
            throw new Error(data.error || 'Authentication failed');
        }
    } catch (err) {
        console.warn('manual sign-in backend error:', err);
        // offline/unauthorized path
        manualMode = true;
        authToken = null;
        isAdmin = false;
        localStorage.removeItem('authToken');
        localStorage.setItem('manualMode','true');
        msgDiv.textContent = 'Working offline – not authenticated';
        msgDiv.className = 'message';
        showDashboard();
    }
}

// check for existing token or offline flag on page load
function initAuth() {
    loadCache();
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        // if looks like a JWT try decode, otherwise ignore
        if (token.split('.').length === 3) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                isAdmin = !!payload.isAdmin;
            } catch (e) {
                console.warn('invalid stored JWT, clearing');
                localStorage.removeItem('authToken');
                authToken = null;
                return;
            }
        } else {
            authToken = null;
        }
    }
    // manual flag persisted as well
    if (!authToken && localStorage.getItem('manualMode') === 'true') {
        manualMode = true;
    }
    // Do not auto-navigate to the dashboard here. We want the sign-in
    // page to appear first on site open so users can actively authenticate.
}

async function showDashboard() {
    // require some form of sign‑in to move forward
    if (!authToken && !manualMode) {
        alert('Unable to show dashboard: no authentication token');
        return;
    }
    // reveal navigation
    document.querySelector('nav').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'block';
    // show admin tools link if user has admin privileges
    document.getElementById('adminNav').style.display = isAdmin ? 'inline-block' : 'none';
    // hide login section and show home
    document.getElementById('login').style.display = 'none';
    document.getElementById('home').style.display = '';
    try { await loadDonors(); } catch {}
    showSection('home');
}

function logout() {
    authToken = null;
    isAdmin = false;
    manualMode = false;
    localStorage.removeItem('authToken');
    localStorage.removeItem('manualMode');
    localStorage.removeItem('donorCache');
    document.querySelector('nav').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('adminNav').style.display = 'none';
    // Ensure the site returns to the main sign-in page after logout
    document.getElementById('login').style.display = '';
    showSection('login');
    // also tell Google to forget auto select
    if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }
}

// Show/hide sections
function showSection(sectionId) {
    console.log('Navigating to:', sectionId);
    // Prevent access to certain sections unless authenticated
    const protectedSections = new Set(['home','register','lists','admin','ownerPanel','institutionDetails']);
    if (protectedSections.has(sectionId) && !(authToken || manualMode)) {
        alert('Please sign in first to access that page.');
        showSection('login');
        return;
    }
    // Smoothly transition between sections
    const allSections = document.querySelectorAll('.content-section');
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.error('Section not found:', sectionId);
        return;
    }

    // Find currently visible section (if any) and hide it with transition
    const currentlyVisible = Array.from(allSections).find(s => s.style.display !== 'none' && s !== targetSection);
    if (currentlyVisible) {
        // remove showing so CSS transition runs
        currentlyVisible.classList.remove('showing');
        currentlyVisible.classList.remove('active');
        // after transition ends, set display none
        setTimeout(() => {
            if (currentlyVisible) currentlyVisible.style.display = 'none';
        }, 320);
    }

    // Prepare and show target section with transition
    // If already visible, ensure classes are correct
    if (targetSection.style.display === 'block') {
        // already visible — ensure showing class present
        targetSection.classList.add('showing');
        targetSection.classList.add('active');
    } else {
        targetSection.style.display = 'block';
        // force reflow so transition can start
        void targetSection.offsetWidth;
        targetSection.classList.add('showing');
        targetSection.classList.add('active');
    }
    console.log('Showed section:', sectionId);
    
    // Manage navigation and logout button
    const nav = document.querySelector('nav');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (sectionId === 'ownerPanel') {
        // In owner panel: hide main nav
        if (nav) nav.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    } else {
        // In all other sections: show nav
        if (nav) nav.style.display = 'flex';
        // Only show logout button if user is logged in
        if (logoutBtn) {
            logoutBtn.style.display = (authToken || manualMode) ? 'block' : 'none';
        }
    }

    // Render dynamic content when sections become visible
    if (sectionId === 'lists') {
        renderLists();
    } else if (sectionId === 'institutionDetails') {
        renderInstitutionDetails();
    } else if (sectionId === 'ownerPanel') {
        // Show login form when opening owner panel
        if (document.getElementById('loginForm')) {
            document.getElementById('loginForm').style.display = 'block';
        }
        if (document.getElementById('ownerDashboard')) {
            document.getElementById('ownerDashboard').style.display = 'none';
        }
        if (document.getElementById('setupStatusContainer')) {
            document.getElementById('setupStatusContainer').style.display = 'none';
        }
    }
}


// Register a new donor
async function registerDonor(e) {
    e.preventDefault();
    
    const institution = document.getElementById('institution').value.trim();
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const bloodGroup = document.getElementById('bloodGroup').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const address = document.getElementById('address').value.trim();
    
    // Validation
    if (!institution || !name || !age || !bloodGroup || !contact || !address) {
        showMessage('registerMessage', 'Please fill all fields', 'error');
        return;
    }
    
    if (age < 17) {
        showMessage('registerMessage', 'Age must be at least 17', 'error');
        return;
    }

    try {
        // Get current institutions from localStorage
        let institutions = JSON.parse(localStorage.getItem('bloodDonorInstitutions') || '[]');
        
        // Find if institution exists
        let inst = institutions.find(i => i.name === institution);
        
        if (!inst) {
            // Create new institution
            inst = {
                id: Math.max(...institutions.map(i => i.id), 0) + 1,
                name: institution,
                donors: []
            };
            institutions.push(inst);
        }
        
        // Add new donor to institution
        const newDonor = {
            id: Math.max(...inst.donors.map(d => d.id), 0) + 1,
            name,
            age: parseInt(age),
            bloodGroup,
            contact,
            address
        };
        
        inst.donors.push(newDonor);
        
        // Save to localStorage
        localStorage.setItem('bloodDonorInstitutions', JSON.stringify(institutions));
        
        showMessage('registerMessage', '✓ Donor registered successfully!', 'success');
        
        // Reset form
        document.getElementById('registerForm').reset();
        
        // Reload donors
        await loadDonors();
        
    } catch (err) {
        console.error('Registration error:', err);
        showMessage('registerMessage', '❌ Error: ' + err.message, 'error');
    }
}
document.getElementById('registerForm').addEventListener('submit', registerDonor);

// Show message helper
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'message ' + type;
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 4000);
    }
}

// Search functionality
function searchDonors() {
    searchQuery = document.getElementById('searchBar').value.toLowerCase().trim();
    renderLists();
}

// Render the donor lists with search filter
function renderLists() {
    const listsDiv = document.getElementById('donorLists');
    const emptyState = document.getElementById('emptyState');
    listsDiv.innerHTML = '';
    
    let foundAny = false;
    
    for (const institution in donors) {
        // Filter institutions by search query
        const institutionMatch = institution.toLowerCase().includes(searchQuery);
        
        // Filter students within institution by search query
        let studentsMatch = [];
        if (searchQuery) {
            studentsMatch = donors[institution].filter(student => 
                student.name.toLowerCase().includes(searchQuery)
            );
        } else {
            studentsMatch = donors[institution];
        }
        
        // Show institution if it matches or if any students match
        if (institutionMatch || studentsMatch.length > 0) {
            foundAny = true;
            const instDiv = document.createElement('div');
            instDiv.className = 'institution';
            
            const instHeader = document.createElement('h3');
            instHeader.textContent = `${institution} (${studentsMatch.length} donor${studentsMatch.length !== 1 ? 's' : ''})`;
            instHeader.onclick = () => viewInstitution(institution);
            instDiv.appendChild(instHeader);
            
            listsDiv.appendChild(instDiv);
        }
    }
    
    // Show empty state if no results
    if (!foundAny) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

// Navigate to institution details
function viewInstitution(institution) {
    currentInstitution = institution;
    currentFilter = 'All';
    showSection('institutionDetails');
}

// Render institution details with filters and donors
function renderInstitutionDetails() {
    if (!currentInstitution) return;
    
    document.getElementById('detailsTitle').textContent = `Registered Donors - ${currentInstitution}`;
    
    // Render blood group filters
    const filtersDiv = document.getElementById('bloodGroupFilters');
    filtersDiv.innerHTML = '';
    const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    bloodGroups.forEach(group => {
        const block = document.createElement('div');
        block.className = 'blood-group-block';
        if (group === currentFilter) block.classList.add('active');
        block.textContent = group;
        block.onclick = () => filterStudents(group);
        filtersDiv.appendChild(block);
    });
    
    // Render donor list (filtered)
    const studentListDiv = document.getElementById('studentList');
    const emptyStudents = document.getElementById('emptyStudents');
    
    studentListDiv.innerHTML = '';
    
    const students = donors[currentInstitution].filter(student => 
        currentFilter === 'All' || student.bloodGroup === currentFilter
    );
    
    if (students.length === 0) {
        emptyStudents.style.display = 'block';
        return;
    } else {
        emptyStudents.style.display = 'none';
    }
    
    students.forEach((student, index) => {
        const studentDiv = document.createElement('div');
        studentDiv.className = 'student';
        let inner = `
            <div class="student-info">
                <div class="student-header">
                    <span class="student-name">${student.name}</span>
                    <span class="student-blood-group">${student.bloodGroup}</span>
                </div>
                <div class="student-details">
                    <p><strong>Age:</strong> ${student.age}</p>
                    <p><strong>Contact:</strong> ${student.contact}</p>
                    <p><strong>Address:</strong> ${student.address}</p>
                </div>
            </div>
        `;
        studentDiv.innerHTML = inner;
        studentListDiv.appendChild(studentDiv);
    });
}

// Filter students by blood group
function filterStudents(bloodGroup) {
    currentFilter = bloodGroup;
    renderInstitutionDetails();
}

// Add a new institution
async function addInstitution() {
    const institution = prompt('Enter new institution name:');
    if (institution && institution.trim()) {
        const trimmedInst = institution.trim();
        try {
            const res = await apiFetch('/api/institutions', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name: trimmedInst })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Unable to add');
            }
            alert(`Institution "${trimmedInst}" added successfully!`);
            await loadDonors();
            renderLists();
        } catch (err) {
            // offline / unauthorized: keep institution locally so user can still add donors later
            alert(err.message + ' (added locally)');
            if (!donors[trimmedInst]) {
                donors[trimmedInst] = [];
                renderLists();
            }
        }
    }
}



// Clear search functionality
function clearSearch() {
    document.getElementById('searchBar').value = '';
    searchQuery = '';
    renderLists();
}

// Initialize with home section
// helper to load donors from backend
async function loadDonors() {
    try {
        // Load from localStorage (offline mode)
        const institutions = JSON.parse(localStorage.getItem('bloodDonorInstitutions') || '[]');
        
        // Convert institutions format to donors object format
        // Expected format: { "Institution Name": [donor1, donor2, ...], ... }
        donors = {};
        
        institutions.forEach(inst => {
            if (inst.donors && inst.donors.length > 0) {
                donors[inst.name] = inst.donors;
            }
        });
        
        console.log('Loaded donors from localStorage:', donors);
        
        // merge any locally cached entries
        if (localDonorsCache.length) {
            localDonorsCache.forEach(donor => {
                if (!donors[donor.institution]) donors[donor.institution] = [];
                donors[donor.institution].push(donor);
            });
        }
    } catch (err) {
        console.error('Failed to load donors', err);
        // keep existing donors rather than clearing
    }
}

// Helper function to sync data - used after any data changes in owner panel
function syncDataWithLists() {
    loadDonors();
    console.log('Data synced with lists');
}


// ------ owner/admin panel helpers ------

// called when ownerPanel section becomes active
async function checkServerStatus() {
    const setupContainer = document.getElementById('setupStatusContainer');
    const loginForm = document.getElementById('loginForm');
    
    try {
        console.log('[Health Check] Checking server status...');
        const res = await apiFetch('/api/health');
        
        if (res.ok) {
            console.log('[Health Check] Server is running');
            // Server is running - hide setup guide
            setupContainer.style.display = 'none';
            loginForm.style.display = 'block';
            alert('✓ Server is running! You can now login.');
            return true;
        } else {
            throw new Error('Health check failed');
        }
    } catch (err) {
        console.error('[Health Check Error]', err);
        // Server is not running - show setup guide
        setupContainer.style.display = 'block';
        loginForm.style.display = 'none';
        alert('❌ Server is not running. Please follow the setup steps.');
        return false;
    }
}

async function ownerAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('ownerUsername').value.trim();
    const password = document.getElementById('ownerPassword').value;
    const msgEl = document.getElementById('ownerLoginMessage');
    
    msgEl.style.display = 'block';
    msgEl.textContent = 'Logging in...';
    msgEl.className = 'owner-message';
    
    // Hardcoded credentials - works offline, no backend needed
    const VALID_USERNAME = 'MITHUN M';
    const VALID_PASSWORD = 'BABBLU0124';
    
    // Simulate login delay for better UX
    setTimeout(() => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            // Login successful
            adminToken = 'local-admin-token-' + Date.now();
            console.log('[Login] Success - offline mode');
            
            // Hide login form, show dashboard
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('ownerDashboard').style.display = 'block';
            msgEl.style.display = 'none';
            
            // Load institutions in dashboard
            ownerLoadAllInstitutions();
        } else {
            // Login failed
            msgEl.textContent = '❌ Invalid username or password';
            msgEl.className = 'owner-message error';
            document.getElementById('ownerUsername').value = '';
            document.getElementById('ownerPassword').value = '';
            console.log('[Login] Failed - invalid credentials');
        }
    }, 500);
}

function ownerAdminLogout() {
    adminToken = null;
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('ownerDashboard').style.display = 'none';
    document.getElementById('ownerUsername').value = '';
    document.getElementById('ownerPassword').value = '';
    const msgEl = document.getElementById('ownerLoginMessage');
    msgEl.style.display = 'none';
    msgEl.textContent = '';
}

async function ownerLoadAllInstitutions() {
    const container = document.getElementById('ownerInstList');
    
    if (!container) {
        console.error('ownerInstList container not found');
        return;
    }
    
    try {
        // Get data from localStorage
        let institutions = localStorage.getItem('bloodDonorInstitutions');
        
        console.log('[Owner Panel] Loading institutions from localStorage...');
        console.log('[Owner Panel] Raw localStorage data:', institutions);
        
        if (!institutions) {
            console.log('[Owner Panel] No data found, initializing sample data...');
            const sampleInstitutions = [
                { id: 1, name: 'Red Cross Blood Bank', donors: [
                    { id: 1, name: 'John Doe', age: 28, bloodGroup: 'O+', contact: '9876543210', address: 'New York' },
                    { id: 2, name: 'Jane Smith', age: 32, bloodGroup: 'B+', contact: '9876543211', address: 'New York' }
                ]},
                { id: 2, name: 'City Hospital Blood Center', donors: [
                    { id: 3, name: 'Mike Johnson', age: 25, bloodGroup: 'AB+', contact: '9876543212', address: 'Boston' }
                ]},
                { id: 3, name: 'Community Blood Donation Center', donors: [
                    { id: 4, name: 'Sarah Williams', age: 29, bloodGroup: 'A+', contact: '9876543213', address: 'Chicago' }
                ]}
            ];
            localStorage.setItem('bloodDonorInstitutions', JSON.stringify(sampleInstitutions));
            institutions = JSON.stringify(sampleInstitutions);
        }
        
        const institutionsData = JSON.parse(institutions);
        console.log('[Owner Panel] Parsed institutions:', institutionsData);
        
        let html = '';
        
        if (!institutionsData || institutionsData.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No institutions or donors yet. Register a donor to get started!</p>';
            return;
        }
        
        institutionsData.forEach(inst => {
            const donorCount = inst.donors ? inst.donors.length : 0;
            console.log(`[Owner Panel] Processing institution: ${inst.name} with ${donorCount} donors`);
            
            html += `<div style="padding: 1rem; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0;">${inst.name}</h4>
                                <p style="margin: 0; color: #666; font-size: 0.9rem;">${donorCount} donor(s)</p>
                            </div>
                            <button onclick="ownerDeleteInstitution(${inst.id})" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Delete Institution</button>
                        </div>
                        <div style="margin-top: 0.5rem;">`;
            
            if (inst.donors && inst.donors.length > 0) {
                inst.donors.forEach(donor => {
                    html += `<div style="padding: 0.5rem; background-color: #f9f9f9; border-radius: 4px; margin-top: 0.3rem; display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>${donor.name}</strong> - ${donor.bloodGroup} (Age: ${donor.age}, Contact: ${donor.contact})</span>
                                <button onclick="ownerDeleteDonor(${donor.id})" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Delete</button>
                             </div>`;
                });
            } else {
                html += `<p style="color: #999; font-size: 0.9rem; margin: 0.5rem 0 0 0;">No donors registered yet</p>`;
            }
            
            html += `</div></div>`;
        });
        
        console.log('[Owner Panel] Final HTML:', html.substring(0, 200) + '...');
        container.innerHTML = html;
        console.log('[Owner Panel] Data displayed successfully');
        
    } catch (err) {
        console.error('[Load Institutions Error]', err);
        container.innerHTML = `<p style="color: #c62828; padding: 1rem; background-color: #ffebee; border-radius: 6px;">❌ Error: ${err.message}</p>`;
    }
}

function ownerDeleteInstitution(instId) {
    const institutions = JSON.parse(localStorage.getItem('bloodDonorInstitutions') || '[]');
    const inst = institutions.find(i => i.id === instId);
    
    if (!inst) return alert('Institution not found');
    if (!confirm(`Delete institution "${inst.name}" and all its donors?`)) return;
    
    try {
        const filtered = institutions.filter(i => i.id !== instId);
        localStorage.setItem('bloodDonorInstitutions', JSON.stringify(filtered));
        
        // Sync with lists data
        syncDataWithLists();
        
        ownerLoadAllInstitutions();
        alert('Institution deleted successfully');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function ownerDeleteDonor(donorId) {
    const institutions = JSON.parse(localStorage.getItem('bloodDonorInstitutions') || '[]');
    
    let donorName = '';
    institutions.forEach(inst => {
        if (inst.donors) {
            const donor = inst.donors.find(d => d.id === donorId);
            if (donor) donorName = donor.name;
        }
    });
    
    if (!donorName) return alert('Donor not found');
    if (!confirm(`Delete donor "${donorName}"?`)) return;
    
    try {
        institutions.forEach(inst => {
            if (inst.donors) {
                inst.donors = inst.donors.filter(d => d.id !== donorId);
            }
        });
        localStorage.setItem('bloodDonorInstitutions', JSON.stringify(institutions));
        
        // Sync with lists data
        syncDataWithLists();
        
        ownerLoadAllInstitutions();
        alert('Donor deleted successfully');
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function ownerCreateAdmin(event) {
    event.preventDefault();
    const username = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    const msgEl = document.getElementById('ownerCreateAdminMessage');
    
    msgEl.style.display = 'block';
    msgEl.textContent = 'Creating admin...';
    msgEl.className = 'owner-message';
    
    // Validate input
    if (!username || !password) {
        msgEl.textContent = '❌ Please enter both username and password';
        msgEl.className = 'owner-message error';
        return;
    }
    
    try {
        // Get current admins from localStorage
        let admins = JSON.parse(localStorage.getItem('bloodDonorAdmins') || '[]');
        
        // Initialize with default admin if empty
        if (admins.length === 0) {
            admins = [{ id: 1, username: 'MITHUN M', password: 'BABBLU0124' }];
        }
        
        // Check if username already exists
        if (admins.find(a => a.username === username)) {
            msgEl.textContent = '❌ Username already exists';
            msgEl.className = 'owner-message error';
            return;
        }
        
        // Create new admin
        const newAdmin = {
            id: Math.max(...admins.map(a => a.id), 0) + 1,
            username,
            password
        };
        
        admins.push(newAdmin);
        localStorage.setItem('bloodDonorAdmins', JSON.stringify(admins));
        
        msgEl.textContent = `✓ Admin account created: ${username}`;
        msgEl.className = 'owner-message success';
        document.getElementById('newAdminUsername').value = '';
        document.getElementById('newAdminPassword').value = '';
        
        setTimeout(() => {
            msgEl.style.display = 'none';
        }, 3000);
    } catch (err) {
        msgEl.textContent = '❌ ' + err.message;
        msgEl.className = 'owner-message error';
    }
}

// Helper function to initialize sample data
function initializeSampleDataIfNeeded() {
    const existing = localStorage.getItem('bloodDonorInstitutions');
    
    if (!existing) {
        const sampleInstitutions = [
            { id: 1, name: 'Red Cross Blood Bank', donors: [
                { id: 1, name: 'John Doe', age: 28, bloodGroup: 'O+', contact: '9876543210', address: 'New York' },
                { id: 2, name: 'Jane Smith', age: 32, bloodGroup: 'B+', contact: '9876543211', address: 'New York' }
            ]},
            { id: 2, name: 'City Hospital Blood Center', donors: [
                { id: 3, name: 'Mike Johnson', age: 25, bloodGroup: 'AB+', contact: '9876543212', address: 'Boston' }
            ]},
            { id: 3, name: 'Community Blood Donation Center', donors: [
                { id: 4, name: 'Sarah Williams', age: 29, bloodGroup: 'A+', contact: '9876543213', address: 'Chicago' }
            ]}
        ];
        localStorage.setItem('bloodDonorInstitutions', JSON.stringify(sampleInstitutions));
        console.log('Initialized sample data');
    }
}

// initialization
(async function init() {
    console.log('Initializing Blood Donor Finder...');
    initializeSampleDataIfNeeded(); // Initialize sample data first
    initAuth();
    await loadDonors();
    // Hide images that fail to load (prevents broken image icons)
    function hideBrokenImages() {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('error', () => { img.style.display = 'none'; });
        });
    }
    hideBrokenImages();

    // Show home page by default for authenticated users,
    // otherwise show the sign-in page so users can authenticate.
    if (authToken || manualMode) {
        showSection('home');
    } else {
        showSection('login');
    }
})();