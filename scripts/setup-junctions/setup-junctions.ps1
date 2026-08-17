# Creates NTFS junctions from .claude\skills\<skill> and .agents\skills\<skill> -> this repo's skill folders.
# Run once. After that, git pull is enough — junctions auto-reflect updates.
# Re-run to pick up newly added skills.

$repoRoot   = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$skillsRepo = Join-Path $repoRoot "skills"
$skillsDirs = @(
    "$env:USERPROFILE\.claude\skills",
    "$env:USERPROFILE\.agents\skills"
)

git -C $repoRoot pull origin main

$skills = Get-ChildItem $skillsRepo -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName "SKILL.md")
}

foreach ($skillsDir in $skillsDirs) {
    Write-Host "-- $skillsDir"

    if (-not (Test-Path $skillsDir)) {
        New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
    }

    foreach ($skill in $skills) {
        $target = $skill.FullName
        $link   = Join-Path $skillsDir $skill.Name

        if (Test-Path $link) {
            Write-Host "skip (exists): $($skill.Name)"
        } else {
            New-Item -ItemType Junction -Path $link -Target $target | Out-Null
            Write-Host "created: $($skill.Name)"
        }
    }
}
