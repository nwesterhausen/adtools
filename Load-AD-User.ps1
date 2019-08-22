param (
    [Parameter(Mandatory = $true)]
    [string] $username
)

Get-ADUser $username -Properties proxyAddresses, displayName, company, department, description, lastLogon, logonCount, manager | ConvertTo-Json -Compress
