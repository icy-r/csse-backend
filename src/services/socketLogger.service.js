/**
 * Socket Logger Service
 * Manages WebSocket connections for real-time logging
 */

class SocketLoggerService {
  constructor() {
    this.clients = [];
    this.logs = [];
    this.maxLogs = 500; // Keep last 500 logs in memory
  }

  /**
   * Add a connected client
   */
  addClient(socket) {
    this.clients.push(socket);
    
    // Send recent logs to newly connected client
    socket.emit('logs:history', this.logs);
    
    console.log(`📡 Logger client connected (Total: ${this.clients.length})`);
    
    // Handle disconnect
    socket.on('disconnect', () => {
      this.removeClient(socket);
    });
  }

  /**
   * Remove a disconnected client
   */
  removeClient(socket) {
    this.clients = this.clients.filter(client => client !== socket);
    console.log(`📡 Logger client disconnected (Total: ${this.clients.length})`);
  }

  /**
   * Emit log to all connected clients
   */
  emit(event, data) {
    // Store in memory
    this.logs.push(data);
    
    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Emit to all connected clients
    this.clients.forEach(client => {
      try {
        client.emit(event, data);
      } catch (error) {
        console.error('Error emitting to client:', error.message);
      }
    });
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.clients.forEach(client => {
      try {
        client.emit('logs:cleared');
      } catch (error) {
        console.error('Error emitting clear to client:', error.message);
      }
    });
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Get connected clients count
   */
  getClientsCount() {
    return this.clients.length;
  }
}

// Export singleton instance
const socketLogger = new SocketLoggerService();
module.exports = socketLogger;

