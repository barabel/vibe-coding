# Creates NTFS junctions from .claude\skills\<skill> -> this repo's skill folders.
# Run once. After that, git pull is enough — junctions auto-reflect updates.
# Re-run to pick up newly added skills.

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsDir = "$env:USERPROFILE\.claude\skills"

git -C $repoRoot pull

Get-ChildItem $repoRoot -Directory | Where-Object {
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
