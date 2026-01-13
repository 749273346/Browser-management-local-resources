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
# Main Logic Flow
# ==========================================
$MainLogic = {
    param($RootDir, $ServerDir, $MarkerFile, $NodeInstaller, $HealthUrl)
    
    # 0. Safety Checks & Defaults
    if ([string]::IsNullOrEmpty($RootDir)) { try { $RootDir = $PWD.Path } catch {} }
    if ([string]::IsNullOrEmpty($ServerDir)) { try { $ServerDir = Join-Path $RootDir "server" } catch {} }
    
    # Helper for sync logging back to UI
    function Write-GuiLog {
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

    function Set-GuiStatus {
        param($Msg)
        $syncHash.Form.Invoke([Action]{ $syncHash.StatusLabel.Text = $Msg })
    }

    # 1. Check Node.js
    Set-GuiStatus "Checking Environment..."
    Write-GuiLog "Checking Node.js environment..." "#4caf50"
    
    try {
        $nodeVersion = & node -v 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-GuiLog "Node.js found: $nodeVersion" "#4caf50"
            try {
                $nodeCmdPath = (Get-Command node -ErrorAction Stop).Source
                Write-GuiLog "Node path: $nodeCmdPath" "#808080"
            } catch {}
            try {
                $npmCmdPath = (Get-Command npm -ErrorAction Stop).Source
                Write-GuiLog "npm path: $npmCmdPath" "#808080"
            } catch {}
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-GuiLog "Node.js not found. Starting installation..." "#ce9178"
        Set-GuiStatus "Installing Node.js..."
        
        if (Test-Path $NodeInstaller) {
            Write-GuiLog "Installing from local package: $NodeInstaller"
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$NodeInstaller`" /qb /norestart" -Wait
        } else {
            Write-GuiLog "Downloading Node.js..."
            $url = "https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi"
            $tempMsi = "$env:TEMP\node-install.msi"
            Invoke-WebRequest -Uri $url -OutFile $tempMsi
            Write-GuiLog "Installing Node.js..."
            Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$tempMsi`" /qb /norestart" -Wait
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
                Write-GuiLog "Node.js installed and available: $nodeVersionAfter" "#4caf50"
            } else {
                $nodeExe = Join-Path $env:ProgramFiles "nodejs\node.exe"
                if (Test-Path $nodeExe) {
                    $nodeVersionAfter = & $nodeExe -v 2>&1
                    Write-GuiLog "Node.js installed at: $nodeExe ($nodeVersionAfter)" "#4caf50"
                } else {
                    Write-GuiLog "Node.js installed but not available in PATH." "#f44747"
                    Set-GuiStatus "Error"
                    return
                }
            }
        } catch {
            Write-GuiLog "Node.js installation completed but verification failed." "#f44747"
            Set-GuiStatus "Error"
            return
        }
    }

    # 2. Check Dependencies
    Set-GuiStatus "Checking Dependencies..."
    Write-GuiLog "Checking server dependencies..."
    
    $electronDir = Join-Path $ServerDir "node_modules\electron"
    $electronExe = Join-Path $electronDir "dist\electron.exe"
    # $electronCmd line removed (unused)
    $depsOk = (Test-Path $electronExe)

    if (-not $depsOk) {
        Write-GuiLog "Dependencies missing. Running 'npm install'..." "#ce9178"
        Set-GuiStatus "Installing Dependencies (this may take a while)..."
        
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
            if (-not [string]::IsNullOrEmpty($_.Data)) { Write-GuiLog "npm: $($_.Data)" "#808080" } 
        })
        $p.add_ErrorDataReceived({ 
            if (-not [string]::IsNullOrEmpty($_.Data)) { Write-GuiLog "npm err: $($_.Data)" "#ce9178" } 
        })
        
        $p.Start() | Out-Null
        $p.BeginOutputReadLine()
        $p.BeginErrorReadLine()
        $p.WaitForExit()
        
        if ($p.ExitCode -ne 0) {
            Write-GuiLog "Dependency installation failed!" "#f44747"
            Set-GuiStatus "Error"
            return
        }
        Write-GuiLog "Dependencies installed successfully." "#4caf50"
    } else {
        Write-GuiLog "Dependencies already installed." "#4caf50"
    }

    # 3. Start Service
    Set-GuiStatus "Starting Service..."
    
    # Check and clear port 3001 if occupied (fix for zombie processes)
    try {
        $port = 3001
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        $pids = @()
        if ($listeners) {
            $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -gt 0 }
        }

        foreach ($pidToKill in $pids) {
            Write-GuiLog "Port $port is occupied by PID $pidToKill. Killing process..." "#ce9178"
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }

        if ($pids.Count -gt 0) {
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-GuiLog "Warning: Failed to check port usage. Proceeding..." "#808080"
    }

    Write-GuiLog "Launching background service..."
    
    if ([string]::IsNullOrEmpty($RootDir)) {
        try { $RootDir = $PWD.Path } catch {}
    }

    $vbsPath = Join-Path $RootDir "start-server-hidden.vbs"
    
    if (-not (Test-Path $vbsPath)) {
        Write-GuiLog "Error: Service launcher script not found at: $vbsPath" "#f44747"
    } else {
        try {
            $argList = "//B //NoLogo `"$vbsPath`""
            $launcherProc = Start-Process -FilePath "wscript.exe" -ArgumentList $argList -PassThru -ErrorAction Stop
            if ($launcherProc -and $launcherProc.Id) {
                Write-GuiLog "Launcher started (wscript.exe PID $($launcherProc.Id))" "#808080"
            }
        } catch {
            Write-GuiLog "Retry launching service without PassThru..." "#808080"
            try {
                Start-Process -FilePath "wscript.exe" -ArgumentList "//B //NoLogo `"$vbsPath`"" -ErrorAction Stop
            } catch {
                Write-GuiLog "Failed to launch service: $_" "#f44747"
            }
        }
    }
    
    # 4. Health Check
    Write-GuiLog "Waiting for service health check..."
    Set-GuiStatus "Waiting for Service..."
    
    $maxRetries = 30
    $retry = 0
    $healthy = $false
    $healthUrls = @(
        $HealthUrl,
        "http://localhost:3001/health",
        "http://[::1]:3001/health"
    )
    $lastErrorSummary = $null
    
    while ($retry -lt $maxRetries) {
        foreach ($u in $healthUrls) {
            try {
                $resp = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2 -Proxy $null -ErrorAction Stop
                if ($resp.StatusCode -eq 200) {
                    $healthy = $true
                    break
                }
                $lastErrorSummary = "HTTP $($resp.StatusCode) from $u"
            } catch {
                $statusCode = $null
                try {
                    if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode) {
                        $statusCode = [int]$_.Exception.Response.StatusCode
                    }
                } catch {}
                if ($statusCode -ne $null) {
                    $lastErrorSummary = "HTTP $statusCode from $u"
                } else {
                    $lastErrorSummary = "${u}: $($_.Exception.Message)"
                }
            }
            if ($healthy) { break }
        }

        if ($healthy) { break }

        Start-Sleep -Seconds 1
        $retry++
        if ($retry % 5 -eq 0) {
            if ($lastErrorSummary) { Write-GuiLog "Waiting... ($retry/$maxRetries) Last: $lastErrorSummary" }
            else { Write-GuiLog "Waiting... ($retry/$maxRetries)" }
        }
    }
    
    if ($healthy) {
        Write-GuiLog "Service is UP and RUNNING!" "#4caf50"
        Set-GuiStatus "Running"
        Write-GuiLog "You can close this window. The service will continue in the tray."
        
        # Create marker file
        New-Item -ItemType File -Path $MarkerFile -Force | Out-Null
        
        Start-Sleep -Seconds 2
        # Optional: Close window automatically? User might want to see it.
        # We'll leave it open for user to close.
    } else {
        Write-GuiLog "Service failed to start responding." "#f44747"
        Set-GuiStatus "Timeout"

        try {
            $port = 3001
            $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
            if ($listeners) {
                $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -and $_ -gt 0 }
                if ($pids.Count -gt 0) {
                    foreach ($procId in $pids) {
                        $pname = $null
                        try { $pname = (Get-Process -Id $procId -ErrorAction SilentlyContinue).ProcessName } catch {}
                        if ($pname) { Write-GuiLog "Port $port is still LISTENING by PID $procId ($pname)." "#ce9178" }
                        else { Write-GuiLog "Port $port is still LISTENING by PID $procId." "#ce9178" }
                    }
                } else {
                    Write-GuiLog "Port $port is LISTENING but owning PID could not be determined." "#ce9178"
                }
            } else {
                Write-GuiLog "Port $port is not listening. Service likely failed to start." "#ce9178"
            }
        } catch {
            Write-GuiLog "Warning: Failed to collect port diagnostics." "#808080"
        }

        try {
            $electronExe = Join-Path $ServerDir "node_modules\electron\dist\electron.exe"
            if (-not (Test-Path $electronExe)) {
                Write-GuiLog "Electron binary not found at: $electronExe" "#ce9178"
                Write-GuiLog "This usually means node_modules was not fully copied or install is incomplete." "#ce9178"
            }
        } catch {}
        
        # Try to read logs for diagnosis
        $logDir = "$env:APPDATA\LocalResourceManager\logs"
        if (Test-Path $logDir) {
            $latestLog = Get-ChildItem $logDir -Filter "app-*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestLog) {
                Write-GuiLog "Found log file: $($latestLog.Name)" "#ce9178"
                Write-GuiLog "--- Tail of log ---" "#ce9178"
                try {
                    Get-Content $latestLog.FullName -Tail 20 -ErrorAction Stop | ForEach-Object { Write-GuiLog $_ "#808080" }
                } catch {
                    Write-GuiLog "Could not read log file." "#f44747"
                }
            } else {
                 Write-GuiLog "No log files found in $logDir" "#ce9178"
            }
        } else {
             Write-GuiLog "Log directory not found: $logDir" "#ce9178"
             Write-GuiLog "This suggests the service process didn't start at all." "#ce9178"
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