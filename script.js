// Process class to represent a CPU process
class Process {
    constructor(id, name, arrivalTime, burstTime) {
        this.id = id;
        this.name = name;
        this.arrivalTime = parseInt(arrivalTime);
        this.burstTime = parseInt(burstTime);
        this.completionTime = null;
        this.turnaroundTime = null;
        this.waitingTime = null;
        this.color = getProcessColor(id);
    }
}

// Global variables
let processes = [];
let timeline = [];
let currentId = 1;
let readyQueue = [];
let terminatedProcesses = [];
let currentProcessInCPU = null;
let currentTime = 0;
let animationInterval = null;

// Color palette for process visualization
function getProcessColor(id) {
    const colors = [
        { bg: '#007BFF', text: '#ffffff' }, // Blue
        { bg: '#28a745', text: '#ffffff' }, // Green
        { bg: '#dc3545', text: '#ffffff' }, // Red
        { bg: '#fd7e14', text: '#000000' }, // Orange
        { bg: '#6f42c1', text: '#ffffff' }, // Purple
        { bg: '#e83e8c', text: '#ffffff' }, // Pink
        { bg: '#17a2b8', text: '#ffffff' }, // Teal
        { bg: '#20c997', text: '#000000' }, // Cyan
        { bg: '#6c757d', text: '#ffffff' }, // Gray
        { bg: '#ffc107', text: '#000000' }  // Yellow
    ];
    return colors[(id - 1) % colors.length];
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Process form submission
    const processForm = document.getElementById('processForm');
    processForm.addEventListener('submit', handleFormSubmit);
    
    // Load example button
    const loadExampleBtn = document.getElementById('loadExampleBtn');
    loadExampleBtn.addEventListener('click', loadExampleProcesses);
    
    // Clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    clearAllBtn.addEventListener('click', clearAllProcesses);
    
    // Start simulation button
    const startSimulationBtn = document.getElementById('startSimulationBtn');
    startSimulationBtn.addEventListener('click', startSimulation);
    
    // Animation control button
    const animationControlBtn = document.getElementById('animationControlBtn');
    animationControlBtn.addEventListener('click', toggleAnimation);
    
    // Initialize animation features
    initializeAnimationFeatures();
});

// Initialize animation features
function initializeAnimationFeatures() {
    console.log("Initializing animation features");
    createAnimationContainer();
    initializeGanttFeatures();
}

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form inputs
    const nameInput = document.getElementById('processName');
    const arrivalTimeInput = document.getElementById('arrivalTime');
    const burstTimeInput = document.getElementById('burstTime');
    
    // Reset validation state
    resetValidation([nameInput, arrivalTimeInput, burstTimeInput]);
    
    // Validate inputs
    let isValid = true;
    
    if (!nameInput.value.trim()) {
        setInvalid(nameInput, 'Please enter a process name.');
        isValid = false;
    }
    
    if (arrivalTimeInput.value === '' || isNaN(arrivalTimeInput.value) || parseInt(arrivalTimeInput.value) < 0) {
        setInvalid(arrivalTimeInput, 'Please enter a valid arrival time (≥ 0).');
        isValid = false;
    }
    
    if (burstTimeInput.value === '' || isNaN(burstTimeInput.value) || parseInt(burstTimeInput.value) < 1) {
        setInvalid(burstTimeInput, 'Please enter a valid burst time (≥ 1).');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Create process object
    const process = new Process(
        currentId++,
        nameInput.value.trim(),
        arrivalTimeInput.value,
        burstTimeInput.value
    );
    
    // Add process
    addProcess(process);
    
    // Reset form
    processForm.reset();
    nameInput.focus();
}

// Reset validation state for form inputs
function resetValidation(inputs) {
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}

// Set invalid state for form input
function setInvalid(input, message) {
    input.classList.add('is-invalid');
    
    // Find the associated feedback element
    const feedbackElement = input.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = message;
    }
}

// Add process to the list and update UI
function addProcess(process) {
    processes.push(process);
    updateProcessTable();
    
    // Enable start simulation button if at least one process exists
    document.getElementById('startSimulationBtn').disabled = processes.length === 0;
    
    // Hide empty table message if processes exist
    document.getElementById('emptyTableMessage').style.display = processes.length === 0 ? 'block' : 'none';
}

// Remove process from the list
function removeProcess(id) {
    processes = processes.filter(p => p.id !== id);
    updateProcessTable();
    
    // Disable start simulation button if no processes
    document.getElementById('startSimulationBtn').disabled = processes.length === 0;
    
    // Show empty table message if no processes
    document.getElementById('emptyTableMessage').style.display = processes.length === 0 ? 'block' : 'none';
}

// Clear all processes
function clearAllProcesses() {
    processes = [];
    updateProcessTable();
    
    // Disable start simulation button
    document.getElementById('startSimulationBtn').disabled = true;
    
    // Show empty table message
    document.getElementById('emptyTableMessage').style.display = 'block';
    
    // Hide visualization section
    document.getElementById('visualizationSection').classList.add('d-none');
    
    // Reset animation and timeline
    resetVisualization();
}

// Load example processes
function loadExampleProcesses() {
    // Clear existing processes
    processes = [];
    currentId = 1;
    
    // Example processes
    const exampleProcesses = [
        new Process(currentId++, 'P1', 0, 5),
        new Process(currentId++, 'P2', 1, 3),
        new Process(currentId++, 'P3', 2, 6),
        new Process(currentId++, 'P4', 4, 2)
    ];
    
    // Add example processes
    exampleProcesses.forEach(process => {
        processes.push(process);
    });
    
    updateProcessTable();
    
    // Enable start simulation button
    document.getElementById('startSimulationBtn').disabled = false;
    
    // Hide empty table message
    document.getElementById('emptyTableMessage').style.display = 'none';
}

// Update process table
function updateProcessTable() {
    const tableBody = document.getElementById('processTableBody');
    tableBody.innerHTML = '';
    
    processes.forEach(process => {
        const row = document.createElement('tr');
        row.className = 'process-row';
        row.innerHTML = `
            <td>${process.id}</td>
            <td>${process.name}</td>
            <td>${process.arrivalTime}</td>
            <td>${process.burstTime}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${process.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = parseInt(button.dataset.id);
            removeProcess(id);
        });
    });
}

// Calculate FCFS schedule
function calculateFCFS(processes) {
    if (!processes || processes.length === 0) return { timeline: [], metrics: { avgTAT: 0, avgWT: 0, cpuUtilization: 0 } };
    
    // Clone processes to avoid modifying original
    const processesToSchedule = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    let currentTime = 0;
    let timeline = [];
    let completedProcesses = [];
    
    // Process each process in arrival time order
    for (let i = 0; i < processesToSchedule.length; i++) {
        const process = processesToSchedule[i];
        
        // If there's a gap, add idle time to timeline
        if (process.arrivalTime > currentTime) {
            timeline.push({
                isIdle: true,
                start: currentTime,
                end: process.arrivalTime
            });
            currentTime = process.arrivalTime;
        }
        
        // Add process to timeline
        const startTime = Math.max(currentTime, process.arrivalTime);
        const endTime = startTime + process.burstTime;
        
        timeline.push({
            process: process,
            start: startTime,
            end: endTime
        });
        
        // Update current time
        currentTime = endTime;
        
        // Calculate turnaround and waiting time
        const completionTime = endTime;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.burstTime;
        
        // Store calculated values
        process.completionTime = completionTime;
        process.turnaroundTime = turnaroundTime;
        process.waitingTime = waitingTime;
        
        completedProcesses.push(process);
    }
    
    // Calculate metrics
    const totalTAT = completedProcesses.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalWT = completedProcesses.reduce((sum, p) => sum + p.waitingTime, 0);
    const avgTAT = totalTAT / completedProcesses.length;
    const avgWT = totalWT / completedProcesses.length;
    
    // Calculate CPU utilization
    const totalTime = timeline[timeline.length - 1].end;
    const idleTime = timeline.filter(event => event.isIdle).reduce((sum, event) => sum + (event.end - event.start), 0);
    const cpuUtilization = ((totalTime - idleTime) / totalTime) * 100;
    
    return {
        timeline,
        metrics: {
            avgTAT,
            avgWT,
            cpuUtilization
        },
        completedProcesses
    };
}

// Start simulation
function startSimulation() {
    if (processes.length === 0) return;
    
    // Calculate FCFS schedule
    const result = calculateFCFS(processes);
    timeline = result.timeline;
    
    // Show visualization section
    document.getElementById('visualizationSection').classList.remove('d-none');
    
    // Initialize visualization
    initializeVisualization(result.completedProcesses, timeline);
    
    // Update metrics
    updateMetrics(result.metrics);
    
    // Reset animation state
    resetVisualization();
    
    // Scroll to visualization section
    document.getElementById('visualizationSection').scrollIntoView({ behavior: 'smooth' });
}

// Initialize visualization
function initializeVisualization(scheduledProcesses, timeline) {
    // Create Gantt chart
    createGanttChart(timeline);
    
    // Reset queues
    readyQueue = [];
    terminatedProcesses = [];
    currentProcessInCPU = null;
    
    // Initialize queue displays
    updateQueueDisplay('readyQueue', []);
    updateCPUDisplay(null, true);
    updateQueueDisplay('terminatedQueue', []);
    
    // Reset animation controls
    const animationBtn = document.getElementById('animationControlBtn');
    animationBtn.innerHTML = '<i class="bi bi-play-fill me-1"></i>Play Animation';
    animationBtn.dataset.state = 'paused';
}

// Create Gantt chart
function createGanttChart(timeline) {
    const ganttChart = document.getElementById('ganttChart');
    if (!ganttChart) return;
    
    ganttChart.innerHTML = '';
    
    // Calculate scale factor (pixels per time unit)
    const maxTime = timeline.length > 0 ? timeline[timeline.length - 1].end : 0;
    const totalWidth = Math.max(ganttChart.clientWidth - 50, maxTime * 30); // Ensure minimum width
    const scaleFactor = totalWidth / maxTime;
    
    // Create timeline markers container
    const timelineMarkers = document.createElement('div');
    timelineMarkers.className = 'timeline-markers position-absolute bottom-0 w-100 d-flex';
    timelineMarkers.style.height = '20px';
    
    // Create blocks for each timeline event
    timeline.forEach((event, index) => {
        const width = (event.end - event.start) * scaleFactor;
        const block = document.createElement('div');
        block.className = 'process-block d-flex align-items-center justify-content-center';
        block.style.width = `${width}px`;
        block.style.height = '40px';
        block.dataset.start = event.start;
        block.dataset.end = event.end;
        block.dataset.index = index;
        
        if (event.isIdle) {
            // Idle block
            block.style.backgroundColor = '#6c757d';
            block.style.color = '#fff';
            block.textContent = 'Idle';
            block.dataset.process = 'idle';
        } else {
            // Process block
            const process = event.process;
            block.style.backgroundColor = process.color.bg;
            block.style.color = process.color.text;
            block.textContent = process.name;
            block.dataset.process = process.name;
            block.dataset.processId = process.id;
        }
        
        // Add progress bar inside block
        const progressBar = document.createElement('div');
        progressBar.className = 'gantt-progress-bar';
        block.appendChild(progressBar);
        
        ganttChart.appendChild(block);
        
        // Add time marker at the start of the block
        if (index === 0 || event.start > 0) {
            const startMarker = document.createElement('span');
            startMarker.className = 'time-marker position-absolute';
            startMarker.style.left = `${event.start * scaleFactor}px`;
            startMarker.textContent = event.start;
            timelineMarkers.appendChild(startMarker);
        }
        
        // Add time marker at the end of the last block
        if (index === timeline.length - 1) {
            const endMarker = document.createElement('span');
            endMarker.className = 'time-marker position-absolute';
            endMarker.style.left = `${event.end * scaleFactor}px`;
            endMarker.textContent = event.end;
            timelineMarkers.appendChild(endMarker);
        }
    });
    
    // Add time markers to gantt container
    const ganttContainer = document.querySelector('.gantt-container');
    if (ganttContainer) {
        ganttContainer.appendChild(timelineMarkers);
    }
    
    // Create timeline position marker
    const timeMarker = document.createElement('div');
    timeMarker.id = 'timeMarker';
    timeMarker.className = 'timeline-marker';
    timeMarker.style.left = '0px';
    ganttChart.appendChild(timeMarker);
}

// Reset visualization
function resetVisualization() {
    // Reset current time
    currentTime = 0;
    
    // Update time label
    const timeLabel = document.getElementById('currentTimeLabel');
    if (timeLabel) {
        timeLabel.textContent = `Time: ${currentTime}ms`;
    }
    
    // Reset time marker
    const timeMarker = document.getElementById('timeMarker');
    if (timeMarker) {
        timeMarker.style.left = '0px';
    }
    
    // Reset progress bars
    const progressBars = document.querySelectorAll('.gantt-progress-bar');
    progressBars.forEach(bar => {
        bar.style.width = '0%';
    });
    
    // Clear animation interval
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }
    
    // Reset queues to initial state
    readyQueue = [];
    terminatedProcesses = [];
    currentProcessInCPU = null;
    
    // Update queue displays
    updateQueuesAtTime(0);
}

// Toggle animation
function toggleAnimation() {
    console.log("Toggle animation called");
    
    const animationBtn = document.getElementById('animationControlBtn');
    if (!animationBtn) {
        console.error("Animation button not found");
        return;
    }
    
    const state = animationBtn.dataset.state || 'paused';
    console.log("Current animation state:", state);
    
    if (state === 'paused') {
        // Start animation
        animationBtn.innerHTML = '<i class="bi bi-pause-fill me-1"></i> Pause Animation';
        animationBtn.dataset.state = 'playing';
        
        // Reset to beginning if we were at the end
        if (state === 'ended') {
            resetVisualization();
        }
        
        // Create animation container if needed
        createAnimationContainer();
        
        // Start animation interval - slower for better visualization
        console.log("Starting animation interval");
        animationInterval = setInterval(() => {
            updateAnimation();
        }, 800); // Update every 800ms for better visibility
    } else if (state === 'playing') {
        // Pause animation
        animationBtn.innerHTML = '<i class="bi bi-play-fill me-1"></i> Resume Animation';
        animationBtn.dataset.state = 'paused';
        
        // Clear interval
        console.log("Pausing animation");
        clearInterval(animationInterval);
        animationInterval = null;
    } else if (state === 'ended') {
        // Restart animation
        resetVisualization();
        animationBtn.innerHTML = '<i class="bi bi-pause-fill me-1"></i> Pause Animation';
        animationBtn.dataset.state = 'playing';
        
        // Start animation interval
        console.log("Restarting animation");
        animationInterval = setInterval(() => {
            updateAnimation();
        }, 800); // Update every 800ms
    }
}

// Update animation
function updateAnimation() {
    if (!timeline || timeline.length === 0) {
        console.log("Timeline is empty, cannot update animation");
        return;
    }
    
    // Get max time from timeline
    const maxTime = timeline[timeline.length - 1].end;
    
    // Increment current time
    currentTime++;
    
    // Update time label
    const timeLabel = document.getElementById('currentTimeLabel');
    if (timeLabel) {
        timeLabel.textContent = `Time: ${currentTime}ms`;
    }
    
    // Move timeline marker with smoother animation
    const ganttChart = document.getElementById('ganttChart');
    const timeMarker = document.getElementById('timeMarker');
    
    if (ganttChart && timeMarker) {
        // Calculate the position based on current time and scale
        const ganttWidth = ganttChart.clientWidth;
        const scaleFactor = ganttWidth / maxTime;
        timeMarker.style.left = `${currentTime * scaleFactor}px`;
        
        // Ensure the Gantt chart is visible during animation
        const ganttContainer = document.querySelector('.gantt-container');
        if (ganttContainer) {
            ganttContainer.scrollLeft = Math.max(0, (currentTime * scaleFactor) - (ganttContainer.clientWidth / 2));
        }
    }
    
    // Check for change in current event and update Gantt accordingly
    const previousEventIndex = findEventIndexAtTime(currentTime - 1);
    const currentEventIndex = findEventIndexAtTime(currentTime);
    
    if (previousEventIndex !== currentEventIndex && currentEventIndex !== -1) {
        // New event started - create a visual effect for the new Gantt block
        const currentEvent = timeline[currentEventIndex];
        createGanttBlockEffect(currentEvent);
    }
    
    // Update queues with visual effects - THIS MUST BE AFTER GANTT UPDATES
    // for proper synchronization
    updateQueuesAtTime(currentTime);
    
    // Update Gantt chart progress
    updateGanttChartProgress(currentTime);
    
    // Stop animation if reached end
    if (currentTime >= maxTime) {
        console.log("Animation complete at time:", currentTime);
        clearInterval(animationInterval);
        animationInterval = null;
        
        // Reset animation button
        const animationBtn = document.getElementById('animationControlBtn');
        if (animationBtn) {
            animationBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-1"></i> Restart Animation';
            animationBtn.dataset.state = 'ended';
        }
        
        // Update queues one last time
        updateQueuesAtTime(maxTime);
        updateGanttChartProgress(maxTime);
    }
}

// Find event index at specific time
function findEventIndexAtTime(time) {
    if (!timeline || timeline.length === 0) return -1;
    
    for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];
        if (time >= event.start && time < event.end) {
            return i;
        }
    }
    
    return -1;
}

// Update queues at specific time
function updateQueuesAtTime(time) {
    if (!timeline || timeline.length === 0) return;
    
    // Get processes at the current time
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    
    // Store previous state for animations
    const prevReadyQueue = readyQueue ? [...readyQueue] : [];
    const prevTerminatedProcesses = terminatedProcesses ? [...terminatedProcesses] : [];
    const prevProcessInCPU = currentProcessInCPU;
    
    // Reset queue displays
    readyQueue = [];
    terminatedProcesses = [];
    currentProcessInCPU = null;
    
    // Find the current event in the timeline
    let currentEvent = null;
    for (const event of timeline) {
        if (time >= event.start && time < event.end) {
            currentEvent = event;
            break;
        }
    }
    
    // Update based on current event
    if (currentEvent) {
        // For each sorted process, determine its state at the current time
        sortedProcesses.forEach(process => {
            // If process has arrived
            if (process.arrivalTime <= time) {
                if (currentEvent.isIdle || (currentEvent.process && currentEvent.process.id !== process.id)) {
                    // Process is in ready queue or terminated queue
                    if (getCompletionTime(process.id) > time) {
                        readyQueue.push(process);
                    } else {
                        // Process has completed
                        terminatedProcesses.push(process);
                    }
                } else if (currentEvent.process && currentEvent.process.id === process.id) {
                    // Process is currently executing in CPU
                    currentProcessInCPU = process;
                }
            }
        });
    }
    
    // IMPORTANT: Check for process transitions for animation
    // 1. Process moving from ready queue to CPU
    if (currentProcessInCPU && prevReadyQueue.find(p => p.id === currentProcessInCPU.id) && !prevProcessInCPU) {
        console.log("Process moving from ready queue to CPU:", currentProcessInCPU.name);
        animateProcessMovement(currentProcessInCPU, 'ready-to-cpu');
    }
    
    // 2. Process moving from CPU to terminated
    if (prevProcessInCPU && terminatedProcesses.find(p => p.id === prevProcessInCPU.id)) {
        console.log("Process moving from CPU to terminated:", prevProcessInCPU.name);
        animateProcessMovement(prevProcessInCPU, 'cpu-to-terminated');
    }
    
    // Update queue displays
    updateQueueDisplay('readyQueue', readyQueue);
    updateCPUDisplay(currentProcessInCPU, currentEvent && currentEvent.isIdle);
    updateQueueDisplay('terminatedQueue', terminatedProcesses);
}

// Update queue display
function updateQueueDisplay(elementId, queueProcesses) {
    const queueElement = document.getElementById(elementId);
    if (!queueElement) return;
    
    queueElement.innerHTML = '';
    
    if (queueProcesses.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center text-muted py-2';
        emptyMessage.textContent = 'Empty';
        queueElement.appendChild(emptyMessage);
        return;
    }
    
    queueProcesses.forEach(process => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item mb-2';
        queueItem.style.backgroundColor = process.color.bg;
        queueItem.style.color = process.color.text;
        queueItem.textContent = `${process.name} (Arrival: ${process.arrivalTime}, Burst: ${process.burstTime})`;
        queueElement.appendChild(queueItem);
    });
}

// Update CPU display
function updateCPUDisplay(process, isIdle) {
    const cpuElement = document.getElementById('cpuExecution');
    if (!cpuElement) return;
    
    cpuElement.innerHTML = '';
    
    if (isIdle || !process) {
        cpuElement.classList.add('idle');
        return;
    }
    
    cpuElement.classList.remove('idle');
    
    const cpuItem = document.createElement('div');
    cpuItem.className = 'queue-item';
    cpuItem.style.backgroundColor = process.color.bg;
    cpuItem.style.color = process.color.text;
    cpuItem.innerHTML = `
        <div class="fw-bold">${process.name}</div>
        <div>Arrival: ${process.arrivalTime}, Burst: ${process.burstTime}</div>
        <div class="progress mt-1" style="height: 5px;">
            <div class="progress-bar" style="width: 50%;"></div>
        </div>
    `;
    cpuElement.appendChild(cpuItem);
}

// Get completion time for a process
function getCompletionTime(processId) {
    for (const event of timeline) {
        if (!event.isIdle && event.process && event.process.id === processId) {
            return event.end;
        }
    }
    return Infinity;
}

// Update metrics display
function updateMetrics(metrics) {
    const avgTATElement = document.getElementById('avgTAT');
    const avgWTElement = document.getElementById('avgWT');
    const cpuUtilizationElement = document.getElementById('cpuUtilization');
    
    if (avgTATElement) avgTATElement.textContent = metrics.avgTAT.toFixed(2) + ' ms';
    if (avgWTElement) avgWTElement.textContent = metrics.avgWT.toFixed(2) + ' ms';
    if (cpuUtilizationElement) cpuUtilizationElement.textContent = metrics.cpuUtilization.toFixed(2) + '%';
}

// Add Animation Container
function createAnimationContainer() {
    // First check if container already exists
    let animationContainer = document.getElementById('processMoveAnimation');
    
    if (!animationContainer) {
        // Create a container for process movement animation if it doesn't exist
        animationContainer = document.createElement('div');
        animationContainer.id = 'processMoveAnimation';
        document.body.appendChild(animationContainer);
    }
    
    return animationContainer;
}

// Animate process movement
function animateProcessMovement(process, movementType) {
    console.log("Animating process movement:", process.name, movementType);
    
    // Create or get animation container
    const animationContainer = createAnimationContainer();
    animationContainer.innerHTML = '';
    
    // Create the moving process element
    const movingProcess = document.createElement('div');
    movingProcess.className = 'process-moving';
    movingProcess.style.backgroundColor = process.color.bg;
    movingProcess.style.color = process.color.text;
    movingProcess.textContent = process.name;
    
    // Add arrows to indicate direction
    const arrowElement = document.createElement('div');
    
    // Get the positions of elements on screen
    const readyQueueRect = document.getElementById('readyQueue').getBoundingClientRect();
    const cpuRect = document.getElementById('cpuExecution').getBoundingClientRect();
    const terminatedRect = document.getElementById('terminatedQueue').getBoundingClientRect();
    const containerRect = animationContainer.getBoundingClientRect();
    
    if (movementType === 'ready-to-cpu') {
        // Add ready to CPU arrow
        arrowElement.className = 'queue-arrow arrow-ready-to-cpu';
        arrowElement.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>';
        const readyQueueColumn = document.querySelector('.col-md-4:nth-child(1)');
        if (readyQueueColumn) readyQueueColumn.appendChild(arrowElement);
        
        // Set initial position (in ready queue)
        movingProcess.style.top = `${readyQueueRect.top - containerRect.top + 20}px`;
        movingProcess.style.left = `${readyQueueRect.right - containerRect.left - 70}px`;
        
        // Add to container
        animationContainer.appendChild(movingProcess);
        
        // Animate to CPU with delay for visibility
        setTimeout(() => {
            movingProcess.style.top = `${cpuRect.top - containerRect.top + 20}px`;
            movingProcess.style.left = `${cpuRect.left - containerRect.left + 30}px`;
            
            // Highlight CPU
            const cpuElement = document.getElementById('cpuExecution');
            if (cpuElement) cpuElement.classList.add('highlight');
            
            // Remove arrow and element after animation
            setTimeout(() => {
                arrowElement.remove();
                movingProcess.remove();
                if (cpuElement) cpuElement.classList.remove('highlight');
            }, 800);
        }, 200);
    } 
    else if (movementType === 'cpu-to-terminated') {
        // Add CPU to terminated arrow
        arrowElement.className = 'queue-arrow arrow-cpu-to-terminated';
        arrowElement.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>';
        const cpuColumn = document.querySelector('.col-md-4:nth-child(2)');
        if (cpuColumn) cpuColumn.appendChild(arrowElement);
        
        // Set initial position (in CPU)
        movingProcess.style.top = `${cpuRect.top - containerRect.top + 20}px`;
        movingProcess.style.left = `${cpuRect.right - containerRect.left - 70}px`;
        
        // Add to container
        animationContainer.appendChild(movingProcess);
        
        // Animate to terminated with delay for visibility
        setTimeout(() => {
            movingProcess.style.top = `${terminatedRect.top - containerRect.top + 20}px`;
            movingProcess.style.left = `${terminatedRect.left - containerRect.left + 30}px`;
            
            // Highlight terminated queue
            const terminatedElement = document.getElementById('terminatedQueue');
            if (terminatedElement) terminatedElement.classList.add('highlight');
            
            // Remove arrow and element after animation
            setTimeout(() => {
                arrowElement.remove();
                movingProcess.remove();
                if (terminatedElement) terminatedElement.classList.remove('highlight');
            }, 800);
        }, 200);
    }
}

// Initialize Gantt Features
function initializeGanttFeatures() {
    console.log("Initializing enhanced Gantt features");
}

// Create Gantt Block Effect
function createGanttBlockEffect(event) {
    const ganttChart = document.getElementById('ganttChart');
    if (!ganttChart) return;
    
    // Find the block that corresponds to the current event
    const processBlocks = ganttChart.querySelectorAll('.process-block');
    let currentBlock = null;
    
    processBlocks.forEach(block => {
        const blockStart = parseInt(block.dataset.start);
        const blockEnd = parseInt(block.dataset.end);
        
        if (blockStart === event.start && blockEnd === event.end) {
            currentBlock = block;
            // Add highlight effect
            currentBlock.classList.add('highlight-block');
            
            // Get process details for coordination with queue
            if (!event.isIdle) {
                // Coordinate with CPU queue highlight
                const cpuExecution = document.getElementById('cpuExecution');
                if (cpuExecution) cpuExecution.classList.add('highlight');
                
                setTimeout(() => {
                    if (cpuExecution) cpuExecution.classList.remove('highlight');
                }, 800);
            }
            
            // Remove highlight after animation
            setTimeout(() => {
                currentBlock.classList.remove('highlight-block');
            }, 800);
        }
    });
}

// Update Gantt Chart Progress
function updateGanttChartProgress(currentTime) {
    const ganttChart = document.getElementById('ganttChart');
    if (!ganttChart) return;
    
    // Find the current event in the timeline
    let currentEvent = null;
    let currentEventIndex = -1;
    
    for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];
        if (currentTime >= event.start && currentTime <= event.end) {
            currentEvent = event;
            currentEventIndex = i;
            break;
        }
    }
    
    if (!currentEvent) return;
    
    // Get all process blocks
    const processBlocks = ganttChart.querySelectorAll('.process-block');
    
    // Update each block - reset non-active blocks and update current block
    processBlocks.forEach(block => {
        const blockIndex = parseInt(block.dataset.index);
        const blockStart = parseInt(block.dataset.start);
        const blockEnd = parseInt(block.dataset.end);
        const progressBar = block.querySelector('.gantt-progress-bar');
        
        // Remove building status from all blocks first
        block.classList.remove('building');
        
        // Current block
        if (blockStart === currentEvent.start && blockEnd === currentEvent.end) {
            // Calculate progress percentage within this block
            const blockDuration = blockEnd - blockStart;
            const elapsed = currentTime - blockStart;
            const progressPercent = Math.min(100, (elapsed / blockDuration) * 100);
            
            // Add building effect to current block
            block.classList.add('building');
            
            // Update progress bar
            if (progressBar) {
                progressBar.style.width = `${progressPercent}%`;
            }
        } 
        // Completed blocks - ensure they show 100% progress
        else if (blockEnd <= currentTime) {
            if (progressBar) {
                progressBar.style.width = '100%';
            }
        }
        // Upcoming blocks - ensure they show 0% progress
        else if (blockStart > currentTime) {
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }
    });
    
    // Create or update connection line to show relationship between Gantt chart and queues
    createConnectionToQueue(currentEvent, currentTime);
}

// Create Connection to Queue
function createConnectionToQueue(currentEvent, currentTime) {
    // Remove any existing connections
    document.querySelectorAll('.gantt-connection-line').forEach(line => line.remove());
    
    if (!currentEvent || currentEvent.isIdle) return;
    
    const ganttChart = document.getElementById('ganttChart');
    const cpuExecution = document.getElementById('cpuExecution');
    
    if (!ganttChart || !cpuExecution) return;
    
    // Get positions
    const ganttRect = ganttChart.getBoundingClientRect();
    const cpuRect = cpuExecution.getBoundingClientRect();
    
    // Find current block in gantt chart
    const currentBlock = ganttChart.querySelector(`.process-block[data-start="${currentEvent.start}"][data-end="${currentEvent.end}"]`);
    if (!currentBlock) return;
    
    const blockRect = currentBlock.getBoundingClientRect();
    
    // Create connection line
    const connectionLine = document.createElement('div');
    connectionLine.className = 'gantt-connection-line';
    document.body.appendChild(connectionLine);
    
    // Calculate positions (from bottom of gantt block to top of CPU)
    const startX = blockRect.left + (blockRect.width / 2);
    const startY = blockRect.bottom;
    const endY = cpuRect.top;
    
    // Set connection line position and height
    connectionLine.style.left = `${startX}px`;
    connectionLine.style.top = `${startY}px`;
    connectionLine.style.height = `${endY - startY}px`;
    
    // Show the connection with animation
    setTimeout(() => {
        connectionLine.style.opacity = '1';
    }, 100);
    
    // Remove after a short time
    setTimeout(() => {
        connectionLine.style.opacity = '0';
        setTimeout(() => connectionLine.remove(), 500);
    }, 1500);
}