$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$targetBat = "c:\Users\Dell\Downloads\dview-main\DVIEW-BAT.bat"
$iconPath = "c:\Users\Dell\Downloads\dview-main\dview.ico"

# 1. Ensure icon exists in project and copy to desktop assets
Copy-Item -Path $iconPath -Destination "c:\Users\Dell\Downloads\dview-main\apps\web-panel\public\dview.ico" -Force
Copy-Item -Path $iconPath -Destination "c:\Users\Dell\Downloads\dview-main\apps\desktop\src\assets\dview.ico" -Force

# 2. Also keep a copy of DVIEW-BAT.bat on desktop
Copy-Item -Path $targetBat -Destination "$desktopPath\DVIEW-BAT.bat" -Force
Write-Host "Copied DVIEW-BAT.bat to: $desktopPath\DVIEW-BAT.bat"

# 3. Create Windows Shortcut DVIEW-BAT.lnk with custom icon
$wsh = New-Object -ComObject WScript.Shell

$shortcutBat = $wsh.CreateShortcut("$desktopPath\DVIEW-BAT.lnk")
$shortcutBat.TargetPath = $targetBat
$shortcutBat.WorkingDirectory = "c:\Users\Dell\Downloads\dview-main"
$shortcutBat.IconLocation = "$iconPath,0"
$shortcutBat.Description = "Iniciar Servidor e Painel de Controle DVIEW"
$shortcutBat.WindowStyle = 1
$shortcutBat.Save()
Write-Host "Created Shortcut with custom icon: $desktopPath\DVIEW-BAT.lnk"

# 4. Also create DVIEW.lnk for maximum convenience
$shortcutDview = $wsh.CreateShortcut("$desktopPath\DVIEW.lnk")
$shortcutDview.TargetPath = $targetBat
$shortcutDview.WorkingDirectory = "c:\Users\Dell\Downloads\dview-main"
$shortcutDview.IconLocation = "$iconPath,0"
$shortcutDview.Description = "DVIEW - Sistema de Monitoramento e Controle"
$shortcutDview.WindowStyle = 1
$shortcutDview.Save()
Write-Host "Created Shortcut with custom icon: $desktopPath\DVIEW.lnk"

# Refresh desktop icon cache
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($wsh) | Out-Null
Write-Host "Desktop shortcuts configured successfully!"
