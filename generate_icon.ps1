Add-Type -AssemblyName System.Drawing

$imgPath = "c:\Users\Dell\Downloads\dview-main\apps\desktop\src\assets\logo.jpg"
$icoPath = "c:\Users\Dell\Downloads\dview-main\dview.ico"

if (-not (Test-Path $imgPath)) {
    Write-Error "Source image not found: $imgPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)
Write-Host "Loaded source image: $($bmp.Width)x$($bmp.Height)"

# Create high-quality icon bitmap
$thumb = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($thumb)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($bmp, 0, 0, 256, 256)
$g.Dispose()

$hIcon = $thumb.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()
$icon.Dispose()
$thumb.Dispose()
$bmp.Dispose()

Write-Host "Successfully generated icon: $icoPath"
