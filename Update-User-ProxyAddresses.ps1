param (
    [Parameter(Mandatory = $true)]
    [string] $userid
    ,
    [Parameter(Mandatory = $true)]
    [array] $proxyAddresses
)

[string[]]$pa = @()

foreach ($p in $proxyAddresses) {
    $pa += $p
}

Set-ADUser -Identity "$userid" -Replace @{proxyAddresses = @($pa) }