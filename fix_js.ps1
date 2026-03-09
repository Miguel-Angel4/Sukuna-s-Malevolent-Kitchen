// Create new main.js backup
Copy-Item 'd:\DAM 2\Proyecto\js\main.js' -Destination 'd:\DAM 2\Proyecto\js\main.js.backup'

# Read all lines
$lines = Get-Content 'd:\DAM 2\Proyecto\js\main.js'

# Remove lines 74-82 (index 73-81)
$newLines = $lines[0..72] + $lines[83..($lines.Count-1)]

# Write back
$newLines | Out-File -FilePath 'd:\DAM 2\Proyecto\js\main.js' -Encoding UTF8
