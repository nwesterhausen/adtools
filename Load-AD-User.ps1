param (
    [Parameter(Mandatory = $true)]
    [string] $username
)

try {
    Get-ADUser $username -Properties proxyAddresses, displayName, company, department, description, lastLogon, logonCount, manager | ConvertTo-Json -Compress
}
catch {
    $likeuser = '*' + $username + '*'
    Get-ADUser -Filter { name -like $likeuser } | ConvertTo-Json -Compress
}