Get-ADUser -Filter * -Properties displayName, company, department, description, lastLogon, logonCount, manager, title | ConvertTo-Json -Compress