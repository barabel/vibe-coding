# Creates NTFS junctions from .claude\skills\<skill> -> this repo's skill folders.
# Run once. After that, git pull is enough — junctions auto-reflect updates.
# Re-run to pick up newly added skills.

$repoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$skillsRepo = Join-Path $repoRoot "skills"
$skillsDir  = "$env:USERPROFILE\.claude\skills"

git -C $repoRoot pull origin main

$vibeCodingMd = Join-Path $repoRoot "VIBE-CODING.md"
$vibeCodingDst = "$env:USERPROFILE\.claude\skills\VIBE-CODING.md"
Copy-Item $vibeCodingMd $vibeCodingDst -Force
Write-Host "copied: VIBE-CODING.md"

Get-ChildItem $skillsRepo -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName "SKILL.md")
} | ForEach-Object {
    $target  = $_.FullName
    $link    = Join-Path $skillsDir $_.Name

    if (Test-Path $link) {
        Write-Host "skip (exists): $($_.Name)"
    } else {
        New-Item -ItemType Junction -Path $link -Target $target | Out-Null
        Write-Host "created: $($_.Name)"
    }
}
