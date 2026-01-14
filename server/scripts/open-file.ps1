param(
    [string]$FilePath
)

# Force UTF-8 for consistent output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Define C# P/Invoke code for Win32 APIs
$code = @'
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
'@

try {
    Add-Type -MemberDefinition $code -Name Win32Utils -Namespace User32Utils -ErrorAction Stop
} catch {
    # Ignore if type already exists in session
}

# Start the process
# Use -PassThru to get the process object
# Note: For some file types (like .docx), this might reuse an existing process
$p = Start-Process -FilePath $FilePath -PassThru

if ($p) {
    # Wait for the main window handle to become available (up to 3 seconds)
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $p.Refresh()
            if ($p.MainWindowHandle -ne 0) { break }
        } catch {
            # Process might have exited or access denied
            break
        }
        Start-Sleep -Milliseconds 100
    }

    if ($p.MainWindowHandle -ne 0) {
        $hwnd = $p.MainWindowHandle
        
        # SW_MAXIMIZE = 3
        # SW_RESTORE = 9
        
        # If minimized (Iconic), restore it first
        if ([User32Utils.Win32]::IsIconic($hwnd)) {
             [User32Utils.Win32]::ShowWindow($hwnd, 9) # Restore
        }
        
        # Maximize
        [User32Utils.Win32]::ShowWindow($hwnd, 3)
        
        # Force foreground
        [User32Utils.Win32]::SwitchToThisWindow($hwnd, $true)
        [User32Utils.Win32]::SetForegroundWindow($hwnd)
    }
} else {
    # If Start-Process didn't return a process object (e.g. reused existing process like Explorer),
    # we might need fallback or just accept it.
    # For file opens, it usually returns a process unless it's a quick delegation.
}
