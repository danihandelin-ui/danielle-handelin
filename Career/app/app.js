// Career Arsenal App - JavaScript

// Skills data
const SKILLS_DATA = {
    technical: [
        { name: 'Jira/Atlassian Suite', importance: 'high' },
        { name: 'Scrum/Agile Framework', importance: 'high' },
        { name: 'HubSpot', importance: 'medium' },
        { name: 'Google Sheets/Excel', importance: 'high' },
        { name: 'Claude Code/AI Tools', importance: 'medium' },
        { name: 'Canva', importance: 'low' },
        { name: 'Markdown/Documentation', importance: 'medium' },
        { name: 'CRM Systems', importance: 'medium' },
    ],
    operational: [
        { name: 'Process Design & Documentation', importance: 'high' },
        { name: 'Staff Training & Development', importance: 'high' },
        { name: 'Event Coordination (30-500+ people)', importance: 'high' },
        { name: 'Operational Reporting/Dashboards', importance: 'high' },
        { name: 'Continuous Improvement', importance: 'high' },
        { name: 'Systems Implementation', importance: 'high' },
        { name: 'Change Management', importance: 'medium' },
        { name: 'Cross-functional Leadership', importance: 'high' },
    ],
    soft: [
        { name: 'Executive Communication', importance: 'high' },
        { name: 'Team Development', importance: 'high' },
        { name: 'Problem-Solving', importance: 'high' },
        { name: 'Initiative/Ownership', importance: 'high' },
        { name: 'Cross-functional Collaboration', importance: 'high' },
        { name: 'Adaptability', importance: 'medium' },
        { name: 'Relationship Building', importance: 'high' },
        { name: 'Training/Teaching', importance: 'medium' },
    ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Render skills audit
    renderSkillsAudit();

    // Load saved data
    loadAllData();

    // Update dashboard
    updateDashboard();

    // Update last updated time
    updateLastUpdated();
}

function switchTab(e) {
    const tabName = e.target.dataset.tab;

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(tabName).classList.add('active');
    e.target.classList.add('active');
}

// SKILLS AUDIT
function renderSkillsAudit() {
    const technicalDiv = document.getElementById('skills-technical');
    const operationalDiv = document.getElementById('skills-operational');
    const softDiv = document.getElementById('skills-soft');

    technicalDiv.innerHTML = SKILLS_DATA.technical.map(skill =>
        createSkillItem(skill.name, 'technical')
    ).join('');

    operationalDiv.innerHTML = SKILLS_DATA.operational.map(skill =>
        createSkillItem(skill.name, 'operational')
    ).join('');

    softDiv.innerHTML = SKILLS_DATA.soft.map(skill =>
        createSkillItem(skill.name, 'soft')
    ).join('');
}

function createSkillItem(skillName, category) {
    const id = `skill-${category}-${skillName.replace(/\s/g, '-').toLowerCase()}`;
    const savedRating = localStorage.getItem(id) || '0';

    return `
        <div class="skill-audit-item">
            <span>${skillName}</span>
            <div class="skill-level" id="${id}">
                ${[0,1,2,3,4,5].map(i =>
                    `<span class="${i <= savedRating ? 'filled' : 'empty'}"
                          onclick="setSkillRating('${id}', ${i})">${i}</span>`
                ).join('')}
            </div>
        </div>
    `;
}

function setSkillRating(elementId, rating) {
    localStorage.setItem(elementId, rating);

    // Re-render the skill item
    const container = document.getElementById(elementId);
    container.innerHTML = [0,1,2,3,4,5].map(i =>
        `<span class="${i <= rating ? 'filled' : 'empty'}"
              onclick="setSkillRating('${elementId}', ${i})">${i}</span>`
    ).join('');
}

// SAVE FUNCTIONS
function saveOnboarding() {
    localStorage.setItem('currentTitle', document.getElementById('current-title').value);
    localStorage.setItem('yearsExperience', document.getElementById('years-experience').value);
    localStorage.setItem('currentHourly', document.getElementById('current-hourly').value);
    localStorage.setItem('currentSatisfaction', document.getElementById('current-satisfaction').value);
    localStorage.setItem('targetHourly', document.getElementById('target-hourly').value);
    localStorage.setItem('consultingModel', document.getElementById('consulting-model').value);
    localStorage.setItem('timeline', document.getElementById('timeline').value);
    localStorage.setItem('biggestConcern', document.getElementById('biggest-concern').value);

    showSavedMessage('onboarding-saved');
    updateDashboard();
}

function saveSkillsAudit() {
    showSavedMessage('skills-saved');
    updateDashboard();
}

function savePathway() {
    // Save all milestone checkboxes
    document.querySelectorAll('#pathway input[type="checkbox"]').forEach(cb => {
        localStorage.setItem(cb.id, cb.checked);
    });

    showSavedMessage('pathway-saved');
    updateDashboard();
}

function saveLearning() {
    // Save all learning checkboxes
    document.querySelectorAll('#learning input[type="checkbox"]').forEach(cb => {
        localStorage.setItem(cb.id, cb.checked);
    });

    showSavedMessage('learning-saved');
    updateDashboard();
}

function saveRevenue() {
    localStorage.setItem('year1Target', document.getElementById('year1-target').value);
    localStorage.setItem('year2Target', document.getElementById('year2-target').value);
    localStorage.setItem('year3Vision', document.getElementById('year3-vision').value);
    localStorage.setItem('actualDaily', document.getElementById('actual-daily').value);
    localStorage.setItem('actualConsulting', document.getElementById('actual-consulting').value);
    localStorage.setItem('revenueNotes', document.getElementById('revenue-notes').value);

    showSavedMessage('revenue-saved');
    updateDashboard();
}

// LOAD FUNCTIONS
function loadAllData() {
    // Load onboarding
    const currentTitle = localStorage.getItem('currentTitle') || '';
    const yearsExperience = localStorage.getItem('yearsExperience') || '';
    const currentHourly = localStorage.getItem('currentHourly') || '';
    const currentSatisfaction = localStorage.getItem('currentSatisfaction') || '5';
    const targetHourly = localStorage.getItem('targetHourly') || '';
    const consultingModel = localStorage.getItem('consultingModel') || '';
    const timeline = localStorage.getItem('timeline') || '';
    const biggestConcern = localStorage.getItem('biggestConcern') || '';

    document.getElementById('current-title').value = currentTitle;
    document.getElementById('years-experience').value = yearsExperience;
    document.getElementById('current-hourly').value = currentHourly;
    document.getElementById('current-satisfaction').value = currentSatisfaction;
    document.getElementById('target-hourly').value = targetHourly;
    document.getElementById('consulting-model').value = consultingModel;
    document.getElementById('timeline').value = timeline;
    document.getElementById('biggest-concern').value = biggestConcern;

    // Load pathway checkboxes
    document.querySelectorAll('#pathway input[type="checkbox"]').forEach(cb => {
        const saved = localStorage.getItem(cb.id);
        if (saved === 'true') {
            cb.checked = true;
        }
    });

    // Load learning checkboxes
    document.querySelectorAll('#learning input[type="checkbox"]').forEach(cb => {
        const saved = localStorage.getItem(cb.id);
        if (saved === 'true') {
            cb.checked = true;
        }
    });

    // Load revenue
    document.getElementById('year1-target').value = localStorage.getItem('year1Target') || '';
    document.getElementById('year2-target').value = localStorage.getItem('year2Target') || '';
    document.getElementById('year3-vision').value = localStorage.getItem('year3Vision') || '';
    document.getElementById('actual-daily').value = localStorage.getItem('actualDaily') || '';
    document.getElementById('actual-consulting').value = localStorage.getItem('actualConsulting') || '';
    document.getElementById('revenue-notes').value = localStorage.getItem('revenueNotes') || '';
}

// UPDATE DASHBOARD
function updateDashboard() {
    const currentHourly = parseFloat(localStorage.getItem('currentHourly')) || 0;
    const targetHourly = parseFloat(localStorage.getItem('targetHourly')) || 50;
    const currentTitle = localStorage.getItem('currentTitle') || 'Operations Professional';

    // Update stat cards
    document.getElementById('current-rate').textContent = currentHourly ? `$${currentHourly}/hr` : '$--/hr';
    document.getElementById('target-rate').textContent = targetHourly ? `$${targetHourly}/hr` : '$--/hr';

    // Calculate progress
    let progressPercent = 0;
    if (currentHourly > 0 && targetHourly > 0) {
        progressPercent = Math.min(100, Math.round((currentHourly / targetHourly) * 100));
    }
    document.getElementById('progress-percent').textContent = progressPercent + '%';

    // Count skills completed
    let skillsCompleted = 0;
    document.querySelectorAll('.skill-level').forEach(skillLevel => {
        const filledSpans = skillLevel.querySelectorAll('span.filled').length;
        if (filledSpans >= 3) skillsCompleted++;
    });
    document.getElementById('skills-completed').textContent = skillsCompleted;

    // Update pathway node
    document.getElementById('dashboard-current').textContent = currentTitle || 'Coordinator';
}

function showSavedMessage(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 2000);

    updateLastUpdated();
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    document.getElementById('last-updated').textContent = timeString;
}

// EXPORT DATA (for future use)
function exportData() {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        allData[key] = localStorage.getItem(key);
    }
    console.log('Career Arsenal Data:', allData);
    alert('Data exported to console. You can copy/backup if needed.');
}

// RESET DATA (for testing)
function resetData() {
    if (confirm('Are you sure? This will clear all your data.')) {
        localStorage.clear();
        location.reload();
    }
}
