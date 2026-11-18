$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = (Resolve-Path "tổng kết dự án\Bao_Cao_Tong_Ket_Do_An_3TG_Study_TONE_PINK_Final.docx").Path
$doc = $word.Documents.Open($docPath)
$pages = $doc.ComputeStatistics(2)
$doc.Close($false)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "EXACT MICROSOFT WORD PAGE COUNT: $pages"
