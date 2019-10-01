# Check for Active Directory Module
$m = (get-module -list -Name ActiveDirectory).Count

if ($m -eq 0) {
    # if there is no active directory module
    Write-Output '{"errorOccured":"True", "msg":"No Active Directory Powershell Module Available"}'
}
else {
    Get-ADDomain | ConvertTo-Json -Compress
}