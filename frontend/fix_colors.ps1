$files = Get-ChildItem -Recurse -Include "*.jsx" -Path "src/pages","src/components"
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw -Encoding UTF8
    $orig = $c
    $c = $c -replace 'slate-955', 'slate-950'
    $c = $c -replace 'slate-655', 'slate-600'
    $c = $c -replace 'slate-455', 'slate-400'
    $c = $c -replace 'slate-450', 'slate-400'
    $c = $c -replace 'slate-550', 'slate-500'
    $c = $c -replace 'slate-555', 'slate-500'
    $c = $c -replace 'slate-805', 'slate-800'
    $c = $c -replace 'slate-850', 'slate-900'
    $c = $c -replace 'slate-855', 'slate-900'
    $c = $c -replace 'slate-350', 'slate-300'
    $c = $c -replace 'slate-250', 'slate-200'
    $c = $c -replace 'slate-205', 'slate-200'
    $c = $c -replace 'slate-155', 'slate-100'
    $c = $c -replace 'slate-405', 'slate-400'
    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $c, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $($f.Name)"
    }
}
Write-Host "All done."
