Add-Type -AssemblyName System.Drawing

$blue = [System.Drawing.Color]::FromArgb(255, 0, 120, 212)
$white = [System.Drawing.Color]::White

$bmp128 = New-Object System.Drawing.Bitmap 128, 128
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear($blue)
$font128 = New-Object System.Drawing.Font("Segoe UI", 48, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush($white)
$g128.DrawString("E*", $font128, $brush, 10, 25)
$bmp128.Save("c:\git\EntraBrowserExtension\icons\icon128.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp48 = New-Object System.Drawing.Bitmap 48, 48
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.Clear($blue)
$font48 = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$g48.DrawString("E*", $font48, $brush, 5, 8)
$bmp48.Save("c:\git\EntraBrowserExtension\icons\icon48.png", [System.Drawing.Imaging.ImageFormat]::Png)

$bmp16 = New-Object System.Drawing.Bitmap 16, 16
$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.Clear($blue)
$font16 = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
$g16.DrawString("E*", $font16, $brush, 0, 0)
$bmp16.Save("c:\git\EntraBrowserExtension\icons\icon16.png", [System.Drawing.Imaging.ImageFormat]::Png)

$g128.Dispose()
$bmp128.Dispose()
$g48.Dispose()
$bmp48.Dispose()
$g16.Dispose()
$bmp16.Dispose()

Write-Output "Native PNG icons generated successfully!"
