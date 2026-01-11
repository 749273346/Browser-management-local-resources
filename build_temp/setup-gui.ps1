<#
.SYNOPSIS
    Local Resource Manager Setup Wizard (Fixed)
    Professional GUI Installer script
#>

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$appName = "Local Resource Manager"
$defaultInstallDir = "C:\Program Files\LocalResourceManager"
$resourcesDir = Join-Path $PSScriptRoot "resources"
$nodeInstaller = Join-Path $resourcesDir "node-x64.msi"
$payloadZip = Join-Path $resourcesDir "payload.zip"

# Setup Form
$form = New-Object System.Windows.Forms.Form
$form.Text = "$appName Setup"
$form.Size = New-Object System.Drawing.Size(600, 450)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
try { $form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($PSHOME + "\powershell.exe") } catch {}

# Header Panel
$headerPanel = New-Object System.Windows.Forms.Panel
$headerPanel.Dock = "Top"
$headerPanel.Height = 80
$headerPanel.BackColor = [System.Drawing.Color]::White
$form.Controls.Add($headerPanel)

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Welcome to $appName Setup"
$titleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$titleLabel.AutoSize = $true
$titleLabel.Location = New-Object System.Drawing.Point(20, 20)
$headerPanel.Controls.Add($titleLabel)

$subTitleLabel = New-Object System.Windows.Forms.Label
$subTitleLabel.Text = "This wizard will guide you through the installation."
$subTitleLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subTitleLabel.AutoSize = $true
$subTitleLabel.Location = New-Object System.Drawing.Point(22, 50)
$headerPanel.Controls.Add($subTitleLabel)

# Content Panel
$contentPanel = New-Object System.Windows.Forms.Panel
$contentPanel.Location = New-Object System.Drawing.Point(0, 80)
$contentPanel.Size = New-Object System.Drawing.Size(600, 280)
$form.Controls.Add($contentPanel)

# Path Selection Controls
$pathLabel = New-Object System.Windows.Forms.Label
$pathLabel.Text = "Select Installation Folder:"
$pathLabel.Location = New-Object System.Drawing.Point(30, 30)
$pathLabel.AutoSize = $true
$contentPanel.Controls.Add($pathLabel)

$pathTextBox = New-Object System.Windows.Forms.TextBox
$pathTextBox.Location = New-Object System.Drawing.Point(30, 55)
$pathTextBox.Size = New-Object System.Drawing.Size(420, 25)
$pathTextBox.Text = $defaultInstallDir
$contentPanel.Controls.Add($pathTextBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = "Browse..."
$browseButton.Location = New-Object System.Drawing.Point(460, 53)
$contentPanel.Controls.Add($browseButton)

$browseButton.Add_Click({
    $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
    $folderBrowser.SelectedPath = $pathTextBox.Text
    if ($folderBrowser.ShowDialog() -eq "OK") {
        $pathTextBox.Text = $folderBrowser.SelectedPath
    }
})

# Progress Controls (Initially Hidden)
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Location = New-Object System.Drawing.Point(30, 100)
$statusLabel.Size = New-Object System.Drawing.Size(500, 20)
$statusLabel.Text = "Ready to install."
$contentPanel.Controls.Add($statusLabel)

$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(30, 125)
$progressBar.Size = New-Object System.Drawing.Size(520, 25)
$contentPanel.Controls.Add($progressBar)

# Log Box
$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(30, 160)
$logBox.Size = New-Object System.Drawing.Size(520, 100)
$logBox.Multiline = $true
$logBox.ScrollBars = "Vertical"
$logBox.ReadOnly = $true
$logBox.Visible = $false
$contentPanel.Controls.Add($logBox)

# Footer Panel
$footerPanel = New-Object System.Windows.Forms.Panel
$footerPanel.Dock = "Bottom"
$footerPanel.Height = 50
$footerPanel.BackColor = [System.Drawing.Color]::WhiteSmoke
$form.Controls.Add($footerPanel)

$installButton = New-Object System.Windows.Forms.Button
$installButton.Text = "Install"
$installButton.Location = New-Object System.Drawing.Point(400, 12)
$installButton.Size = New-Object System.Drawing.Size(80, 28)
$footerPanel.Controls.Add($installButton)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = "Cancel"
$cancelButton.Location = New-Object System.Drawing.Point(490, 12)
$cancelButton.Size = New-Object System.Drawing.Size(80, 28)
$footerPanel.Controls.Add($cancelButton)

$cancelButton.Add_Click({ $form.Close() })

# Install Logic Function
function Run-Installation {
    param($path)
    
    function Log($msg) {
        $logBox.AppendText("$msg`r`n")
        $logBox.ScrollToCaret()
        [System.Windows.Forms.Application]::DoEvents()
    }

    try {
        Log "Creating directory: $path"
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        $progressBar.Value = 10
        
        Log "Extracting files..."
        Expand-Archive -Path $payloadZip -DestinationPath $path -Force
        $progressBar.Value = 40
        
        Log "Checking Node.js..."
        try {
            $nodeVer = node --version
            Log "Node.js is installed: $nodeVer"
        } catch {
            Log "Node.js not found. Installing..."
            if (Test-Path $nodeInstaller) {
                Start-Process "msiexec.exe" -ArgumentList "/i `"$nodeInstaller`" /quiet /norestart" -Wait
                Log "Node.js installed."
            } else {
                Log "Warning: Node.js installer not found. It will be downloaded on first run."
            }
        }
        $progressBar.Value = 60
        
        Log "Setting up Autostart..."
        $bgScript = Join-Path $path "start-background.bat"
        # Create a simple background script if not exists
        if (-not (Test-Path $bgScript)) {
            Set-Content -Path $bgScript -Value "@echo off`r`ncd /d `"%~dp0server`"`r`nstart /b cmd /c npm start"
        }
        
        # Create Startup Shortcut
        $shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\LocalResourceManager.lnk"
        $wshShell = New-Object -ComObject WScript.Shell
        $shortcut = $wshShell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = $bgScript
        $shortcut.WorkingDirectory = Join-Path $path "server"
        $shortcut.Save()
        Log "Startup shortcut created."
        $progressBar.Value = 80

        # Start Server
        Log "Starting server..."
        Start-Process $bgScript -WindowStyle Hidden
        
        Log "Done!"
        $progressBar.Value = 100
        $statusLabel.Text = "Installation Complete!"
        
        [System.Windows.Forms.MessageBox]::Show("Installation Successful!`n`nThe server is running.`nYour browser will now open to install the extension.", "Success", "OK", "Information")
        
        # Open Extension Folder and Browser
        $extensionPath = Join-Path $path "extension"
        Start-Process "explorer.exe" $extensionPath
        Start-Process "chrome.exe" "chrome://extensions/" -ErrorAction SilentlyContinue
        Start-Process "msedge.exe" "edge://extensions/" -ErrorAction SilentlyContinue
        
        $form.Close()
        
    } catch {
        [System.Windows.Forms.MessageBox]::Show("Error: $_", "Error", "OK", "Error")
        $installButton.Enabled = $true
        $cancelButton.Enabled = $true
    }
}

# Bind Click Event
$installButton.Add_Click({
    $installPath = $pathTextBox.Text
    
    # Validation
    if ([string]::IsNullOrWhiteSpace($installPath)) {
        [System.Windows.Forms.MessageBox]::Show("Please select a valid path.", "Error", "OK", "Error")
        return
    }

    # UI Update
    $installButton.Enabled = $false
    $browseButton.Enabled = $false
    $pathTextBox.Enabled = $false
    $cancelButton.Enabled = $false
    $logBox.Visible = $true
    $statusLabel.Text = "Installing..."
    
    [System.Windows.Forms.Application]::DoEvents()
    
    # Run Logic
    Run-Installation -path $installPath
})

$form.ShowDialog() | Out-Null
