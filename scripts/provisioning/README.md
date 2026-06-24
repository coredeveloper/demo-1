# SharePoint provisioning — Teams Copilot survey agent

Stands up the SharePoint knowledge library that grounds the Copilot Studio agent
(see `demo/03-teams-copilot-agent/` in the RFP folder). Turns the manual
"drag PDFs into SharePoint + set permissions" step into one command.

## 1. Generate the PDFs
```
node_modules/.bin/tsx scripts/gen-2567-pdfs.ts
# -> scripts/out/2567/{FL,GA}/*.pdf  (30 synthetic CMS-2567 forms)
```

## 2. Prereqs (one time)
```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
# Modern PnP needs an app registration for interactive auth:
Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP-Provisioning" -Tenant <tenant>.onmicrosoft.com
```
Create the Entra **security** groups + a couple of test users each (portal, or Microsoft.Graph):
```powershell
New-MgGroup -DisplayName 'srv-FL-surveyors' -MailEnabled:$false -SecurityEnabled:$true -MailNickname 'srvFLsurveyors'
New-MgGroup -DisplayName 'srv-GA-surveyors' -MailEnabled:$false -SecurityEnabled:$true -MailNickname 'srvGAsurveyors'
```
Note each group's **Object ID**.

## 3. Run
```powershell
# Library + folders + upload only (RBAC inherited):
./Deploy-SurveyLibrary.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/Compliance

# With per-region RBAC (the live boundary demo):
./Deploy-SurveyLibrary.ps1 `
  -SiteUrl https://<tenant>.sharepoint.com/sites/Compliance `
  -ClientId '<pnp-app-client-id>' `
  -RegionGroups @{ FL = '<fl-group-objectid>'; GA = '<ga-group-objectid>' }
```
This creates the `CMS-2567 Surveys` library, `FL`/`GA` folders, a `restricted-demo`
folder (one FL survey readable only by the FL group), uploads the PDFs, and applies
read permissions.

## 4. Wire into Copilot Studio
In Copilot Studio → your agent → **Knowledge → Add → SharePoint** → paste the library
URL. Then publish to Teams. (See `demo/03-teams-copilot-agent/plan.md` Phases 2–4.)

## Notes
- The RBAC block uses the Entra **security-group** claim format. For an M365/unified
  group, switch the login prefix in `Grant-FolderRead` (commented in the script).
- The script is idempotent on the library/folders; re-running re-uploads files.
