$pages = Get-ChildItem -Path "src/pages" -Filter "*.jsx"
foreach ($f in $pages) {
    $c = Get-Content $f.FullName -Raw
    $h = ([regex]::Matches($c, 'enterprise-modal-header')).Count
    $b = ([regex]::Matches($c, 'enterprise-modal-body')).Count
    $ft = ([regex]::Matches($c, 'enterprise-modal-footer')).Count
    Write-Host "$($f.Name)  header=$h  body=$b  footer=$ft"
}
