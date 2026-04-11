$ErrorActionPreference = 'Stop'

function Invoke-Api {
param(
[string]$Method,
[string]$Uri,
[hashtable]$Headers,
$Body = $null
)

try {
if ($null -ne $Body) {
$jsonBody = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
$resp = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop
} else {
$resp = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
}

$json = $null
if ($resp.Content) {
try { $json = $resp.Content | ConvertFrom-Json } catch { $json = $null }
}

return [pscustomobject]@{ Status = [int]$resp.StatusCode; Json = $json; Raw = $resp.Content }
} catch [System.Net.WebException] {
$r = $_.Exception.Response
$status = -1
$content = ''
$json = $null

if ($r) {
$status = [int]$r.StatusCode
$stream = $r.GetResponseStream()
if ($stream) {
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
}
}

if ($content) {
try { $json = $content | ConvertFrom-Json } catch { $json = $null }
}

return [pscustomobject]@{ Status = $status; Json = $json; Raw = $content }
}
}

$checks = New-Object System.Collections.Generic.List[object]
function Add-Check {
param([string]$Name, [bool]$Pass, [int]$Status, [int]$Expected, [string]$Note)
$checks.Add([pscustomobject]@{
Name = $Name
Pass = $Pass
Status = $Status
Expected = $Expected
Note = $Note
}) | Out-Null
}

$base = 'http://localhost:3004'
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$adminEmail = "precheckadmin+$stamp@example.com"
$adminPass = 'Pass1234'
$userEmail = "precheckuser+$stamp@example.com"
$userPass = 'UserPass123'

bun run create:admin -- --adminName 'Precheck Admin' --email $adminEmail --phone '9999999999' --password $adminPass | Out-Null

$signupResp = Invoke-Api -Method 'Post' -Uri "$base/auth/signup" -Headers @{} -Body @{
username = "precheck_user_$stamp"
phone = '8887776666'
email = $userEmail
password = $userPass
age = 29
gender = 'Male'
healthGoals = @('Goal')
}
Add-Check -Name 'auth/signup user' -Pass ($signupResp.Status -eq 201) -Status $signupResp.Status -Expected 201 -Note ''
$userId = $signupResp.Json.userId

$adminPair = ('{0}:{1}' -f $adminEmail, $adminPass)
$adminToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($adminPair))
$adminHeaders = @{ Authorization = "Basic $adminToken" }

$userPair = ('{0}:{1}' -f $userEmail, $userPass)
$userToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($userPair))
$userHeaders = @{ Authorization = "Basic $userToken" }

$bookingDate = (Get-Date).ToUniversalTime().AddDays(1).ToString('yyyy-MM-ddT09:00:00.000Z')
$oneOffDate = (Get-Date).ToUniversalTime().AddDays(1).ToString('yyyy-MM-ddT00:00:00.000Z')

$slotDailyResp = Invoke-Api -Method 'Post' -Uri "$base/slots" -Headers $adminHeaders -Body @{
isDaily = $true
startTime = '09:00'
endTime = '10:00'
capacity = 1
}
Add-Check -Name 'slots POST daily' -Pass ($slotDailyResp.Status -eq 201) -Status $slotDailyResp.Status -Expected 201 -Note ''
$slotDailyId = $slotDailyResp.Json.slot._id

$slotOneOffResp = Invoke-Api -Method 'Post' -Uri "$base/slots" -Headers $adminHeaders -Body @{
isDaily = $false
date = $oneOffDate
startTime = '10:00'
endTime = '11:00'
capacity = 2
}
Add-Check -Name 'slots POST one-off' -Pass ($slotOneOffResp.Status -eq 201) -Status $slotOneOffResp.Status -Expected 201 -Note ''
$slotOneOffId = $slotOneOffResp.Json.slot._id

$slotInvalidDateResp = Invoke-Api -Method 'Post' -Uri "$base/slots" -Headers $adminHeaders -Body @{
isDaily = $false
startTime = '12:00'
endTime = '13:00'
capacity = 1
}
Add-Check -Name 'slots POST invalid missing date' -Pass ($slotInvalidDateResp.Status -eq 400) -Status $slotInvalidDateResp.Status -Expected 400 -Note ''

$slotsListResp = Invoke-Api -Method 'Get' -Uri "$base/slots" -Headers $adminHeaders
$slotsCount = if ($slotsListResp.Json -and $slotsListResp.Json.slots) { $slotsListResp.Json.slots.Count } else { 0 }
Add-Check -Name 'slots GET all' -Pass ($slotsListResp.Status -eq 200 -and $slotsCount -ge 2) -Status $slotsListResp.Status -Expected 200 -Note "count=$slotsCount"

$slotGetResp = Invoke-Api -Method 'Get' -Uri "$base/slots/$slotDailyId" -Headers $adminHeaders
Add-Check -Name 'slots GET by id' -Pass ($slotGetResp.Status -eq 200) -Status $slotGetResp.Status -Expected 200 -Note ''

$slotPatchValidResp = Invoke-Api -Method 'Patch' -Uri "$base/slots/$slotOneOffId" -Headers $adminHeaders -Body @{
capacity = 4
remainingCapacity = 2
}
$slotPatchValidPass = ($slotPatchValidResp.Status -eq 200 -and [int]$slotPatchValidResp.Json.slot.capacity -eq 4 -and [int]$slotPatchValidResp.Json.slot.remainingCapacity -eq 2)
Add-Check -Name 'slots PATCH valid' -Pass $slotPatchValidPass -Status $slotPatchValidResp.Status -Expected 200 -Note ''

$slotPatchInvalidResp = Invoke-Api -Method 'Patch' -Uri "$base/slots/$slotOneOffId" -Headers $adminHeaders -Body @{
capacity = 1
remainingCapacity = 2
}
Add-Check -Name 'slots PATCH invalid remaining>capacity' -Pass ($slotPatchInvalidResp.Status -eq 400) -Status $slotPatchInvalidResp.Status -Expected 400 -Note ''

$slotsUserResp = Invoke-Api -Method 'Get' -Uri "$base/slots" -Headers $userHeaders
Add-Check -Name 'slots GET as user forbidden' -Pass ($slotsUserResp.Status -eq 403) -Status $slotsUserResp.Status -Expected 403 -Note ''

$therapyResp = Invoke-Api -Method 'Post' -Uri "$base/therapies" -Headers $adminHeaders -Body @{
therapyName = 'Precheck Therapy'
therapyTime = 60
creditCost = 2
description = 'Pre-prod endpoint verification'
tags = @('precheck')
slots = @($slotDailyId)
}
Add-Check -Name 'therapies POST create' -Pass ($therapyResp.Status -eq 201) -Status $therapyResp.Status -Expected 201 -Note ''
$therapyId = $therapyResp.Json.therapy._id

$therapyListResp = Invoke-Api -Method 'Get' -Uri "$base/therapies" -Headers $adminHeaders
$therapyFound = $false
if ($therapyListResp.Json -and $therapyListResp.Json.therapies) {
$therapyFound = ($therapyListResp.Json.therapies | Where-Object { $_._id -eq $therapyId }).Count -gt 0
}
Add-Check -Name 'therapies GET all' -Pass ($therapyListResp.Status -eq 200 -and $therapyFound) -Status $therapyListResp.Status -Expected 200 -Note ''

$therapyGetResp = Invoke-Api -Method 'Get' -Uri "$base/therapies/$therapyId" -Headers $adminHeaders
Add-Check -Name 'therapies GET by id' -Pass ($therapyGetResp.Status -eq 200) -Status $therapyGetResp.Status -Expected 200 -Note ''

$therapyPatchResp = Invoke-Api -Method 'Patch' -Uri "$base/therapies/$therapyId" -Headers $adminHeaders -Body @{
therapyName = 'Precheck Therapy Updated'
creditCost = 3
}
$therapyPatchPass = ($therapyPatchResp.Status -eq 200 -and $therapyPatchResp.Json.therapy.therapyName -eq 'Precheck Therapy Updated')
Add-Check -Name 'therapies PATCH update' -Pass $therapyPatchPass -Status $therapyPatchResp.Status -Expected 200 -Note ''

$therapyDeleteProbeResp = Invoke-Api -Method 'Post' -Uri "$base/therapies" -Headers $adminHeaders -Body @{
therapyName = 'Precheck Therapy Delete'
therapyTime = 30
creditCost = 1
description = 'Delete probe'
tags = @('precheck')
slots = @($slotDailyId)
}
$therapyDeleteProbeId = $therapyDeleteProbeResp.Json.therapy._id
$therapyDeleteProbeDeleteResp = Invoke-Api -Method 'Delete' -Uri "$base/therapies/$therapyDeleteProbeId" -Headers $adminHeaders
Add-Check -Name 'therapies DELETE' -Pass ($therapyDeleteProbeDeleteResp.Status -eq 200) -Status $therapyDeleteProbeDeleteResp.Status -Expected 200 -Note ''

$bookingCreateResp = Invoke-Api -Method 'Post' -Uri "$base/bookings" -Headers $adminHeaders -Body @{
bookingDate = $bookingDate
userId = $userId
slotId = $slotDailyId
serviceId = $therapyId
bypassCredits = $true
}
Add-Check -Name 'bookings POST create' -Pass ($bookingCreateResp.Status -eq 201) -Status $bookingCreateResp.Status -Expected 201 -Note ''
$booking1Id = $bookingCreateResp.Json.booking._id
$bookingResolvedSlotId = $bookingCreateResp.Json.booking.slot

$bookingConflictResp = Invoke-Api -Method 'Post' -Uri "$base/bookings" -Headers $adminHeaders -Body @{
bookingDate = $bookingDate
userId = $userId
slotId = $slotDailyId
serviceId = $therapyId
bypassCredits = $true
}
Add-Check -Name 'bookings POST conflict at capacity' -Pass ($bookingConflictResp.Status -eq 409) -Status $bookingConflictResp.Status -Expected 409 -Note ''

$bookingUserBypassResp = Invoke-Api -Method 'Post' -Uri "$base/bookings" -Headers $userHeaders -Body @{
bookingDate = $bookingDate
slotId = $slotDailyId
serviceId = $therapyId
bypassCredits = $true
}
Add-Check -Name 'bookings POST user bypass forbidden' -Pass ($bookingUserBypassResp.Status -eq 403) -Status $bookingUserBypassResp.Status -Expected 403 -Note ''

$bookingsAdminResp = Invoke-Api -Method 'Get' -Uri "$base/bookings" -Headers $adminHeaders
$bookingInAdminList = $false
if ($bookingsAdminResp.Json -and $bookingsAdminResp.Json.bookings) {
$bookingInAdminList = ($bookingsAdminResp.Json.bookings | Where-Object { $_._id -eq $booking1Id }).Count -gt 0
}
Add-Check -Name 'bookings GET all admin' -Pass ($bookingsAdminResp.Status -eq 200 -and $bookingInAdminList) -Status $bookingsAdminResp.Status -Expected 200 -Note ''

$bookingsMeResp = Invoke-Api -Method 'Get' -Uri "$base/bookings/me" -Headers $userHeaders
$bookingInMeList = $false
if ($bookingsMeResp.Json -and $bookingsMeResp.Json.bookings) {
$bookingInMeList = ($bookingsMeResp.Json.bookings | Where-Object { $_._id -eq $booking1Id }).Count -gt 0
}
Add-Check -Name 'bookings GET me user' -Pass ($bookingsMeResp.Status -eq 200 -and $bookingInMeList) -Status $bookingsMeResp.Status -Expected 200 -Note ''

$bookingGetResp = Invoke-Api -Method 'Get' -Uri "$base/bookings/$booking1Id" -Headers $adminHeaders
Add-Check -Name 'bookings GET by id' -Pass ($bookingGetResp.Status -eq 200) -Status $bookingGetResp.Status -Expected 200 -Note ''

$bookingPatchResp = Invoke-Api -Method 'Patch' -Uri "$base/bookings/$booking1Id" -Headers $adminHeaders -Body @{
bookingDate = (Get-Date).ToUniversalTime().AddDays(1).ToString('yyyy-MM-ddT09:15:00.000Z')
}
Add-Check -Name 'bookings PATCH update' -Pass ($bookingPatchResp.Status -eq 200) -Status $bookingPatchResp.Status -Expected 200 -Note ''

$bookingCancelResp = Invoke-Api -Method 'Patch' -Uri "$base/bookings/$booking1Id/status" -Headers $adminHeaders -Body @{ status = 2 }
Add-Check -Name 'bookings PATCH status cancel' -Pass ($bookingCancelResp.Status -eq 200) -Status $bookingCancelResp.Status -Expected 200 -Note ''

$bookingRecreateResp = Invoke-Api -Method 'Post' -Uri "$base/bookings" -Headers $adminHeaders -Body @{
bookingDate = $bookingDate
userId = $userId
slotId = $slotDailyId
serviceId = $therapyId
bypassCredits = $true
}
Add-Check -Name 'bookings POST after cancel release' -Pass ($bookingRecreateResp.Status -eq 201) -Status $bookingRecreateResp.Status -Expected 201 -Note ''
$booking2Id = $bookingRecreateResp.Json.booking._id

$bookingDelete2Resp = Invoke-Api -Method 'Delete' -Uri "$base/bookings/$booking2Id" -Headers $adminHeaders
Add-Check -Name 'bookings DELETE second' -Pass ($bookingDelete2Resp.Status -eq 200) -Status $bookingDelete2Resp.Status -Expected 200 -Note ''

$bookingDelete1Resp = Invoke-Api -Method 'Delete' -Uri "$base/bookings/$booking1Id" -Headers $adminHeaders
Add-Check -Name 'bookings DELETE first' -Pass ($bookingDelete1Resp.Status -eq 200) -Status $bookingDelete1Resp.Status -Expected 200 -Note ''

$therapyDeleteResp = Invoke-Api -Method 'Delete' -Uri "$base/therapies/$therapyId" -Headers $adminHeaders
Add-Check -Name 'therapies DELETE primary' -Pass ($therapyDeleteResp.Status -eq 200) -Status $therapyDeleteResp.Status -Expected 200 -Note ''

if ($bookingResolvedSlotId) {
$slotDeleteResolvedResp = Invoke-Api -Method 'Delete' -Uri "$base/slots/$bookingResolvedSlotId" -Headers $adminHeaders
Add-Check -Name 'slots DELETE resolved dated slot' -Pass ($slotDeleteResolvedResp.Status -eq 200 -or $slotDeleteResolvedResp.Status -eq 404) -Status $slotDeleteResolvedResp.Status -Expected 200 -Note ''
}

$slotDeleteDailyResp = Invoke-Api -Method 'Delete' -Uri "$base/slots/$slotDailyId" -Headers $adminHeaders
Add-Check -Name 'slots DELETE daily template' -Pass ($slotDeleteDailyResp.Status -eq 200) -Status $slotDeleteDailyResp.Status -Expected 200 -Note ''

$slotDeleteOneOffResp = Invoke-Api -Method 'Delete' -Uri "$base/slots/$slotOneOffId" -Headers $adminHeaders
Add-Check -Name 'slots DELETE one-off' -Pass ($slotDeleteOneOffResp.Status -eq 200) -Status $slotDeleteOneOffResp.Status -Expected 200 -Note ''

$checks | Format-Table -AutoSize
$failed = ($checks | Where-Object { -not $_.Pass }).Count
Write-Output "CHECK_SUMMARY_TOTAL=$($checks.Count)"
Write-Output "CHECK_SUMMARY_FAILED=$failed"
Write-Output "CHECK_ADMIN_EMAIL=$adminEmail"
Write-Output "CHECK_USER_EMAIL=$userEmail"
