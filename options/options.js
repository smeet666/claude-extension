// Load saved settings with error handling
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['serverPort', 'timeout'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error loading settings:', chrome.runtime.lastError);
      document.getElementById('port').value = '3000';
      document.getElementById('timeout').value = '60';
      return;
    }
    
    // Set port
    if (result && result.serverPort) {
      document.getElementById('port').value = result.serverPort.toString();
    } else {
      document.getElementById('port').value = '3000';
    }
    
    // Set timeout
    if (result && result.timeout) {
      document.getElementById('timeout').value = result.timeout.toString();
    } else {
      document.getElementById('timeout').value = '60';
    }
  });
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const port = parseInt(document.getElementById('port').value);
  const timeout = parseInt(document.getElementById('timeout').value);
  
  // Validate inputs
  const allowedPorts = [3000, 3001, 3002, 5000, 5173, 8000, 8080, 8081, 8888, 9000];
  if (!allowedPorts.includes(port)) {
    showStatus('Invalid port selected', false);
    return;
  }
  
  if (isNaN(timeout) || timeout < 1) {
    showStatus('Invalid timeout value', false);
    return;
  }
  
  chrome.storage.sync.set({
    serverPort: port,
    timeout: timeout
  }, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error saving settings: ' + chrome.runtime.lastError.message, false);
      return;
    }
    showStatus('Settings saved successfully!', true);
  });
});

function showStatus(message, success) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = success ? 'success' : 'error';
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}