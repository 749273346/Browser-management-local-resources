Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

# ==========================================
# P/Invoke for Dark Mode Title Bar
# ==========================================
$code = @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32 {
        [DllImport("dwmapi.dll")]
        public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        [DllImport("kernel32.dll")]
        public static extern IntPtr GetConsoleWindow();

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        public const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
        public const int SW_HIDE = 0;
        public const int SW_SHOW = 5;
    }
"@
Add-Type -TypeDefinition $code -Language CSharp

# ==========================================
# Configuration
# ==========================================
$RootDir = $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$MarkerFile = Join-Path $RootDir ".lrm_electron_ready"
$NodeInstaller = Join-Path $RootDir "resources\node-v18-x64.msi"
$HealthUrl = "http://127.0.0.1:3001/health"

# Hide Console Window if started from one
$consolePtr = [Win32]::GetConsoleWindow()
if ($consolePtr -ne [IntPtr]::Zero) {
    [Win32]::ShowWindow($consolePtr, [Win32]::SW_HIDE)
}

# ==========================================
# UI Setup
# ==========================================
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Local Resource Manager (Service Setup)"
$Form.Size = New-Object System.Drawing.Size(900, 600)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#1e1e1e")
$Form.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#d4d4d4")
$Form.FormBorderStyle = "FixedSingle"
$Form.MaximizeBox = $false

# Try to load Icon
$iconPath = Join-Path $ServerDir "assets\icon.png"
if (-not (Test-Path $iconPath)) {
    $iconPath = Join-Path $RootDir "extension\public\icon.png"
}
if (Test-Path $iconPath) {
    try {
        $bitmap = [System.Drawing.Bitmap]::FromFile($iconPath)
        $Form.Icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    } catch {
        # Ignore icon errors
    }
}

# Enable Dark Title Bar
$darkMode = 1
[Win32]::DwmSetWindowAttribute($Form.Handle, [Win32]::DWMWA_USE_IMMERSIVE_DARK_MODE, [ref]$darkMode, [System.Runtime.InteropServices.Marshal]::SizeOf($darkMode))

# Header Panel
$HeaderPanel = New-Object System.Windows.Forms.Panel
$HeaderPanel.Dock = "Top"
$HeaderPanel.Height = 60
$HeaderPanel.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#252526")
$Form.Controls.Add($HeaderPanel)

# Title Label
$TitleLabel = New-Object System.Windows.Forms.Label
$TitleLabel.Text = "Local Resource Manager > Backend Service"
$TitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$TitleLabel.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#ffffff")
$TitleLabel.AutoSize = $true
$TitleLabel.Location = New-Object System.Drawing.Point(20, 15)
$HeaderPanel.Controls.Add($TitleLabel)

# Status Strip
$StatusStrip = New-Object System.Windows.Forms.StatusStrip
$StatusStrip.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#007acc")
$StatusStrip.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#ffffff")
$Form.Controls.Add($StatusStrip)

$StatusLabel = New-Object System.Windows.Forms.ToolStripStatusLabel
$StatusLabel.Text = "Initializing..."
$StatusStrip.Items.Add($StatusLabel)

# Log Area (Terminal Style)
$LogBox = New-Object System.Windows.Forms.RichTextBox
$LogBox.Location = New-Object System.Drawing.Point(20, 80)
$LogBox.Size = New-Object System.Drawing.Size(840, 450)
$LogBox.BackColor = [System.Drawing.ColorTranslator]::FromHtml("#000000")
$LogBox.ForeColor = [System.Drawing.ColorTranslator]::FromHtml("#cccccc")
$LogBox.Font = New-Object System.Drawing.Font("Consolas", 10)
$LogBox.ReadOnly = $true
$LogBox.BorderStyle = "None"
$LogBox.ScrollBars = "Vertical"
$Form.Controls.Add($LogBox)

# ==========================================
# Logic Functions
# ==========================================

function Log-Message {
    param([string]$Message, [string]$Color = "#cccccc")
    
    $Form.Invoke([Action]{
        $timestamp = Get-Date -Format "HH:mm:ss"
        $LogBox.SelectionStart = $LogBox.TextLength
        $LogBox.SelectionColor = [System.Drawing.ColorTranslator]::FromHtml("#569cd6")
        $LogBox.AppendText("[$timestamp] ")
        
        $LogBox.SelectionColor = [System.Drawing.ColorTranslator]::FromHtml($Color)
        $LogBox.AppendText("$Message`r`n")
        $LogBox.ScrollToCaret()
    })
}

function Update-Status {
    param([string]$Message)
    $Form.Invoke([Action]{
        $StatusLabel.Text = $Message
    })
}

function Start-AsyncTask {
    param($ScriptBlock)
    
    $rs = [runspacefactory]::CreateRunspace()
    $rs.ApartmentState = "STA"
    $rs.ThreadOptions = "ReuseThread"
    $rs.Open()
    $ps = [powershell]::Create()
    $ps.Runspace = $rs
    $ps.AddScript($ScriptBlock)
    
    # Pass variables
    $ps.AddArgument($RootDir)
    $ps.AddArgument($ServerDir)
    $ps.AddArgument($MarkerFile)
    $ps.AddArgument($NodeInstaller)
    $ps.AddArgument($HealthUrl)
    
    $handle = $ps.BeginInvoke()
    return @{ Pipe = $ps; Handle = $handle; Runspace = $rs }
}

# Main Logic Flow
$MainLogic = {
    param($RootDir, $ServerDir, $MarkerFile, $NodeInstaller, $HealthUrl)
    
    # Helper for sync logging back to UI
    function Emit-Log {
        param($Msg, $Color="#cccccc")
        $syncHash.Form.Invoke([Action]{ 
            $timestamp = Get-Date -Format "HH:mm:ss"
            $syncHash.LogBox.SelectionStart = $syncHash.LogBox.TextLength
            $syncHash.LogBox.SelectionColor = [System.Drawing.ColorTranslator]::FromHtml("#569cd6")
            $syncHash.LogBox.AppendText("[$timestamp] ")
            $syncHash.LogBox.SelectionColor = [System.Drawing.ColorTranslator]::FromHtml($Color)
            $syncHash.LogBox.AppendText("$Msg`r`n")
            $syncHash.LogBox.ScrollToCaret()
        })
    }

    function Emit-Status {
        param($Msg)
        $syncHash.Form.Invoke([Action]{ $syncHash.StatusLabel.Text = $Msg })
    }

    # 1. Check Node.js
    Emit-Status "Checking Environment..."
    Emit-Log "Checking Node.js environment..." "#4caf50"
    
    try {
        $nodeVersion = & node -v 2>&1
        if ($LASTEXITCODE -eq 0) {
            Emit-Log "Node.js found: $nodeVersion" "#4caf50"
            try {
                $nodeCmdPath = (Get-Command node -ErrorAction Stop).Source
                Emit-Log "Node path: $nodeCmdPath" "#808080"
            } catch {}
            try {
                $npmCmdPath = (Get-Command npm -ErrorAction Stop).Source
                Emit-Log "npm path: $npmCmdPath" "#808080"
            } catch {}
        } else {
            throw "Node.js not found"
        }
    } catch {
        Emit-Log "Node.js not found. Starting installation..." "#ce9178"
        Emit-Status "Installing Node.js..."
        
        if (Test-Path $NodeInstaller) {
            Emit-Log "Installing from local package: $NodeInstaller"
            $proc = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$NodeInstaller`" /qb /norestart" -PassThru -Wait
        } else {
            Emit-Log "Downloading Node.js..."
            $url = "https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
            $tempMsi = "$env:TEMP\node-install.msi"
            Invoke-WebRequest -Uri $url -OutFile $tempMsi
            Emit-Log "Installing Node.js..."
            $proc = Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$tempMsi`" /qb /norestart" -PassThru -Wait
        }
        
        try {
            $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
            $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
            if ($machinePath -and $userPath) {
                $env:Path = "$machinePath;$userPath"
            } elseif ($machinePath) {
                $env:Path = $machinePath
            } elseif ($userPath) {
                $env:Path = $userPath
            }
        } catch {}

        try {
            $nodeVersionAfter = & node -v 2>&1
            if ($LASTEXITCODE -eq 0) {
                Emit-Log "Node.js installed and available: $nodeVersionAfter" "#4caf50"
            } else {
                $nodeExe = Join-Path $env:ProgramFiles "nodejs\node.exe"
                if (Test-Path $nodeExe) {
                    $nodeVersionAfter = & $nodeExe -v 2>&1
                    Emit-Log "Node.js installed at: $nodeExe ($nodeVersionAfter)" "#4caf50"
                } else {
                    Emit-Log "Node.js installed but not available in PATH." "#f44747"
                    Emit-Status "Error"
                    return
                }
            }
        } catch {
            Emit-Log "Node.js installation completed but verification failed." "#f44747"
            Emit-Status "Error"
            return
        }
    }

    # 2. Check Dependencies
    Emit-Status "Checking Dependencies..."
    Emit-Log "Checking server dependencies..."
    
    $electronPath = Join-Path $ServerDir "node_modules\electron"
    if (-not (Test-Path $electronPath)) {
        Emit-Log "Dependencies missing. Running 'npm install'..." "#ce9178"
        Emit-Status "Installing Dependencies (this may take a while)..."
        
        $npmCmd = "npm"
        try {
            $npmExe = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
            if (Test-Path $npmExe) { $npmCmd = $npmExe }
        } catch {}
        
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "cmd.exe"
        $psi.Arguments = "/d /s /c cd /d `"$ServerDir`" && chcp 65001 >NUL && `"$npmCmd`" install"
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        try { $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8 } catch {}
        
        $p = New-Object System.Diagnostics.Process
        $p.StartInfo = $psi
        
        $p.add_OutputDataReceived({ 
            if (-not [string]::IsNullOrEmpty($_.Data)) { Emit-Log "npm: $($_.Data)" "#808080" } 
        })
        $p.add_ErrorDataReceived({ 
            if (-not [string]::IsNullOrEmpty($_.Data)) { Emit-Log "npm err: $($_.Data)" "#ce9178" } 
        })
        
        $p.Start() | Out-Null
        $p.BeginOutputReadLine()
        $p.BeginErrorReadLine()
        $p.WaitForExit()
        
        if ($p.ExitCode -ne 0) {
            Emit-Log "Dependency installation failed!" "#f44747"
            Emit-Status "Error"
            return
        }
        Emit-Log "Dependencies installed successfully." "#4caf50"
    } else {
        Emit-Log "Dependencies already installed." "#4caf50"
    }

    # 3. Start Service
    Emit-Status "Starting Service..."
    
    # Check and clear port 3001 if occupied (fix for zombie processes)
    try {
        $port = 3001
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                Emit-Log "Port $port is occupied by PID $pidToKill. Killing zombie process..." "#ce9178"
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
        }
    } catch {
        Emit-Log "Warning: Failed to check port usage. Proceeding..." "#808080"
    }

    Emit-Log "Launching background service..."
    
    $vbsPath = Join-Path $RootDir "start-server-hidden.vbs"
    Start-Process -FilePath "wscript.exe" -ArgumentList "//B //NoLogo `"$vbsPath`""
    
    # 4. Health Check
    Emit-Log "Waiting for service health check..."
    Emit-Status "Waiting for Service..."
    
    $maxRetries = 30
    $retry = 0
    $healthy = $false
    
    while ($retry -lt $maxRetries) {
        try {
            $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
            $retry++
            if ($retry % 5 -eq 0) { Emit-Log "Waiting... ($retry/$maxRetries)" }
        }
    }
    
    if ($healthy) {
        Emit-Log "Service is UP and RUNNING!" "#4caf50"
        Emit-Status "Running"
        Emit-Log "You can close this window. The service will continue in the tray."
        
        # Create marker file
        New-Item -ItemType File -Path $MarkerFile -Force | Out-Null
        
        Start-Sleep -Seconds 2
        # Optional: Close window automatically? User might want to see it.
        # We'll leave it open for user to close.
    } else {
        Emit-Log "Service failed to start responding." "#f44747"
        Emit-Status "Timeout"
        
        # Try to read logs for diagnosis
        $logDir = "$env:APPDATA\LocalResourceManager\logs"
        if (Test-Path $logDir) {
            $latestLog = Get-ChildItem $logDir -Filter "app-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestLog) {
                Emit-Log "Found log file: $($latestLog.Name)" "#ce9178"
                Emit-Log "--- Tail of log ---" "#ce9178"
                try {
                    Get-Content $latestLog.FullName -Tail 20 -ErrorAction Stop | ForEach-Object { Emit-Log $_ "#808080" }
                } catch {
                    Emit-Log "Could not read log file." "#f44747"
                }
            } else {
                 Emit-Log "No log files found in $logDir" "#ce9178"
            }
        } else {
             Emit-Log "Log directory not found: $logDir" "#ce9178"
             Emit-Log "This suggests the service process didn't start at all." "#ce9178"
        }
    }
}

# Setup Sync Hash for Thread Crossing
$syncHash = [hashtable]::Synchronized(@{})
$syncHash.Form = $Form
$syncHash.LogBox = $LogBox
$syncHash.StatusLabel = $StatusLabel

# Run Logic in Background
$rs = [runspacefactory]::CreateRunspace()
$rs.ApartmentState = "STA"
$rs.ThreadOptions = "ReuseThread"
$rs.Open()
$rs.SessionStateProxy.SetVariable("syncHash", $syncHash)

$ps = [powershell]::Create()
$ps.Runspace = $rs
$ps.AddScript($MainLogic)
$ps.AddArgument($RootDir)
$ps.AddArgument($ServerDir)
$ps.AddArgument($MarkerFile)
$ps.AddArgument($NodeInstaller)
$ps.AddArgument($HealthUrl)

$handle = $ps.BeginInvoke()

# Show Form
$Form.Add_Load({
    # Initial focus or styling
})

$Form.ShowDialog() | Out-Null

# Cleanup
$ps.Dispose()
$rs.Dispose()
