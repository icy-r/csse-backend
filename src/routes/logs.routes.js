const express = require('express');
const router = express.Router();
const socketLogger = require('../services/socketLogger.service');

/**
 * Logger UI route - Real-time request/response monitoring
 * GET /logs
 */
router.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Logger - Real-time Monitoring</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #1a1a2e;
      color: #eee;
      height: 100vh;
      overflow: hidden;
    }
    
    .header {
      background: #16213e;
      padding: 20px;
      border-bottom: 2px solid #0f3460;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header h1 {
      font-size: 24px;
      color: #e94560;
    }
    
    .header .stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .stat-badge {
      background: #0f3460;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: bold;
    }
    
    .controls {
      background: #16213e;
      padding: 15px 20px;
      border-bottom: 1px solid #0f3460;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .controls button {
      background: #0f3460;
      color: #eee;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }
    
    .controls button:hover {
      background: #e94560;
    }
    
    .controls button.active {
      background: #e94560;
    }
    
    .controls input {
      background: #0f3460;
      color: #eee;
      border: 1px solid #0f3460;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      flex: 1;
      max-width: 300px;
    }
    
    .logs-container {
      height: calc(100vh - 160px);
      overflow-y: auto;
      padding: 20px;
    }
    
    .log-entry {
      background: #16213e;
      margin-bottom: 10px;
      border-radius: 8px;
      padding: 15px;
      border-left: 4px solid #0f3460;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .log-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    
    .log-method {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .method-GET { background: #4ade80; color: #000; }
    .method-POST { background: #3b82f6; color: #fff; }
    .method-PUT { background: #f59e0b; color: #000; }
    .method-DELETE { background: #ef4444; color: #fff; }
    .method-PATCH { background: #a855f7; color: #fff; }
    
    .log-status {
      font-weight: bold;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    
    .status-2xx { background: #22c55e; color: #000; }
    .status-3xx { background: #06b6d4; color: #000; }
    .status-4xx { background: #f59e0b; color: #000; }
    .status-5xx { background: #ef4444; color: #fff; }
    
    .log-path {
      font-size: 16px;
      font-weight: 600;
      color: #e94560;
      margin-bottom: 8px;
      word-break: break-all;
    }
    
    .log-details {
      font-size: 12px;
      color: #aaa;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    
    .log-detail {
      display: flex;
      gap: 5px;
    }
    
    .log-detail-label {
      color: #888;
    }
    
    .log-detail-value {
      color: #eee;
    }
    
    .log-body {
      margin-top: 10px;
      padding: 10px;
      background: #0f3460;
      border-radius: 4px;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .log-body-title {
      color: #e94560;
      font-weight: bold;
      margin-bottom: 5px;
      cursor: pointer;
      user-select: none;
    }
    
    .log-body-title:hover {
      color: #ff6b81;
    }
    
    .log-body-content {
      color: #aaa;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .log-body-toggle {
      display: inline-block;
      margin-right: 5px;
      transition: transform 0.2s;
    }
    
    .log-body-toggle.collapsed {
      transform: rotate(-90deg);
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #888;
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .connection-status {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .connected { background: #22c55e; }
    .disconnected { background: #ef4444; }
    
    ::-webkit-scrollbar {
      width: 10px;
    }
    
    ::-webkit-scrollbar-track {
      background: #0f3460;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #e94560;
      border-radius: 5px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #c43549;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 API Logger</h1>
    <div class="stats">
      <div class="stat-item">
        <span class="connection-status" id="connectionStatus"></span>
        <span id="connectionText">Connecting...</span>
      </div>
      <div class="stat-item">
        <span>Total Logs:</span>
        <span class="stat-badge" id="totalLogs">0</span>
      </div>
      <div class="stat-item">
        <span>Filtered:</span>
        <span class="stat-badge" id="filteredLogs">0</span>
      </div>
    </div>
  </div>
  
  <div class="controls">
    <button id="clearBtn">🗑️ Clear Logs</button>
    <button id="pauseBtn">⏸️ Pause</button>
    <button id="filterAll" class="active" data-method="all">All</button>
    <button id="filterGET" data-method="GET">GET</button>
    <button id="filterPOST" data-method="POST">POST</button>
    <button id="filterPUT" data-method="PUT">PUT</button>
    <button id="filterDELETE" data-method="DELETE">DELETE</button>
    <input type="text" id="searchInput" placeholder="🔍 Search by path, status, or content...">
  </div>
  
  <div class="logs-container" id="logsContainer">
    <div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <h3>No logs yet</h3>
      <p>Waiting for API requests...</p>
    </div>
  </div>

  <script>
    const socket = io();
    let logs = [];
    let filteredLogs = [];
    let isPaused = false;
    let filterMethod = 'all';
    let searchQuery = '';
    
    const logsContainer = document.getElementById('logsContainer');
    const totalLogsEl = document.getElementById('totalLogs');
    const filteredLogsEl = document.getElementById('filteredLogs');
    const connectionStatusEl = document.getElementById('connectionStatus');
    const connectionTextEl = document.getElementById('connectionText');
    const searchInput = document.getElementById('searchInput');
    const pauseBtn = document.getElementById('pauseBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Socket connection events
    socket.on('connect', () => {
      connectionStatusEl.className = 'connection-status connected';
      connectionTextEl.textContent = 'Connected';
    });
    
    socket.on('disconnect', () => {
      connectionStatusEl.className = 'connection-status disconnected';
      connectionTextEl.textContent = 'Disconnected';
    });
    
    // Receive log history
    socket.on('logs:history', (history) => {
      logs = history;
      applyFilters();
    });
    
    // Receive new log
    socket.on('log', (logEntry) => {
      if (!isPaused) {
        logs.unshift(logEntry);
        if (logs.length > 500) logs.pop();
        applyFilters();
      }
    });
    
    // Logs cleared
    socket.on('logs:cleared', () => {
      logs = [];
      applyFilters();
    });
    
    // Apply filters and search
    function applyFilters() {
      filteredLogs = logs.filter(log => {
        const matchesMethod = filterMethod === 'all' || log.method === filterMethod;
        const matchesSearch = !searchQuery || 
          log.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.status.toString().includes(searchQuery) ||
          JSON.stringify(log.query).toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesMethod && matchesSearch;
      });
      
      renderLogs();
      updateStats();
    }
    
    // Render logs
    function renderLogs() {
      if (filteredLogs.length === 0) {
        logsContainer.innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <h3>No logs found</h3>
            <p>Try adjusting your filters</p>
          </div>
        \`;
        return;
      }
      
      logsContainer.innerHTML = filteredLogs.map((log, index) => {
        const statusClass = getStatusClass(log.status);
        const methodClass = \`method-\${log.method}\`;
        const hasRequestBody = log.body && Object.keys(log.body).length > 0;
        const hasResponse = log.response && Object.keys(log.response).length > 0;
        
        return \`
          <div class="log-entry">
            <div class="log-header">
              <div>
                <span class="log-method \${methodClass}">\${log.method}</span>
                <span class="log-status \${statusClass}">\${log.status} \${log.statusText}</span>
              </div>
              <div>\${new Date(log.timestamp).toLocaleTimeString()}</div>
            </div>
            <div class="log-path">\${log.path}</div>
            <div class="log-details">
              <div class="log-detail">
                <span class="log-detail-label">Duration:</span>
                <span class="log-detail-value">\${log.duration}</span>
              </div>
              <div class="log-detail">
                <span class="log-detail-label">IP:</span>
                <span class="log-detail-value">\${log.ip}</span>
              </div>
              \${Object.keys(log.query || {}).length > 0 ? \`
                <div class="log-detail">
                  <span class="log-detail-label">Query:</span>
                  <span class="log-detail-value">\${JSON.stringify(log.query)}</span>
                </div>
              \` : ''}
            </div>
            \${hasRequestBody ? \`
              <div class="log-body">
                <div class="log-body-title" onclick="toggleBody('req-\${index}')">
                  <span class="log-body-toggle" id="toggle-req-\${index}">▼</span>
                  Request Body
                </div>
                <div class="log-body-content" id="req-\${index}">
                  \${JSON.stringify(log.body, null, 2)}
                </div>
              </div>
            \` : ''}
            \${hasResponse ? \`
              <div class="log-body">
                <div class="log-body-title" onclick="toggleBody('res-\${index}')">
                  <span class="log-body-toggle" id="toggle-res-\${index}">▼</span>
                  Response
                </div>
                <div class="log-body-content" id="res-\${index}">
                  \${JSON.stringify(log.response, null, 2)}
                </div>
              </div>
            \` : ''}
          </div>
        \`;
      }).join('');
    }
    
    function getStatusClass(status) {
      if (status >= 200 && status < 300) return 'status-2xx';
      if (status >= 300 && status < 400) return 'status-3xx';
      if (status >= 400 && status < 500) return 'status-4xx';
      if (status >= 500) return 'status-5xx';
      return '';
    }
    
    function updateStats() {
      totalLogsEl.textContent = logs.length;
      filteredLogsEl.textContent = filteredLogs.length;
    }
    
    // Toggle body visibility
    function toggleBody(id) {
      const content = document.getElementById(id);
      const toggle = document.getElementById('toggle-' + id);
      
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.classList.remove('collapsed');
      } else {
        content.style.display = 'none';
        toggle.classList.add('collapsed');
      }
    }
    
    // Make toggleBody available globally
    window.toggleBody = toggleBody;
    
    // Event listeners
    document.querySelectorAll('[data-method]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-method]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterMethod = btn.dataset.method;
        applyFilters();
      });
    });
    
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      applyFilters();
    });
    
    pauseBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
      pauseBtn.classList.toggle('active', isPaused);
    });
    
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all logs?')) {
        logs = [];
        applyFilters();
      }
    });
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

// API endpoint to get logs programmatically
router.get('/api', (req, res) => {
  const logs = socketLogger.getLogs();
  res.json({
    success: true,
    count: logs.length,
    logs
  });
});

// API endpoint to clear logs
router.delete('/api', (req, res) => {
  socketLogger.clearLogs();
  res.json({
    success: true,
    message: 'Logs cleared'
  });
});

module.exports = router;

