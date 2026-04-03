# Test 1: Preset question (using backend directly)
Write-Host '=== TEST 1: Groq - Basic Question ===' -ForegroundColor Cyan
$body = @{ question = 'What machine needs maintenance?' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8000/api/copilot/ask' -Method Post -ContentType 'application/json' -Body $body 2>&1 | ConvertTo-Json -Depth 2

# Test 2: Custom provider
Write-Host "
=== TEST 2: Custom Provider - Anthropic ===" -ForegroundColor Green  
$body2 = @{ question = 'Optimize for energy?'; provider = 'anthropic' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8000/api/copilot/ask' -Method Post -ContentType 'application/json' -Body $body2 2>&1 | ConvertTo-Json -Depth 2

# Test 3: Status endpoint
Write-Host "
=== TEST 3: Copilot Status ===" -ForegroundColor Magenta
Invoke-RestMethod -Uri 'http://localhost:8000/api/copilot/status' -Method Get 2>&1 | ConvertTo-Json -Depth 3
