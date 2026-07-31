// FDE Mastery Roadmap Application Logic

// State management
let state = {
    subtopicStatuses: {}, // code or code_subtopicId -> status
    subtopicNotes: {},    // code -> text notes
    todoList: [],         // array of { id, title, isDone, type: 'subtopic'|'custom', code }
    collapsedPhases: {}   // phaseId -> boolean
};

// DOM Elements
const phasesListEl = document.getElementById('phases-list');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');

// Stats Elements
const overallProgressPercentEl = document.getElementById('overall-progress-percent');
const overallProgressFillEl = document.getElementById('overall-progress-fill');
const statCompletedEl = document.getElementById('stat-completed');
const statInProgressEl = document.getElementById('stat-in-progress');
const statRemainingEl = document.getElementById('stat-remaining');

// Drawer Elements
const drawerBackdrop = document.getElementById('drawer-backdrop');
const detailsDrawer = document.getElementById('details-drawer');
const drawerCloseBtn = document.getElementById('drawer-close');
const drawerCodeEl = document.getElementById('drawer-code');
const drawerTitleEl = document.getElementById('drawer-title');
const drawerWhatItIsEl = document.getElementById('drawer-what-it-is');
const drawerFocusListEl = document.getElementById('drawer-focus-list');
const drawerToolsEl = document.getElementById('drawer-tools');
const drawerProsEl = document.getElementById('drawer-pros');
const drawerConsEl = document.getElementById('drawer-cons');
const drawerWhenToUseEl = document.getElementById('drawer-when-to-use');
const drawerWhenToAvoidEl = document.getElementById('drawer-when-to-avoid');
const drawerApplicationsEl = document.getElementById('drawer-applications');
const drawerCoreFeaturesEl = document.getElementById('drawer-core-features');
const drawerStatusSelect = document.getElementById('drawer-status-select');
const drawerAddTodoBtn = document.getElementById('drawer-add-todo-btn');
const drawerNotesEl = document.getElementById('drawer-notes');
const drawerNotesSaveBtn = document.getElementById('drawer-notes-save-btn');

// Dynamic Sections in Drawer
const drawerSubtopicsSection = document.getElementById('drawer-subtopics-section');
const drawerSubtopicsList = document.getElementById('drawer-subtopics-list');
const drawerGeneralResourcesSection = document.getElementById('drawer-general-resources-section');
const drawerGeneralResourcesList = document.getElementById('drawer-general-resources-list');

// To-Do Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoListEl = document.getElementById('todo-list');

// Active selected subtopic in drawer
let activeSubtopicCode = null;

// Pomodoro Timer State
let pomoTimeLeft = 1500; // 25 mins in seconds
let pomoInterval = null;
let pomoIsActive = false;
let pomoMode = 'focus'; // 'focus' or 'break'

// Initialize App
function init() {
    loadState();
    renderRoadmap();
    renderTodoList();
    updateStats();
    setupEventListeners();
}

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('fde_roadmap_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            if (!state.subtopicStatuses) state.subtopicStatuses = {};
            if (!state.subtopicNotes) state.subtopicNotes = {};
            if (!state.todoList) state.todoList = [];
            if (!state.collapsedPhases) state.collapsedPhases = {};
            
            // Load theme configuration
            if (state.theme === 'light') {
                document.body.classList.add('light-theme');
                setTimeout(() => {
                    const toggleIcon = document.querySelector('.theme-toggle-icon');
                    if (toggleIcon) toggleIcon.textContent = '☀️';
                }, 100);
            }
        } catch (e) {
            console.error('Failed to parse saved state, initializing fresh state.', e);
        }
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('fde_roadmap_state', JSON.stringify(state));
}

// Recalculate parent topic status based on child subtopics
function recalculateTopicStatus(code) {
    let subtopic = null;
    for (const phase of window.roadmapData) {
        subtopic = phase.topics.find(t => t.code === code);
        if (subtopic) break;
    }
    if (!subtopic || !subtopic.subtopics) return;

    const childStatuses = subtopic.subtopics.map(child => state.subtopicStatuses[`${code}_${child.id}`] || 'not-started');
    
    let newStatus = 'not-started';
    
    if (childStatuses.every(s => s === 'completed')) {
        newStatus = 'completed';
    } else if (childStatuses.every(s => s === 'not-required')) {
        newStatus = 'not-required';
    } else if (childStatuses.some(s => s === 'completed' || s === 'in-progress')) {
        newStatus = 'in-progress';
    } else if (childStatuses.every(s => s === 'not-started' || s === 'not-required')) {
        if (childStatuses.includes('not-started')) {
            newStatus = 'not-started';
        } else {
            newStatus = 'not-required';
        }
    }
    
    state.subtopicStatuses[code] = newStatus;
}

// Compute and update stats
function updateStats() {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let notRequired = 0;

    window.roadmapData.forEach(phase => {
        phase.topics.forEach(topic => {
            const status = state.subtopicStatuses[topic.code] || 'not-started';
            
            if (status === 'completed') completed++;
            else if (status === 'in-progress') inProgress++;
            else if (status === 'not-required') notRequired++;
            total++;
        });
    });

    const activeTotal = total - notRequired;
    const progressPercent = activeTotal > 0 ? Math.round((completed / activeTotal) * 100) : 0;

    overallProgressPercentEl.textContent = `${progressPercent}%`;
    overallProgressFillEl.style.width = `${progressPercent}%`;
    
    statCompletedEl.textContent = completed;
    statInProgressEl.textContent = inProgress;
    statRemainingEl.textContent = total - completed - notRequired;

    // Update Phase progress bars
    window.roadmapData.forEach(phase => {
        let phaseTotal = 0;
        let phaseCompleted = 0;
        let phaseNotRequired = 0;

        phase.topics.forEach(topic => {
            const status = state.subtopicStatuses[topic.code] || 'not-started';
            if (status === 'completed') phaseCompleted++;
            else if (status === 'not-required') phaseNotRequired++;
            phaseTotal++;
        });

        const phaseActiveTotal = phaseTotal - phaseNotRequired;
        const phaseProgress = phaseActiveTotal > 0 ? Math.round((phaseCompleted / phaseActiveTotal) * 100) : 0;
        
        const phaseFillEl = document.getElementById(`phase-fill-${phase.id}`);
        const phaseTextEl = document.getElementById(`phase-text-${phase.id}`);
        if (phaseFillEl && phaseTextEl) {
            phaseFillEl.style.width = `${phaseProgress}%`;
            phaseTextEl.textContent = `${phaseProgress}%`;
        }
    });
}

// Render the Roadmap HTML (Winding Highway Layout with Tabs)
function renderRoadmap() {
    phasesListEl.innerHTML = '';

    // Render Phase Tab Buttons dynamically
    const phaseTabsEl = document.getElementById('phase-tabs');
    if (phaseTabsEl) {
        phaseTabsEl.innerHTML = '';
        window.roadmapData.forEach(phase => {
            const btn = document.createElement('button');
            const isActive = state.activePhaseId === phase.id;
            btn.className = `phase-tab-btn ${isActive ? 'active' : ''}`;
            
            // Format labels nicely
            const tabTitles = {
                0: 'Prereqs',
                1: 'Prompting',
                2: 'LLM APIs',
                3: 'Vibe Coding',
                4: 'Eval/Safety',
                5: 'RAG/Vector',
                6: 'Agents/MCP',
                7: 'Deploy',
                8: 'Security'
            };
            const label = tabTitles[phase.number] || `Phase ${phase.number}`;
            
            btn.innerHTML = `
                <span class="tab-num">Phase ${phase.number}</span>
                <span class="tab-title">${label}</span>
            `;
            
            btn.addEventListener('click', () => {
                state.activePhaseId = phase.id;
                saveState();
                
                document.querySelectorAll('.phase-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                showActivePhase();
            });
            phaseTabsEl.appendChild(btn);
        });
    }

    window.roadmapData.forEach(phase => {
        const isCollapsed = state.collapsedPhases[phase.id] || false;
        
        const phaseCard = document.createElement('section');
        phaseCard.className = `phase-card ${isCollapsed ? 'collapsed' : ''}`;
        phaseCard.id = phase.id;
        phaseCard.setAttribute('data-phase-type', phase.number === 0 ? 'prereq' : 'core');

        const phaseHeader = document.createElement('div');
        phaseHeader.className = 'phase-header';
        phaseHeader.innerHTML = `
            <div class="phase-info-block">
                <span class="phase-number">Phase ${phase.number}</span>
                <h3 class="phase-title">${phase.title}</h3>
            </div>
            <div class="phase-progress-mini">
                <div class="phase-progress-bar">
                    <div id="phase-fill-${phase.id}" class="phase-progress-fill"></div>
                </div>
                <span id="phase-text-${phase.id}" class="phase-progress-text">0%</span>
            </div>
            <div class="phase-collapse-indicator">▼</div>
        `;

        phaseHeader.addEventListener('click', () => {
            const coll = !phaseCard.classList.contains('collapsed');
            if (coll) {
                phaseCard.classList.add('collapsed');
            } else {
                phaseCard.classList.remove('collapsed');
            }
            state.collapsedPhases[phase.id] = coll;
            saveState();
        });

        const phaseBody = document.createElement('div');
        phaseBody.className = 'phase-body';

        // Create winding road container
        const roadContainer = document.createElement('div');
        roadContainer.className = 'road-container';
        
        // Background road path
        const roadLine = document.createElement('div');
        roadLine.className = 'road-line';
        roadContainer.appendChild(roadLine);

        phase.topics.forEach((topic, idx) => {
            if (topic.subtopics) {
                recalculateTopicStatus(topic.code);
            }
            
            const status = state.subtopicStatuses[topic.code] || 'not-started';
            const side = (idx % 2 === 0) ? 'left' : 'right';
            
            const roadNode = document.createElement('div');
            roadNode.className = `road-node ${side}`;

            // Connector path
            const connector = document.createElement('div');
            connector.className = 'road-connector';
            roadNode.appendChild(connector);

            // Checkpoint pin on the road
            const checkpoint = document.createElement('div');
            checkpoint.className = `road-checkpoint ${status}`;
            checkpoint.setAttribute('data-checkpoint-code', topic.code);
            checkpoint.title = `Click to view ${topic.name} details`;
            checkpoint.innerHTML = `<div class="road-checkpoint-inner"></div>`;
            
            checkpoint.addEventListener('click', (e) => {
                e.stopPropagation();
                openDetailsDrawer(topic.code);
            });
            roadNode.appendChild(checkpoint);

            // Card
            const card = document.createElement('div');
            card.className = 'road-card subtopic-card';
            card.setAttribute('data-topic-code', topic.code);
            card.setAttribute('data-topic-name', topic.name.toLowerCase());
            
            const statusLabels = {
                'not-started': 'Not Started',
                'in-progress': 'In Progress',
                'completed': 'Completed',
                'not-required': 'Not Required'
            };

            card.innerHTML = `
                <div class="subtopic-header">
                    <span class="subtopic-code">${topic.code}</span>
                    <span class="status-indicator ${status}"></span>
                </div>
                <h4 class="subtopic-name">${topic.name}</h4>
                <div class="subtopic-footer">
                    <span class="status-badge ${status}">${statusLabels[status]}</span>
                </div>
                <div class="card-actions">
                    <button class="action-icon-btn add-todo-btn" title="Add to Study Plan">＋</button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-todo-btn')) {
                    e.stopPropagation();
                    addToTodo(topic.code, topic.name);
                    return;
                }
                openDetailsDrawer(topic.code);
            });

            roadNode.appendChild(card);
            roadContainer.appendChild(roadNode);
        });

        phaseBody.appendChild(roadContainer);
        phaseCard.appendChild(phaseHeader);
        phaseCard.appendChild(phaseBody);
        phasesListEl.appendChild(phaseCard);
    });

    // Make sure only active phase is visible
    if (!state.activePhaseId) {
        state.activePhaseId = 'phase_0';
    }
    showActivePhase();
}

// Show only the selected active phase and hide others
function showActivePhase() {
    const phases = document.querySelectorAll('.phase-card');
    phases.forEach(phase => {
        if (phase.id === state.activePhaseId) {
            phase.style.display = 'block';
            phase.classList.remove('collapsed');
        } else {
            phase.style.display = 'none';
        }
    });
}

// Render only a single card and its checkpoint pin
function renderRoadmapCard(code) {
    const cardEl = document.querySelector(`.subtopic-card[data-topic-code="${code}"]`);
    if (!cardEl) return;
    
    const status = state.subtopicStatuses[code] || 'not-started';
    const indicator = cardEl.querySelector('.status-indicator');
    const badge = cardEl.querySelector('.status-badge');
    
    if (indicator) indicator.className = `status-indicator ${status}`;
    if (badge) {
        badge.className = `status-badge ${status}`;
        const statusLabels = {
            'not-started': 'Not Started',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'not-required': 'Not Required'
        };
        badge.textContent = statusLabels[status];
    }
    
    // Update road checkpoint pin
    const checkpointEl = document.querySelector(`.road-checkpoint[data-checkpoint-code="${code}"]`);
    if (checkpointEl) {
        checkpointEl.className = `road-checkpoint ${status}`;
    }
}

// Open Details drawer (with optional subtopic highlighting)
function openDetailsDrawer(code, highlightSubtopicId = null) {
    activeSubtopicCode = code;

    let subtopic = null;
    for (const phase of window.roadmapData) {
        subtopic = phase.topics.find(t => t.code === code);
        if (subtopic) break;
    }

    if (!subtopic) return;

    drawerCodeEl.textContent = subtopic.code;
    drawerTitleEl.textContent = subtopic.name;

    const details = subtopic.details;
    drawerWhatItIsEl.textContent = details.what_it_is || 'N/A';

    // Key focus list
    drawerFocusListEl.innerHTML = '';
    if (details.key_focus) {
        const points = details.key_focus.split(',');
        points.forEach(pt => {
            const li = document.createElement('li');
            li.className = 'focus-item';
            li.textContent = pt.trim();
            drawerFocusListEl.appendChild(li);
        });
    } else {
        drawerFocusListEl.innerHTML = '<li class="focus-item">No specific points defined.</li>';
    }

    // Tools tags
    drawerToolsEl.innerHTML = '';
    if (details.tools) {
        const tools = details.tools.split(',');
        tools.forEach(tool => {
            const span = document.createElement('span');
            span.className = 'tool-tag';
            span.textContent = tool.trim();
            drawerToolsEl.appendChild(span);
        });
    } else {
        drawerToolsEl.innerHTML = '<span class="tool-tag">None listed</span>';
    }

    drawerProsEl.textContent = details.pros || 'N/A';
    drawerConsEl.textContent = details.cons || 'N/A';
    drawerWhenToUseEl.textContent = details.when_to_use || 'N/A';
    drawerWhenToAvoidEl.textContent = details.when_to_avoid || 'N/A';
    drawerApplicationsEl.textContent = details.applications || 'N/A';
    drawerCoreFeaturesEl.textContent = details.core_features || 'N/A';

    // Handle nested subtopics if they exist
    const mainActionsBlock = document.querySelector('.drawer-actions-block');

    if (subtopic.subtopics && subtopic.subtopics.length > 0) {
        drawerSubtopicsSection.style.display = 'block';
        mainActionsBlock.style.display = 'none'; // Hide main status selector
        
        drawerSubtopicsList.innerHTML = '';
        subtopic.subtopics.forEach(child => {
            const childKey = `${code}_${child.id}`;
            const childStatus = state.subtopicStatuses[childKey] || 'not-started';
            
            const card = document.createElement('div');
            card.className = 'subtopic-item-card';
            card.id = `subtopic-card-${child.id}`;
            if (highlightSubtopicId === child.id) {
                card.classList.add('expanded');
            }

            const statusLabels = {
                'not-started': 'Not Started',
                'in-progress': 'In Progress',
                'completed': 'Completed',
                'not-required': 'Not Required'
            };

            card.innerHTML = `
                <div class="subtopic-item-header">
                    <div class="subtopic-item-title-block">
                        <span class="status-indicator ${childStatus}"></span>
                        <span class="subtopic-item-name">${child.name}</span>
                    </div>
                    <span class="status-badge ${childStatus}" style="margin-right: 10px;">${statusLabels[childStatus]}</span>
                    <span class="arrow-indicator">▼</span>
                </div>
                <div class="subtopic-item-body">
                    <p class="subtopic-item-desc">${child.description}</p>
                    <div class="subtopic-resources-list">
                        ${child.resources.map(res => `
                            <a href="${res.url}" target="_blank" class="subtopic-resource-link">
                                🔗 ${res.name}
                            </a>
                        `).join('')}
                    </div>
                    <div class="subtopic-item-actions">
                        <select class="subtopic-status-dropdown" data-subtopic-id="${child.id}">
                            <option value="not-started" ${childStatus === 'not-started' ? 'selected' : ''}>Not Started</option>
                            <option value="in-progress" ${childStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${childStatus === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="not-required" ${childStatus === 'not-required' ? 'selected' : ''}>Not Required</option>
                        </select>
                        <button class="subtopic-add-todo-btn" data-subtopic-id="${child.id}">
                            📅 Add to Plan
                        </button>
                    </div>
                </div>
            `;

            // Expand/collapse child subtopic
            const header = card.querySelector('.subtopic-item-header');
            header.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });

            // Handle status change
            const dropdown = card.querySelector('.subtopic-status-dropdown');
            dropdown.addEventListener('change', () => {
                const newStatus = dropdown.value;
                state.subtopicStatuses[childKey] = newStatus;
                
                const indicator = card.querySelector('.status-indicator');
                const badge = card.querySelector('.status-badge');
                indicator.className = `status-indicator ${newStatus}`;
                badge.className = `status-badge ${newStatus}`;
                badge.textContent = statusLabels[newStatus];

                const todoItem = state.todoList.find(t => t.code === childKey);
                if (todoItem) {
                    todoItem.isDone = (newStatus === 'completed');
                    renderTodoList();
                }

                recalculateTopicStatus(code);
                saveState();
                updateStats();
                renderRoadmapCard(code);
            });

            // Handle Add to Plan
            const btn = card.querySelector('.subtopic-add-todo-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                addToTodoChild(code, subtopic.name, child.id, child.name);
            });

            drawerSubtopicsList.appendChild(card);
        });

        if (highlightSubtopicId) {
            setTimeout(() => {
                const activeCard = document.getElementById(`subtopic-card-${highlightSubtopicId}`);
                if (activeCard) {
                    activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    activeCard.style.outline = '2px solid var(--color-secondary)';
                    setTimeout(() => activeCard.style.outline = 'none', 2000);
                }
            }, 300);
        }
    } else {
        drawerSubtopicsSection.style.display = 'none';
        mainActionsBlock.style.display = 'block';
        drawerStatusSelect.value = state.subtopicStatuses[code] || 'not-started';
    }

    // Handle general resources if they exist
    if (subtopic.general_resources && subtopic.general_resources.length > 0) {
        drawerGeneralResourcesSection.style.display = 'block';
        drawerGeneralResourcesList.innerHTML = subtopic.general_resources.map(res => `
            <a href="${res.url}" target="_blank" class="general-resource-item">
                🎓 ${res.name}
            </a>
        `).join('');
    } else {
        drawerGeneralResourcesSection.style.display = 'none';
    }

    // Notes textarea
    drawerNotesEl.value = state.subtopicNotes[code] || '';

    // Show Drawer
    detailsDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
}

// Close drawer
function closeDetailsDrawer() {
    detailsDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    activeSubtopicCode = null;
}

// Add parent subtopic to To-Do Study Plan
function addToTodo(code, name = '') {
    if (!name) {
        for (const phase of window.roadmapData) {
            const sub = phase.topics.find(t => t.code === code);
            if (sub) {
                name = sub.name;
                break;
            }
        }
    }

    const exists = state.todoList.some(item => item.code === code);
    if (exists) {
        showToast(`"${name}" is already in your Study Plan!`);
        return;
    }

    state.todoList.push({
        id: Date.now().toString(),
        title: `${code} - ${name}`,
        isDone: state.subtopicStatuses[code] === 'completed',
        type: 'subtopic',
        code: code
    });

    saveState();
    renderTodoList();
    showToast(`Added "${name}" to Today's Study Plan!`);
}

// Add specific child subtopic to To-Do Study Plan
function addToTodoChild(code, parentName, childId, childName) {
    const childKey = `${code}_${childId}`;
    const exists = state.todoList.some(item => item.code === childKey);
    if (exists) {
        showToast(`"${childName}" is already in your Study Plan!`);
        return;
    }

    state.todoList.push({
        id: Date.now().toString(),
        title: `${code} ${parentName}: ${childName}`,
        isDone: state.subtopicStatuses[childKey] === 'completed',
        type: 'subtopic',
        code: childKey
    });

    saveState();
    renderTodoList();
    showToast(`Added "${childName}" to Today's Study Plan!`);
}

// Render To-Do List
function renderTodoList() {
    todoListEl.innerHTML = '';

    if (state.todoList.length === 0) {
        todoListEl.innerHTML = `
            <div class="todo-empty-state">
                <span class="icon">📝</span>
                <p>Your study plan is empty.</p>
                <p style="font-size: 0.75rem; color: var(--text-muted);">Click "＋" on any roadmap topic or add a custom task above to plan your day!</p>
            </div>
        `;
        return;
    }

    state.todoList.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = `todo-item ${item.isDone ? 'done' : ''}`;
        
        itemEl.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${item.isDone ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-title">${item.title}</span>
                <span class="todo-tag ${item.type}">${item.type === 'subtopic' ? 'Roadmap Topic' : 'Custom Task'}</span>
            </div>
            <button class="todo-delete-btn" title="Delete task">&times;</button>
        `;

        const checkbox = itemEl.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => {
            item.isDone = checkbox.checked;
            
            if (item.type === 'subtopic' && item.code) {
                const newStatus = item.isDone ? 'completed' : 'in-progress';
                state.subtopicStatuses[item.code] = newStatus;
                
                if (item.code.includes('_')) {
                    const [parentCode, childId] = item.code.split('_');
                    recalculateTopicStatus(parentCode);
                    renderRoadmapCard(parentCode);
                    
                    if (activeSubtopicCode === parentCode) {
                        const childCard = document.getElementById(`subtopic-card-${childId}`);
                        if (childCard) {
                            const indicator = childCard.querySelector('.status-indicator');
                            const badge = childCard.querySelector('.status-badge');
                            const dropdown = childCard.querySelector('.subtopic-status-dropdown');
                            
                            indicator.className = `status-indicator ${newStatus}`;
                            badge.className = `status-badge ${newStatus}`;
                            const statusLabels = {
                                'not-started': 'Not Started',
                                'in-progress': 'In Progress',
                                'completed': 'Completed',
                                'not-required': 'Not Required'
                            };
                            badge.textContent = statusLabels[newStatus];
                            dropdown.value = newStatus;
                        }
                    }
                } else {
                    if (activeSubtopicCode === item.code) {
                        drawerStatusSelect.value = newStatus;
                    }
                    renderRoadmapCard(item.code);
                }
            }

            saveState();
            renderTodoList();
            updateStats();
        });

        const titleEl = itemEl.querySelector('.todo-title');
        titleEl.addEventListener('click', () => {
            if (item.type === 'subtopic' && item.code) {
                let parentCode = item.code;
                let childId = null;
                if (item.code.includes('_')) {
                    [parentCode, childId] = item.code.split('_');
                }
                
                // Find parent phase
                let phaseId = null;
                for (const phase of window.roadmapData) {
                    if (phase.topics.some(t => t.code === parentCode)) {
                        phaseId = phase.id;
                        break;
                    }
                }
                
                if (phaseId && state.activePhaseId !== phaseId) {
                    state.activePhaseId = phaseId;
                    saveState();
                    
                    // Update tab buttons active styling
                    document.querySelectorAll('.phase-tab-btn').forEach(btn => {
                        const tabNumText = btn.querySelector('.tab-num').textContent.toLowerCase();
                        const activeNum = phaseId.split('_')[1];
                        if (tabNumText.includes(`phase ${activeNum}`)) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                    
                    showActivePhase();
                }
                
                openDetailsDrawer(parentCode, childId);
            }
        });

        const deleteBtn = itemEl.querySelector('.todo-delete-btn');
        deleteBtn.addEventListener('click', () => {
            state.todoList = state.todoList.filter(todo => todo.id !== item.id);
            saveState();
            renderTodoList();
        });

        todoListEl.appendChild(itemEl);
    });
}

// Add Custom Task
function addCustomTask(title) {
    state.todoList.push({
        id: Date.now().toString(),
        title: title,
        isDone: false,
        type: 'custom'
    });
    saveState();
    renderTodoList();
    todoInput.value = '';
}

// Event Listeners
function setupEventListeners() {
    drawerCloseBtn.addEventListener('click', closeDetailsDrawer);
    drawerBackdrop.addEventListener('click', closeDetailsDrawer);

    // Status change for main topic (only relevant when no nested subtopics)
    drawerStatusSelect.addEventListener('change', () => {
        if (!activeSubtopicCode) return;
        const newStatus = drawerStatusSelect.value;
        state.subtopicStatuses[activeSubtopicCode] = newStatus;
        
        const todoItem = state.todoList.find(t => t.type === 'subtopic' && t.code === activeSubtopicCode);
        if (todoItem) {
            todoItem.isDone = (newStatus === 'completed');
            renderTodoList();
        }

        saveState();
        updateStats();
        renderRoadmapCard(activeSubtopicCode);
    });

    drawerAddTodoBtn.addEventListener('click', () => {
        if (!activeSubtopicCode) return;
        addToTodo(activeSubtopicCode);
    });

    drawerNotesSaveBtn.addEventListener('click', () => {
        if (!activeSubtopicCode) return;
        state.subtopicNotes[activeSubtopicCode] = drawerNotesEl.value;
        saveState();
        showToast('Notes saved successfully!');
    });

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text) {
            addCustomTask(text);
        }
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.subtopic-card');
        
        cards.forEach(card => {
            const name = card.getAttribute('data-topic-name') || '';
            const code = card.getAttribute('data-topic-code') || '';
            if (name.includes(query) || code.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });

        const phases = document.querySelectorAll('.phase-card');
        phases.forEach(phase => {
            const visibleCards = phase.querySelectorAll('.subtopic-card:not([style*="display: none"])');
            if (visibleCards.length === 0 && query !== '') {
                phase.style.display = 'none';
            } else {
                phase.style.display = 'block';
            }
        });
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            const phases = document.querySelectorAll('.phase-card');
            
            phases.forEach(phase => {
                const phaseType = phase.getAttribute('data-phase-type');
                if (filter === 'all') {
                    phase.style.display = 'block';
                } else if (filter === 'prereq') {
                    phase.style.display = (phaseType === 'prereq') ? 'block' : 'none';
                } else if (filter === 'core') {
                    phase.style.display = (phaseType === 'core') ? 'block' : 'none';
                }
            });
        });
    });

    // Theme Toggle Click Handler
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const body = document.body;
            body.classList.toggle('light-theme');
            const isLight = body.classList.contains('light-theme');
            state.theme = isLight ? 'light' : 'dark';
            saveState();
            
            const toggleIcon = document.querySelector('.theme-toggle-icon');
            if (toggleIcon) {
                toggleIcon.textContent = isLight ? '☀️' : '🌙';
            }
            showToast(`Switched to ${isLight ? 'Light' : 'Dark'} Mode!`);
        });
    }

    // Export Progress Backup
    const exportBtn = document.getElementById('export-backup-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "fde_roadmap_progress.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Progress backup file downloaded!");
        });
    }

    // Import Progress Backup
    const importBtn = document.getElementById('import-backup-btn');
    const importInput = document.getElementById('import-file-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if (imported.subtopicStatuses && imported.todoList) {
                        state = imported;
                        saveState();
                        
                        renderRoadmap();
                        renderTodoList();
                        updateStats();
                        
                        const body = document.body;
                        if (state.theme === 'light') {
                            body.classList.add('light-theme');
                            document.querySelector('.theme-toggle-icon').textContent = '☀️';
                        } else {
                            body.classList.remove('light-theme');
                            document.querySelector('.theme-toggle-icon').textContent = '🌙';
                        }
                        
                        showToast("Progress successfully restored!");
                    } else {
                        showToast("Invalid backup file structure!");
                    }
                } catch (err) {
                    showToast("Failed to read file!");
                }
            };
            reader.readAsText(file);
        });
    }

    // Outline Minimap listeners removed for tabbed layout

    // Export Study Notes Journal Click
    const exportNotesBtn = document.getElementById('export-notes-btn');
    if (exportNotesBtn) {
        exportNotesBtn.addEventListener('click', exportStudyJournal);
    }

    // Pomodoro Timer Control Listeners
    const pomoStartBtn = document.getElementById('pomo-start-btn');
    const pomoResetBtn = document.getElementById('pomo-reset-btn');
    if (pomoStartBtn) {
        pomoStartBtn.addEventListener('click', togglePomoTimer);
    }
    if (pomoResetBtn) {
        pomoResetBtn.addEventListener('click', resetPomoTimer);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'rgba(30, 41, 59, 0.95)';
    toast.style.border = '1px solid var(--color-primary)';
    toast.style.color = '#fff';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '9999';
    toast.style.transition = 'all 0.3s';
    toast.style.backdropFilter = 'blur(10px)';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', init);

// Pomodoro Audio Notification Chime (Synth Beep)
function playPomoChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
        console.error("Web Audio chime failed", e);
    }
}

// Update the Pomodoro widget display
function updatePomoDisplay() {
    const display = document.getElementById('pomo-display');
    if (!display) return;
    
    const minutes = Math.floor(pomoTimeLeft / 60);
    const seconds = pomoTimeLeft % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Toggle Start/Pause on Pomodoro
function togglePomoTimer() {
    const startBtn = document.getElementById('pomo-start-btn');
    const statusText = document.getElementById('pomo-status');
    
    if (pomoIsActive) {
        // Pause timer
        clearInterval(pomoInterval);
        pomoIsActive = false;
        if (startBtn) startBtn.textContent = '▶ Resume';
        if (statusText) statusText.textContent = `${pomoMode === 'focus' ? 'Focus Session' : 'Break'} paused`;
    } else {
        // Start/Resume timer
        pomoIsActive = true;
        if (startBtn) startBtn.textContent = '⏸ Pause';
        if (statusText) statusText.textContent = pomoMode === 'focus' ? '💻 Focus Time!' : '☕ Take a Break!';
        
        pomoInterval = setInterval(() => {
            pomoTimeLeft--;
            updatePomoDisplay();
            
            if (pomoTimeLeft <= 0) {
                clearInterval(pomoInterval);
                pomoIsActive = false;
                playPomoChime();
                
                if (pomoMode === 'focus') {
                    pomoMode = 'break';
                    pomoTimeLeft = 300; // 5 min break
                    showToast("Focus session complete! Time for a short break ☕");
                    if (statusText) statusText.textContent = '☕ Take a Break!';
                } else {
                    pomoMode = 'focus';
                    pomoTimeLeft = 1500; // 25 min focus
                    showToast("Break over! Let's focus 💻");
                    if (statusText) statusText.textContent = '💻 Focus Time!';
                }
                
                if (startBtn) startBtn.textContent = '▶ Start';
                updatePomoDisplay();
            }
        }, 1000);
    }
}

// Reset Pomodoro Timer
function resetPomoTimer() {
    clearInterval(pomoInterval);
    pomoIsActive = false;
    pomoMode = 'focus';
    pomoTimeLeft = 1500;
    
    const startBtn = document.getElementById('pomo-start-btn');
    const statusText = document.getElementById('pomo-status');
    
    if (startBtn) startBtn.textContent = '▶ Start';
    if (statusText) statusText.textContent = 'Ready to Focus';
    updatePomoDisplay();
}

// Compile and download personal study notes as a Markdown journal file
function exportStudyJournal() {
    let mdContent = `# FDE Mastery Study Journal\n`;
    mdContent += `*Generated study guide containing your personal learning notes.*\n\n`;
    mdContent += `---\n\n`;
    
    let hasNotes = false;
    
    window.roadmapData.forEach(phase => {
        let phaseContent = `## Phase ${phase.number}: ${phase.title}\n\n`;
        let phaseHasNotes = false;
        
        phase.topics.forEach(topic => {
            // Check parent topic note
            const parentNote = state.subtopicNotes[topic.code];
            
            // Check subtopics notes
            let subtopicsNotesStr = '';
            if (topic.subtopics) {
                topic.subtopics.forEach(sub => {
                    const subKey = `${topic.code}_${sub.id}`;
                    const subNote = state.subtopicNotes[subKey];
                    if (subNote && subNote.trim()) {
                        subtopicsNotesStr += `#### 📝 Subtopic: ${sub.name}\n${subNote.trim()}\n\n`;
                    }
                });
            }
            
            if ((parentNote && parentNote.trim()) || subtopicsNotesStr) {
                phaseHasNotes = true;
                hasNotes = true;
                phaseContent += `### 📂 Topic ${topic.code}: ${topic.name}\n\n`;
                
                if (parentNote && parentNote.trim()) {
                    phaseContent += `#### 📝 Main Concepts Note\n${parentNote.trim()}\n\n`;
                }
                
                if (subtopicsNotesStr) {
                    phaseContent += subtopicsNotesStr;
                }
                
                phaseContent += `\n`;
            }
        });
        
        if (phaseHasNotes) {
            mdContent += phaseContent + `---\n\n`;
        }
    });
    
    if (!hasNotes) {
        showToast("No notes written yet! Open any topic details to write custom learning notes.");
        return;
    }
    
    // Trigger download
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "fde_study_journal.md");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Study journal notes exported!");
}

