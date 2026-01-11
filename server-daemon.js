const { spawn } = require('child_process');
const path = require('path');

class ServerDaemon {
    constructor() {
        this.serverProcess = null;
        this.restartCount = 0;
        this.maxRestarts = 5;
        this.serverDir = path.join(__dirname, 'server');
        this.startServer();
    }

    startServer() {
        if (this.restartCount >= this.maxRestarts) {
            console.log('❌ Max restart attempts reached. Please check server logs.');
            return;
        }

        console.log(`🚀 Starting server (attempt ${this.restartCount + 1}/${this.maxRestarts})...`);
        
        this.serverProcess = spawn('npm', ['start'], {
            cwd: this.serverDir,
            stdio: 'pipe',
            shell: true,
            windowsHide: true
        });

        this.serverProcess.stdout.on('data', (data) => {
            console.log(`📡 ${data.toString().trim()}`);
        });

        this.serverProcess.stderr.on('data', (data) => {
            console.error(`❌ ${data.toString().trim()}`);
        });

        this.serverProcess.on('exit', (code) => {
            console.log(`⚠️  Server exited with code ${code}`);
            this.restartCount++;
            
            if (this.restartCount < this.maxRestarts) {
                console.log(`🔄 Restarting in 3 seconds...`);
                setTimeout(() => this.startServer(), 3000);
            }
        });

        this.serverProcess.on('error', (err) => {
            console.error(`❌ Failed to start server: ${err.message}`);
        });
    }

    stopServer() {
        if (this.serverProcess) {
            console.log('🛑 Stopping server...');
            this.serverProcess.kill();
            this.serverProcess = null;
        }
    }
}

// 创建守护进程实例
const daemon = new ServerDaemon();

// 优雅关闭处理
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down daemon...');
    daemon.stopServer();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down daemon...');
    daemon.stopServer();
    process.exit(0);
});

console.log('🔰 Local Resource Manager Server Daemon Started');
console.log('📍 Server will be available at: http://localhost:3001');
console.log('💡 Press Ctrl+C to stop the daemon');