param([Parameter(Mandatory = $true)][string[]] $Titles)

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class AuthLabWindows {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);
}
"@

Add-Type -AssemblyName System.Windows.Forms
$area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$slotWidth = [Math]::Floor($area.Width / 3)

for ($attempt = 0; $attempt -lt 30; $attempt++) {
  $script:found = @{}
  $callback = [AuthLabWindows+EnumWindowsProc] {
    param($handle, $unused)
    if (-not [AuthLabWindows]::IsWindowVisible($handle)) { return $true }
    $text = New-Object System.Text.StringBuilder 512
    [void][AuthLabWindows]::GetWindowText($handle, $text, $text.Capacity)
    $windowTitle = $text.ToString()
    foreach ($wanted in $Titles) {
      if ($windowTitle.StartsWith($wanted, [System.StringComparison]::OrdinalIgnoreCase)) { $script:found[$wanted] = $handle; break }
    }
    return $true
  }
  [void][AuthLabWindows]::EnumWindows($callback, [IntPtr]::Zero)
  if ($found.Count -eq $Titles.Count) {
    for ($i = 0; $i -lt $Titles.Count; $i++) {
      [void][AuthLabWindows]::MoveWindow($found[$Titles[$i]], $area.Left + ($i * $slotWidth), $area.Top, $slotWidth, $area.Height, $true)
    }
    exit 0
  }
  Start-Sleep -Milliseconds 300
}
exit 1
