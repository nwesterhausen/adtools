param (
    [Parameter(Mandatory = $true)]
    [string] $username
)

Get-ADPrincipalGroupMembership $username | Select-Object DistinguishedName, name, ObjectClass | ConvertTo-Json -Compress
