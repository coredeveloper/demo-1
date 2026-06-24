<#
.SYNOPSIS
  Provision the SharePoint knowledge library that grounds the Teams Copilot survey
  agent: create a document library, region folders, upload the synthetic CMS-2567
  PDFs, seed a restricted folder for the RBAC demo, and (optionally) apply
  per-region Entra-group read permissions.

.DESCRIPTION
  Companion to scripts/gen-2567-pdfs.ts. Generate the PDFs first
  (node_modules/.bin/tsx scripts/gen-2567-pdfs.ts) so scripts/out/2567/{FL,GA}/*.pdf exist.

  Region (state) folders are created in the library and the matching PDFs uploaded.
  A 'restricted-demo' folder holds one FL survey readable only by the FL group — that
  is the live row-level-security moment in the demo (FL user sees it, GA user does not).

  After running, point the Copilot Studio agent's SharePoint knowledge source at the
  library URL (Knowledge > Add > SharePoint).

.PARAMETER SiteUrl
  Target SharePoint site, e.g. https://contoso.sharepoint.com/sites/Compliance

.PARAMETER LibraryName
  Document library to create/use. Default 'CMS-2567 Surveys'.

.PARAMETER PdfRoot
  Folder holding the generated PDFs (state subfolders). Default: ../out/2567 next to this script.

.PARAMETER RegionGroups
  Optional hashtable mapping region -> Entra SECURITY group Object ID, e.g.
  @{ FL = '<guid>'; GA = '<guid>' }. Omit to skip RBAC (folders inherit site perms).

.PARAMETER RestrictedFolder
  Name of the restricted folder for the RBAC demo. Default 'restricted-demo'.

.PARAMETER ClientId
  Optional Entra app (client) id for PnP interactive auth. Modern PnP requires an app
  registration — create one once with: Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP-Provisioning" -Tenant <tenant>.onmicrosoft.com

.EXAMPLE
  ./Deploy-SurveyLibrary.ps1 -SiteUrl https://contoso.sharepoint.com/sites/Compliance

.EXAMPLE
  ./Deploy-SurveyLibrary.ps1 -SiteUrl https://contoso.sharepoint.com/sites/Compliance `
    -ClientId 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' `
    -RegionGroups @{ FL = 'aaaaaaaa-...'; GA = 'bbbbbbbb-...' }

.NOTES
  Prereqs:
    Install-Module PnP.PowerShell -Scope CurrentUser
  Create the Entra security groups beforehand (portal, or Microsoft.Graph):
    New-MgGroup -DisplayName 'srv-FL-surveyors' -MailEnabled:$false -SecurityEnabled:$true -MailNickname 'srvFLsurveyors'
    New-MgGroup -DisplayName 'srv-GA-surveyors' -MailEnabled:$false -SecurityEnabled:$true -MailNickname 'srvGAsurveyors'
  ...then add a couple of test users to each and pass their Object IDs in -RegionGroups.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$SiteUrl,
  [string]$LibraryName = 'CMS-2567 Surveys',
  [string]$PdfRoot,
  [hashtable]$RegionGroups,
  [string]$RestrictedFolder = 'restricted-demo',
  [string]$ClientId
)

$ErrorActionPreference = 'Stop'

# Resolve default PDF source relative to this script (../out/2567).
if (-not $PdfRoot) { $PdfRoot = Join-Path $PSScriptRoot '..\out\2567' }
if (-not (Test-Path $PdfRoot)) {
  throw "PDF source not found: $PdfRoot. Run the generator first: node_modules/.bin/tsx scripts/gen-2567-pdfs.ts"
}
$PdfRoot = (Resolve-Path $PdfRoot).Path
Write-Host "PDF source : $PdfRoot"
Write-Host "Site       : $SiteUrl"
Write-Host "Library    : $LibraryName`n"

# --- Module + connect ---
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
  throw "PnP.PowerShell not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser"
}
Import-Module PnP.PowerShell

if ($ClientId) { Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId }
else           { Connect-PnPOnline -Url $SiteUrl -Interactive }
Write-Host "Connected.`n"

# --- Ensure the document library exists ---
$lib = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
if (-not $lib) {
  New-PnPList -Title $LibraryName -Template DocumentLibrary -OnQuickLaunch | Out-Null
  Write-Host "Created library '$LibraryName'."
} else {
  Write-Host "Using existing library '$LibraryName'."
}

function Ensure-Folder([string]$name) {
  $rel = "$LibraryName/$name"
  Resolve-PnPFolder -SiteRelativePath $rel | Out-Null
  return $rel
}

# --- Upload each state folder (FL, GA, ...) ---
$uploaded = 0
Get-ChildItem -Path $PdfRoot -Directory | ForEach-Object {
  $state  = $_.Name
  $target = Ensure-Folder $state
  Get-ChildItem -Path $_.FullName -Filter *.pdf | ForEach-Object {
    Add-PnPFile -Path $_.FullName -Folder $target | Out-Null
    $uploaded++
  }
  Write-Host "  uploaded $state -> $target"
}
Write-Host "Uploaded $uploaded PDFs.`n"

# --- Seed the restricted folder for the RBAC demo (one FL survey) ---
$restricted = Ensure-Folder $RestrictedFolder
$firstFl = Get-ChildItem -Path (Join-Path $PdfRoot 'FL') -Filter *.pdf -ErrorAction SilentlyContinue | Select-Object -First 1
if ($firstFl) {
  Add-PnPFile -Path $firstFl.FullName -Folder $restricted | Out-Null
  Write-Host "Seeded '$RestrictedFolder' with $($firstFl.Name).`n"
}

# --- Optional RBAC: per-folder Entra security-group read access ---
function Grant-FolderRead([string]$folderName, [string]$groupObjectId) {
  try {
    $folder = Get-PnPFolder -Url "$LibraryName/$folderName"
    $item   = Get-PnPProperty -ClientObject $folder -Property ListItemAllFields
    # Claims login for an Entra SECURITY group. (For an M365/unified group use:
    #   c:0o.c|federateddirectoryclaimprovider|<groupObjectId>  )
    $login = "c:0t.c|tenant|$groupObjectId"
    New-PnPUser -LoginName $login -ErrorAction SilentlyContinue | Out-Null
    # Break inheritance + clear, then grant the group Read only.
    Set-PnPListItemPermission -List $LibraryName -Identity $item.Id -User $login -AddRole 'Read' -ClearExisting
    Write-Host "  RBAC: '$folderName' -> Read for group $groupObjectId"
  } catch {
    Write-Warning "RBAC on '$folderName' failed: $($_.Exception.Message). Check the group Object ID and claim format (security vs M365 group)."
  }
}

if ($RegionGroups) {
  foreach ($region in $RegionGroups.Keys) {
    if (Test-Path (Join-Path $PdfRoot $region)) { Grant-FolderRead $region $RegionGroups[$region] }
  }
  if ($RegionGroups.ContainsKey('FL')) { Grant-FolderRead $RestrictedFolder $RegionGroups['FL'] }
  Write-Host "`nRBAC applied. Verify: an FL-group user sees the restricted survey; a GA-group user does not."
} else {
  Write-Host "Skipped RBAC (no -RegionGroups); folders inherit site permissions."
}

Write-Host "`nDone."
Write-Host "Point the Copilot Studio agent's SharePoint knowledge source at:"
Write-Host "  $SiteUrl  ->  '$LibraryName'"
Disconnect-PnPOnline
