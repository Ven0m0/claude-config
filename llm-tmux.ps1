# Usage: llm-psmux.ps1 <claude|opencode|kilo>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("claude", "opencode", "kilo")]
    [string]$App
)

$SessionName = $App

psmux has-session -t $SessionName 2>$null
if ($LASTEXITCODE -ne 0) {
    psmux new-session -d -s $SessionName -- $App
    psmux set-option -t $SessionName history-limit 10000
}

psmux attach -t $SessionName
