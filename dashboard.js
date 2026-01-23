let localQueue = [];

// UI Elements
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const stateDisplay = document.getElementById('stateDisplay');
const queueBody = document.querySelector('#queueTable tbody');
const riskFill = document.getElementById('riskFill');
const riskText = document.getElementById('riskText');

// Initialize
chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
  if (response) {
    updateUIState(response.state);
    if (response.queue.length > 0) {
      localQueue = response.queue;
      renderQueue();
    }
  }
});

// Listen for updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'UPDATE_ITEM') {
    localQueue[message.payload.index] = message.payload.item;
    updateRow(message.payload.index);
    calculateRisk();
  } else if (message.action === 'COMPLETED') {
    updateUIState('IDLE');
    alert('Campaign Completed!');
  }
});

document.getElementById('importContacts').addEventListener('click', () => {
  const input = document.getElementById('contactInput').value;
  const lines = input.split('\n').filter(l => l.trim());
  
  localQueue = lines.map(line => {
    const [name, number] = line.split(',').map(s => s.trim());
    return {
      name: name || 'Unknown',
      number: number || 'N/A',
      status: 'PENDING',
      sentAt: '-',
      error: ''
    };
  });
  
  renderQueue();
  calculateRisk();
});

startBtn.addEventListener('click', () => {
  if (localQueue.length === 0) return alert('Please import contacts first.');
  
  const payload = {
    queue: localQueue,
    config: {
      minDelay: parseInt(document.getElementById('minDelay').value),
      maxDelay: parseInt(document.getElementById('maxDelay').value),
      errorRate: 0.05
    }
  };
  
  chrome.runtime.sendMessage({ action: 'START_SENDING', payload }, () => {
    updateUIState('RUNNING');
  });
});

pauseBtn.addEventListener('click', () => {
  const isPaused = pauseBtn.textContent === 'Resume';
  chrome.runtime.sendMessage({ action: isPaused ? 'RESUME_SENDING' : 'PAUSE_SENDING' }, () => {
    updateUIState(isPaused ? 'RUNNING' : 'PAUSED');
  });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'STOP_SENDING' }, () => {
    updateUIState('STOPPED');
  });
});

function updateUIState(state) {
  stateDisplay.textContent = `Status: ${state}`;
  startBtn.disabled = (state === 'RUNNING' || state === 'PAUSED');
  pauseBtn.disabled = (state === 'IDLE' || state === 'STOPPED');
  stopBtn.disabled = (state === 'IDLE');
  
  pauseBtn.textContent = (state === 'PAUSED') ? 'Resume' : 'Pause';
}

function renderQueue() {
  queueBody.innerHTML = '';
  localQueue.forEach((item, index) => {
    const row = document.createElement('tr');
    row.id = `row-${index}`;
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.number}</td>
      <td><span class="status-pill status-${item.status}">${item.status}</span></td>
      <td>${item.sentAt}</td>
      <td>${item.error || '-'}</td>
    `;
    queueBody.appendChild(row);
  });
}

function updateRow(index) {
  const item = localQueue[index];
  const row = document.getElementById(`row-${index}`);
  if (row) {
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.number}</td>
      <td><span class="status-pill status-${item.status}">${item.status}</span></td>
      <td>${item.sentAt}</td>
      <td>${item.error || '-'}</td>
    `;
  }
}

function calculateRisk() {
  const minDelay = parseInt(document.getElementById('minDelay').value);
  const volume = localQueue.length;
  
  let riskScore = 0;
  if (minDelay < 2) riskScore += 50;
  else if (minDelay < 5) riskScore += 20;
  
  if (volume > 50) riskScore += 30;
  else if (volume > 20) riskScore += 10;

  riskFill.style.width = `${Math.min(riskScore, 100)}%`;
  riskFill.className = 'risk-fill ' + (riskScore < 30 ? 'risk-low' : riskScore < 60 ? 'risk-med' : 'risk-high');
  riskText.textContent = `Risk: ${riskScore < 30 ? 'Low' : riskScore < 60 ? 'Medium' : 'High'} (${riskScore < 30 ? 'Safe patterns' : riskScore < 60 ? 'Potential detection' : 'High ban risk'})`;
}
