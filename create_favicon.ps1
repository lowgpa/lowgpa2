
Add-Type -AssemblyName System.Drawing

function Draw-Favicon ($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Transparent Background
    $g.Clear([System.Drawing.Color]::Transparent)

    # Scale calculation
    $scale = $size / 100.0

    # Colors
    $black = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
    $red = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(221, 0, 0)) # #DD0000
    $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 206, 0)) # #FFCE00

    # Option A Geometry (Thicker Bars)
    # Rect 1 (Black): x=10, y=55, w=25, h=45
    $g.FillRectangle($black, (10 * $scale), (55 * $scale), (25 * $scale), (45 * $scale))

    # Rect 2 (Red): x=37.5, y=35, w=25, h=65
    $g.FillRectangle($red, (37.5 * $scale), (35 * $scale), (25 * $scale), (65 * $scale))

    # Rect 3 (Gold): x=65, y=15, w=25, h=85
    $g.FillRectangle($gold, (65 * $scale), (15 * $scale), (25 * $scale), (85 * $scale))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $path"
}

Draw-Favicon 192 "c:\Users\Admin\Documents\GitHub\lowgpa\lowgpa2\images\favicon-192x192.png"

Add-Type -AssemblyName System.Drawing

function Draw-Favicon ($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Clear with Transparent instead of White
    $g.Clear([System.Drawing.Color]::Transparent)

    # Scale calculation
    $scale = $size / 100.0

    # Colors
    $black = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
    $red = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(221, 0, 0)) # #DD0000
    $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 206, 0)) # #FFCE00

    # Draw Bars (Rounded rectangles are hard in pure GDI+, just use rectangles)
    # Rect 1 (Black): x=20, y=55, w=18, h=25
    $g.FillRectangle($black, (20 * $scale), (55 * $scale), (18 * $scale), (25 * $scale))

    # Rect 2 (Red): x=41, y=40, w=18, h=40
    $g.FillRectangle($red, (41 * $scale), (40 * $scale), (18 * $scale), (40 * $scale))

    # Rect 3 (Gold): x=62, y=25, w=18, h=55
    $g.FillRectangle($gold, (62 * $scale), (25 * $scale), (18 * $scale), (55 * $scale))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $path"
}

Draw-Favicon 192 "c:\Users\Admin\Documents\GitHub\lowgpa\lowgpa2\images\favicon-192x192.png"
