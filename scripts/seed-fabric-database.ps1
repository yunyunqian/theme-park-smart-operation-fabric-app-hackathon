param(
    [string]$Server = 'w4a2rh5hruje5almlgafowspwu-3q54kg4npakuli22tjjashmevy.database.fabric.microsoft.com',
    [string]$Database = 'smart-operations-947fa73e-d04b-4abe-84dc-e85e576ade28'
)

$ErrorActionPreference = 'Stop'
$token = az account get-access-token --resource https://database.windows.net --query accessToken -o tsv
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
    throw 'Unable to acquire a Fabric SQL token. Run az login and try again.'
}

$connectionString = "Server=tcp:$Server,1433;Initial Catalog=$Database;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30"
$connection = New-Object System.Data.SqlClient.SqlConnection $connectionString

try {
    $connection.AccessToken = $token
    $connection.Open()

    $command = $connection.CreateCommand()
    $command.CommandTimeout = 120
    $command.CommandText = Get-Content -Raw (Join-Path $PSScriptRoot 'seed-fabric-database.sql')
    [void]$command.ExecuteNonQuery()

    $command.CommandText = @'
SELECT t.name AS TableName, SUM(p.rows) AS RowsPresent
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
WHERE t.name IN ('Parks', 'Lands', 'Rides', 'RideTelemetries', 'Washrooms', 'WashroomTelemetries', 'WeatherSnapshots', 'CrowdZones', 'OperationsAlerts', 'AIInsights', 'MaintenanceAssets')
GROUP BY t.name
ORDER BY t.name
'@
    $reader = $command.ExecuteReader()
    $counts = New-Object System.Data.DataTable
    $counts.Load($reader)
    $counts | Format-Table -AutoSize
}
finally {
    if ($connection.State -ne 'Closed') {
        $connection.Close()
    }
}