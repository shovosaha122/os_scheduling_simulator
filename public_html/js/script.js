let selectedAlgorithm = "";


const algorithmTheoryData = {
    fcfs: {
        title: "First Come First Serve (FCFS)",
        desc: "FCFS is a non-preemptive scheduling algorithm where the process that requests the CPU first gets allocated the CPU first. It is managed with a FIFO (First-In, First-Out) queue setup. While straightforward, it can suffer from the 'Convoy Effect' where short processes wait a long time for a single long process to finish executing."
    },
    sjf: {
        title: "Shortest Job First (SJF)",
        desc: "SJF is a non-preemptive algorithm that associates each process with the length of its next CPU burst. When the CPU becomes available, it is assigned to the process with the smallest burst time. If two processes have matching burst times, FCFS is used to break the tie."
    },
    srtf: {
        title: "Shortest Remaining Time First (SRTF)",
        desc: "SRTF is the preemptive version of SJF scheduling. A newly arriving process can interrupt the currently executing process if its remaining burst time is shorter than what is left of the active process's burst time. It optimizes for minimal waiting turnarounds."
    },
    priority: {
        title: "Priority Scheduling",
        desc: "In Priority Scheduling, each process is assigned a priority index value, and the CPU is allocated to the process with the highest priority (this simulation assumes lower integer values signify a higher priority level). If matching priorities occur, execution falls back onto FCFS rules."
    },
    rr: {
        title: "Round Robin (RR)",
        desc: "Round Robin is a cyclic, preemptive scheduling algorithm designed specifically for time-sharing systems. A small unit of time, called a 'Time Quantum', is defined. The CPU scheduler goes around the ready queue, allocating the CPU to each process for a time interval of up to 1 time quantum."
    }
};


const STARVATION_THRESHOLD = 15; 
const AGING_INTERVAL = 5;         


function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");
}

function openAlgorithm(algo) {
    selectedAlgorithm = algo;
    
   
    const data = algorithmTheoryData[algo];
    document.getElementById("theoryTitle").innerText = "📖 Theory: " + data.title;
    document.getElementById("theoryContent").innerHTML = `<h2>${data.title}</h2><p>${data.desc}</p>`;
    
    showPage("theoryPage");
}

function goToInputPage() {
    let title = "";
    if (selectedAlgorithm === "fcfs") title = "FCFS Scheduling Input";
    else if (selectedAlgorithm === "sjf") title = "SJF Scheduling Input";
    else if (selectedAlgorithm === "srtf") title = "SRTF Scheduling Input";
    else if (selectedAlgorithm === "priority") title = "Priority Scheduling Input";
    else if (selectedAlgorithm === "rr") title = "Round Robin Scheduling Input";

    document.getElementById("algoTitle").innerHTML = title;
    document.getElementById("processInputs").innerHTML = "";
    document.getElementById("numProcesses").value = "";
    
    showPage("inputPage");
}

function backToTheory() {
    showPage("theoryPage");
}


function quickLoadSimulator(loadType) {
    let numProc = 3;
    if (loadType === 'medium') numProc = 6;
    if (loadType === 'high') numProc = 12;
    
    document.getElementById("numProcesses").value = numProc;
    generateInputs();
    
    for (let i = 0; i < numProc; i++) {
        let calculatedAT = Math.floor(i * 1.5); 
        let calculatedBT = ((i % 3) === 0) ? (i + 3) * 2 : (i + 2);
        
        document.getElementById(`at${i}`).value = calculatedAT;
        document.getElementById(`bt${i}`).value = calculatedBT;
        
        if (selectedAlgorithm === "priority") {
            document.getElementById(`pr${i}`).value = (numProc - i) + 1;
        }
    }
    
    if (selectedAlgorithm === "rr") {
        document.getElementById("tq").value = 3;
    }
}


function generateInputs() {
    let n = parseInt(document.getElementById("numProcesses").value);
    if (isNaN(n) || n <= 0) {
        alert("Enter a valid number of processes");
        return;
    }

    let html = "";
    for (let i = 0; i < n; i++) {
        html += `
        <div class="process-box">
            <h2>Process P${i + 1}</h2>
            <input type="number" min="0" placeholder="Arrival Time (AT)" id="at${i}">
            <input type="number" min="1" placeholder="Burst Time (BT)" id="bt${i}">
        `;
        if (selectedAlgorithm === "priority") {
            html += `<input type="number" min="0" placeholder="Priority (Lower number = Higher Priority)" id="pr${i}">`;
        }
        html += `</div>`;
    }

    if (selectedAlgorithm === "rr") {
        html += `
        <div class="process-box">
            <h2>Time Quantum Configuration</h2>
            <input type="number" min="1" placeholder="Enter Time Quantum (TQ)" id="tq">
        </div>`;
    }

    html += `
    <div class="process-box action-box">
        <button onclick="calculate()">Calculate Performance Metrics</button>
    </div>`;

    document.getElementById("processInputs").innerHTML = html;
}


function calculate() {
    let n = parseInt(document.getElementById("numProcesses").value);
    let processes = [];

    for (let i = 0; i < n; i++) {
        let at = parseInt(document.getElementById(`at${i}`).value);
        let bt = parseInt(document.getElementById(`bt${i}`).value);

        if (isNaN(at) || isNaN(bt)) {
            alert("Please fill all process attributes completely.");
            return;
        }

        let process = {
            pid: i + 1,
            at: at,
            bt: bt,
            rt: bt, 
            ct: 0, tat: 0, wt: 0,
            priority: 0,
            originalPriority: 0,
            starvationDetected: false,
            agingAppliedCount: 0,
            isAgedUrgent: false
        };

        if (selectedAlgorithm === "priority") {
            let pr = parseInt(document.getElementById(`pr${i}`).value);
            if (isNaN(pr)) {
                alert("Please fill priority indices completely.");
                return;
            }
            process.priority = pr;
            process.originalPriority = pr;
        }
        processes.push(process);
    }

    let ganttLog = []; 

    if (selectedAlgorithm === "fcfs") ganttLog = runFCFS(processes);
    else if (selectedAlgorithm === "sjf") ganttLog = runSJF(processes);
    else if (selectedAlgorithm === "srtf") ganttLog = runSRTF(processes);
    else if (selectedAlgorithm === "priority") ganttLog = runPriority(processes); 
    else if (selectedAlgorithm === "rr") {
        let tq = parseInt(document.getElementById("tq").value);
        if (isNaN(tq) || tq <= 0) {
            alert("Enter valid positive Time Quantum values.");
            return;
        }
        ganttLog = runRR(processes, tq);
    }

    
    renderGanttChart(ganttLog);
    buildResultTableHTML(processes); 
    renderPerformanceGraphs(processes);
    renderStarvationAlerts(processes);
    generateAIRecommendation(processes);

    
    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });

    
    showPage("resultPage");
}



function runFCFS(processes) {
    processes.sort((a, b) => a.at - b.at);
    let time = 0;
    let log = [];

    processes.forEach(p => {
        if (time < p.at) {
            time = p.at;
        }
        
        let currentWaitTime = time - p.at;
        if (currentWaitTime >= STARVATION_THRESHOLD) {
            p.starvationDetected = true;
            p.agingAppliedCount = Math.floor((currentWaitTime - STARVATION_THRESHOLD) / AGING_INTERVAL) + 1;
        }

        let start = time;
        time += p.bt;
        p.ct = time;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        log.push({ name: "P" + p.pid, start: start, end: time });
    });
    return log;
}

function runSJF(processes) {
    let time = 0, completed = 0, n = processes.length;
    let visited = new Array(n).fill(false);
    let log = [];

    while (completed < n) {
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && !visited[i]) {
                let currentWaitTime = time - processes[i].at;
                if (currentWaitTime >= STARVATION_THRESHOLD) {
                    processes[i].starvationDetected = true;
                    let excessWait = currentWaitTime - STARVATION_THRESHOLD;
                    if (excessWait % AGING_INTERVAL === 0) {
                        processes[i].agingAppliedCount++;
                        processes[i].isAgedUrgent = true; 
                    }
                }
            }
        }

        let idx = -1;
        let minBT = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && !visited[i] && processes[i].isAgedUrgent) {
                idx = i;
                break; 
            }
        }

        if (idx === -1) {
            for (let i = 0; i < n; i++) {
                if (processes[i].at <= time && !visited[i] && processes[i].bt < minBT) {
                    minBT = processes[i].bt;
                    idx = i;
                }
            }
        }

        if (idx !== -1) {
            let start = time;
            time += processes[idx].bt;
            processes[idx].ct = time;
            processes[idx].tat = processes[idx].ct - processes[idx].at;
            processes[idx].wt = processes[idx].tat - processes[idx].bt;
            visited[idx] = true;
            completed++;
            log.push({ name: "P" + processes[idx].pid, start: start, end: time });
        } else {
            let nextArrival = Infinity;
            for(let i=0; i<n; i++) {
                if(!visited[i] && processes[i].at > time) {
                    nextArrival = Math.min(nextArrival, processes[i].at);
                }
            }
            log.push({ name: "Idle", start: time, end: nextArrival });
            time = nextArrival;
        }
    }
    return log;
}

function runSRTF(processes) {
    let time = 0, completed = 0, n = processes.length;
    let currentProcess = null, startBlockTime = 0;
    let log = [];

    while (completed < n) {
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].rt > 0 && processes[i] !== currentProcess) {
                let currentWaitTime = time - processes[i].at; 
                if (currentWaitTime >= STARVATION_THRESHOLD) {
                    processes[i].starvationDetected = true;
                    if ((currentWaitTime - STARVATION_THRESHOLD) % AGING_INTERVAL === 0) {
                        processes[i].agingAppliedCount++;
                        processes[i].isAgedUrgent = true; 
                    }
                }
            }
        }

        let idx = -1;
        let minRT = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && processes[i].rt > 0 && processes[i].isAgedUrgent) {
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            for (let i = 0; i < n; i++) {
                if (processes[i].at <= time && processes[i].rt > 0 && processes[i].rt < minRT) {
                    minRT = processes[i].rt;
                    idx = i;
                }
            }
        }

        if (idx !== -1) {
            if (currentProcess !== processes[idx]) {
                if (currentProcess !== null) {
                    log.push({ name: "P" + currentProcess.pid, start: startBlockTime, end: time });
                } else if (startBlockTime < time) {
                    log.push({ name: "Idle", start: startBlockTime, end: time });
                }
                currentProcess = processes[idx];
                startBlockTime = time;
            }
            
            currentProcess.rt--;
            time++;

            if (currentProcess.rt === 0) {
                log.push({ name: "P" + currentProcess.pid, start: startBlockTime, end: time });
                currentProcess.ct = time;
                currentProcess.tat = currentProcess.ct - currentProcess.at;
                currentProcess.wt = currentProcess.tat - currentProcess.bt;
                completed++;
                currentProcess = null;
                startBlockTime = time;
            }
        } else {
            if (currentProcess !== null) {
                log.push({ name: "P" + currentProcess.pid, start: startBlockTime, end: time });
                currentProcess = null;
            }
            time++;
        }
    }
    return compressGanttLog(log);
}

function runPriority(processes) {
    let time = 0, completed = 0, n = processes.length;
    let visited = new Array(n).fill(false);
    let log = [];

    while (completed < n) {
        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && !visited[i]) {
                let currentWaitTime = time - processes[i].at;
                if (currentWaitTime >= STARVATION_THRESHOLD) {
                    processes[i].starvationDetected = true;
                    let excessWait = currentWaitTime - STARVATION_THRESHOLD;
                    if (excessWait % AGING_INTERVAL === 0 && processes[i].priority > 1) {
                        processes[i].priority -= 1; 
                        processes[i].agingAppliedCount += 1;
                    }
                }
            }
        }

        let idx = -1;
        let highestPriority = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].at <= time && !visited[i]) {
                if (processes[i].priority < highestPriority) {
                    highestPriority = processes[i].priority;
                    idx = i;
                } else if (processes[i].priority === highestPriority) {
                    if (idx === -1 || processes[i].at < processes[idx].at) {
                        idx = i;
                    }
                }
            }
        }

        if (idx !== -1) {
            let start = time;
            time += processes[idx].bt;
            processes[idx].ct = time;
            processes[idx].tat = processes[idx].ct - processes[idx].at;
            processes[idx].wt = processes[idx].tat - processes[idx].bt;
            visited[idx] = true;
            completed++;
            log.push({ name: "P" + processes[idx].pid, start: start, end: time });
        } else {
            let nextArrival = Infinity;
            for(let i=0; i<n; i++) {
                if(!visited[i] && processes[i].at > time) {
                    nextArrival = Math.min(nextArrival, processes[i].at);
                }
            }
            log.push({ name: "Idle", start: time, end: nextArrival });
            time = nextArrival;
        }
    }
    return log;
}

function runRR(processes, tq) {
    let time = 0, completed = 0, n = processes.length;
    let readyQueue = [];
    let log = [];
    let checked = new Array(n).fill(false);

    processes.sort((a,b) => a.at - b.at);

    function pushArrived(currentTime) {
        for(let i=0; i<n; i++) {
            if(processes[i].at <= currentTime && !checked[i] && processes[i].rt > 0) {
                readyQueue.push(processes[i]);
                checked[i] = true;
            }
        }
    }

    pushArrived(time);

    while (completed < n) {
        readyQueue.forEach(p => {
            let currentWaitTime = time - p.at;
            if (currentWaitTime >= STARVATION_THRESHOLD) {
                p.starvationDetected = true;
                if ((currentWaitTime - STARVATION_THRESHOLD) % AGING_INTERVAL === 0) {
                    p.agingAppliedCount++;
                    p.isAgedUrgent = true;
                }
            }
        });

        readyQueue.sort((a, b) => (b.isAgedUrgent ? 1 : 0) - (a.isAgedUrgent ? 1 : 0));

        if (readyQueue.length > 0) {
            let p = readyQueue.shift();
            let start = time;
            let executionTime = Math.min(p.rt, tq);
            
            time += executionTime;
            p.rt -= executionTime;
            p.isAgedUrgent = false; 
            
            log.push({ name: "P" + p.pid, start: start, end: time });
            pushArrived(time);

            if (p.rt === 0) {
                p.ct = time;
                p.tat = p.ct - p.at;
                p.wt = p.tat - p.bt;
                completed++;
            } else {
                readyQueue.push(p);
            }
        } else {
            let nextArrival = Infinity;
            for(let i=0; i<n; i++) {
                if(processes[i].rt > 0 && processes[i].at > time) {
                    nextArrival = Math.min(nextArrival, processes[i].at);
                }
            }
            log.push({ name: "Idle", start: time, end: nextArrival });
            time = nextArrival;
            pushArrived(time);
        }
    }
    return compressGanttLog(log);
}

function compressGanttLog(log) {
    if(log.length === 0) return log;
    let compressed = [log[0]];
    for(let i=1; i<log.length; i++) {
        let last = compressed[compressed.length - 1];
        if(log[i].name === last.name && log[i].start === last.end) {
            last.end = log[i].end;
        } else {
            compressed.push(log[i]);
        }
    }
    return compressed;
}


function renderStarvationAlerts(processes) {
    let alertHtml = "";
    processes.forEach(p => {
        if (p.starvationDetected) {
            if (p.agingAppliedCount > 0) {
                alertHtml += `
                <div class="starvation-success-item" style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: left; line-height: 1.5;">
                    ⚠️ <strong>Starvation Clarification (Threshold: ${STARVATION_THRESHOLD} Units):</strong> Process <strong>P${p.pid}</strong> spent over 15 units waiting in the queue. <br>
                    🚀 <strong>Aging Action Engine:</strong> Triggered aging mechanism across active scheduling routines. Compensated process execution priority by <strong>+${p.agingAppliedCount} tiers</strong> to bypass line execution holds.
                </div>`;
            } else {
                alertHtml += `
                <div class="starvation-warning-item" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: left; line-height: 1.5;">
                    ⚠️ <strong>Starvation Notice (Threshold: ${STARVATION_THRESHOLD} Units):</strong> Process <strong>P${p.pid}</strong> experienced delayed scheduling execution and crossed safety boundaries.
                </div>`;
            }
        }
    });
    document.getElementById("starvationAlertBox").innerHTML = alertHtml;
}


function generateAIRecommendation(processes) {
    let totalBT = 0, maxBT = 0, totalAT = 0, hasHighVariance = false, n = processes.length;
    
    processes.forEach(p => {
        totalBT += p.bt;
        totalAT += p.at;
        if(p.bt > maxBT) maxBT = p.bt;
    });
    
    let avgBT = totalBT / n;
    processes.forEach(p => {
        if (Math.abs(p.bt - avgBT) > (avgBT * 0.7)) hasHighVariance = true;
    });

    let currentSelectionTitle = algorithmTheoryData[selectedAlgorithm].title;
    let recommendation = "";

    if (selectedAlgorithm === 'fcfs' && hasHighVariance) {
        recommendation = `❌ <strong>Problem Detected:</strong> FCFS is suffering from a severe Convoy Effect because short processes are trapped behind heavy execution bursts.<br>
                          💡 <strong>Better Algorithm Alternative:</strong> Switch to <strong>Shortest Remaining Time First (SRTF)</strong> or <strong>Shortest Job First (SJF)</strong>. This will reduce your average waiting time drastically by scheduling smaller tasks first.`;
    } else if (hasHighVariance && selectedAlgorithm !== 'srtf') {
        recommendation = `⚠️ <strong>Observation:</strong> This workload has a highly unbalanced distribution of execution burst times.<br>
                          💡 <strong>Better Algorithm Alternative:</strong> Use <strong>Shortest Remaining Time First (SRTF)</strong>. Preemption ensures long bursts don't hog the CPU resources, keeping throughput optimal.`;
    } else if (totalAT === 0 && selectedAlgorithm !== 'sjf' && selectedAlgorithm !== 'srtf') {
        recommendation = `ℹ : <strong>Observation:</strong> All processes arrived simultaneously at Time 0.<br>
                          💡 <strong>Better Algorithm Alternative:</strong> Run <strong>Shortest Job First (SJF)</strong>. When arrival times are identical, non-preemptive SJF mathematically guarantees the absolute lowest average waiting time.`;
    } else if (selectedAlgorithm === 'priority') {
        recommendation = `⚠️ <strong>Observation:</strong> While Priority scheduling handles execution urgency well, low-priority processes can remain stuck indefinitely.<br>
                          💡 <strong>Better Algorithm Alternative:</strong> Keep Priority scheduling active, but ensure your <strong>Aging Mechanism</strong> is engaged to balance fairness, or fallback to <strong>Round Robin (RR)</strong> for strict time-sharing systems.`;
    } else {
        recommendation = `✅ <strong>Analysis:</strong> The current workload distribution is highly balanced. Your active selection of <strong>${currentSelectionTitle}</strong> is stable and executing efficiently for this data set.`;
    }

    document.getElementById("aiRecommendationText").innerHTML = recommendation;
}


function renderPerformanceGraphs(processes) {
    processes.sort((a, b) => a.pid - b.pid);
    let maxWT = Math.max(...processes.map(p => p.wt), 1);
    let maxTAT = Math.max(...processes.map(p => p.tat), 1);
    
    let html = `<h2 style="color: #06b6d4; font-size: 24px; margin-bottom: 20px;">📊 Performance Graphs</h2>`;
    html += `<h3 style="margin: 10px 0; font-size:16px; color:#38bdf8;">⏱️ Waiting Time (WT) Graph</h3>`;
    
    processes.forEach(p => {
        let percentage = (p.wt / maxWT) * 100;
        html += `
        <div class="chart-bar-row">
            <div style="opacity:0.9; font-weight:600;">Process P${p.pid}</div>
            <div class="chart-bar-track">
                <div class="chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div style="color:#38bdf8; font-weight:700; text-align:right;">${p.wt}</div>
        </div>`;
    });

    html += `<br><hr class="divider"><br>`;
    html += `<h3 style="margin: 10px 0; font-size:16px; color:#ec4899;">⚡ Turnaround Time (TAT) Graph</h3>`;
    
    processes.forEach(p => {
        let percentage = (p.tat / maxTAT) * 100;
        html += `
        <div class="chart-bar-row">
            <div style="opacity:0.9; font-weight:600;">Process P${p.pid}</div>
            <div class="chart-bar-track">
                <div class="chart-bar-fill tat-fill" style="width: ${percentage}%"></div>
            </div>
            <div style="color:#ec4899; font-weight:700; text-align:right;">${p.tat}</div>
        </div>`;
    });

    document.getElementById("graphicalPerformanceAnalytics").innerHTML = html;
}


function renderGanttChart(log) {
    const container = document.getElementById("ganttContainer");
    container.innerHTML = ""; 

    let timelineDiv = document.createElement("div");
    timelineDiv.className = "gantt-timeline";

    let scaleDiv = document.createElement("div");
    scaleDiv.className = "gantt-scale";

    let totalDuration = log[log.length - 1].end - log[0].start;

    let firstMark = document.createElement("span");
    firstMark.className = "time-mark";
    firstMark.style.left = "0%";
    firstMark.innerText = log[0].start;
    scaleDiv.appendChild(firstMark);

    let accumulatedPercentage = 0;

    log.forEach(item => {
        let duration = item.end - item.start;
        let percentage = (duration / totalDuration) * 100;
        accumulatedPercentage += percentage;

        let block = document.createElement("div");
        block.className = "gantt-block " + (item.name === "Idle" ? "idle-bg" : "process-bg");
        block.style.width = percentage + "%";
        block.innerText = item.name;
        timelineDiv.appendChild(block);

        let mark = document.createElement("span");
        mark.className = "time-mark";
        mark.style.left = accumulatedPercentage + "%";
        mark.innerText = item.end;
        scaleDiv.appendChild(mark);
    });

    container.appendChild(timelineDiv);
    container.appendChild(scaleDiv);
}

function buildResultTableHTML(processes) {
    let totalWT = 0, totalTAT = 0;
    processes.sort((a, b) => a.pid - b.pid);

    let html = `
    <div class="process-box">
    <table>
        <tr>
            <th>Process</th>
            <th>Arrival Time (AT)</th>
            <th>Burst Time (BT)</th>
            <th>Completion Time (CT)</th>
            <th>Turnaround Time (TAT)</th>
            <th>Waiting Time (WT)</th>
        </tr>
    `;

    processes.forEach(p => {
        totalWT += p.wt;
        totalTAT += p.tat;
        let badgeHtml = (p.agingAppliedCount > 0) ? `<span class="aging-badge" style="background:#10b981; color:#fff; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:5px;">Aged +${p.agingAppliedCount}</span>` : "";

        html += `
        <tr>
            <td><strong>P${p.pid}</strong>${badgeHtml}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
        </tr>
        `;
    });

    let avgWT = totalWT / processes.length;
    let avgTAT = totalTAT / processes.length;

    html += `
    </table>
    <div class="result-stats">
        <h2>Average Turnaround Time = ${avgTAT.toFixed(2)} units</h2>
        <h2>Average Waiting Time = ${avgWT.toFixed(2)} units</h2>
    </div>
    </div>
    `;

    document.getElementById("resultBox").innerHTML = html;
}

function backToInput() { showPage("inputPage"); }
function goHome() { showPage("homePage"); }
function exitApp() { if(confirm("Do you want to exit?")) window.close(); }