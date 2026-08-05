SET NOCOUNT ON;
SET XACT_ABORT ON;

IF EXISTS (SELECT 1 FROM Parks)
BEGIN
    PRINT 'ParkPulse baseline already exists; no rows were added.';
    RETURN;
END;

BEGIN TRANSACTION;

DECLARE @Now datetime2 = SYSUTCDATETIME();
DECLARE @Parks TABLE (
    ParkIndex int PRIMARY KEY,
    id uniqueidentifier,
    name nvarchar(120),
    shortName nvarchar(8),
    latitude decimal(10, 6),
    longitude decimal(10, 6),
    color nvarchar(16)
);

INSERT INTO @Parks VALUES
    (0, NEWID(), N'Magic Kingdom', N'MK', 28.418700, -81.581200, N'#2d7ff9'),
    (1, NEWID(), N'EPCOT', N'EP', 28.374700, -81.549400, N'#00a88f'),
    (2, NEWID(), N'Hollywood Studios', N'HS', 28.357500, -81.558300, N'#df6c3f'),
    (3, NEWID(), N'Animal Kingdom', N'AK', 28.355300, -81.590100, N'#7a6f45');

INSERT INTO Parks (id, name, shortName, latitude, longitude, color, operationalStatus, averageWaitTime, crowdScore, healthScore, lastUpdated)
SELECT id, name, shortName, latitude, longitude, color, N'Normal', 35 + ParkIndex * 4, 48 + ParkIndex * 3, 94 - ParkIndex * 2, @Now
FROM @Parks;

DECLARE @Lands TABLE (
    ParkIndex int,
    LandIndex int,
    id uniqueidentifier,
    parkId uniqueidentifier,
    name nvarchar(120),
    PRIMARY KEY (ParkIndex, LandIndex)
);

INSERT INTO @Lands
SELECT p.ParkIndex, names.LandIndex, NEWID(), p.id, names.name
FROM @Parks p
CROSS APPLY (VALUES
    (0, CASE p.ParkIndex WHEN 0 THEN N'Tomorrowland' WHEN 1 THEN N'World Celebration' WHEN 2 THEN N'Hollywood Boulevard' ELSE N'Discovery Island' END),
    (1, CASE p.ParkIndex WHEN 0 THEN N'Fantasyland' WHEN 1 THEN N'World Discovery' WHEN 2 THEN N'Galaxy''s Edge' ELSE N'Pandora' END),
    (2, CASE p.ParkIndex WHEN 0 THEN N'Frontierland' WHEN 1 THEN N'World Nature' WHEN 2 THEN N'Toy Story Land' ELSE N'Asia' END)
) names(LandIndex, name);

INSERT INTO Lands (id, parkId, name)
SELECT id, parkId, name FROM @Lands;

DECLARE @Rides TABLE (
    ParkIndex int,
    LandIndex int,
    id uniqueidentifier,
    parkId uniqueidentifier,
    landId uniqueidentifier,
    name nvarchar(160),
    attractionType nvarchar(80),
    waitTime int,
    latitude decimal(10, 6),
    longitude decimal(10, 6),
    PRIMARY KEY (ParkIndex, LandIndex)
);

INSERT INTO @Rides
SELECT l.ParkIndex, l.LandIndex, NEWID(), l.parkId, l.id,
    CASE l.ParkIndex * 3 + l.LandIndex
        WHEN 0 THEN N'TRON Lightcycle / Run' WHEN 1 THEN N'Seven Dwarfs Mine Train' WHEN 2 THEN N'Big Thunder Mountain Railroad'
        WHEN 3 THEN N'Spaceship Earth' WHEN 4 THEN N'Guardians of the Galaxy: Cosmic Rewind' WHEN 5 THEN N'Soarin'' Around the World'
        WHEN 6 THEN N'The Twilight Zone Tower of Terror' WHEN 7 THEN N'Star Wars: Rise of the Resistance' WHEN 8 THEN N'Slinky Dog Dash'
        WHEN 9 THEN N'DINOSAUR' WHEN 10 THEN N'Avatar Flight of Passage' ELSE N'Expedition Everest'
    END,
    CASE (l.ParkIndex + l.LandIndex) % 4 WHEN 0 THEN N'Launch coaster' WHEN 1 THEN N'Dark ride' WHEN 2 THEN N'Family coaster' ELSE N'Flight simulator' END,
    25 + l.ParkIndex * 7 + l.LandIndex * 13,
    p.latitude + (l.LandIndex - 1) * 0.003,
    p.longitude + (l.LandIndex - 1) * 0.003
FROM @Lands l
JOIN @Parks p ON p.ParkIndex = l.ParkIndex;

INSERT INTO Rides (id, parkId, landId, name, attractionType, latitude, longitude, currentStatus, currentWaitTime, previousWaitTime, lastUpdated)
SELECT id, parkId, landId, name, attractionType, latitude, longitude, N'Open', waitTime, waitTime, @Now
FROM @Rides;

INSERT INTO RideTelemetries (id, rideId, [timestamp], motorTemperature, vibrationScore, cycleCount, downtimeEvents, maintenanceRiskScore, faultCode, recommendedAction)
SELECT NEWID(), id, @Now, 49 + ParkIndex * 3 + LandIndex * 2, 22 + ParkIndex * 8 + LandIndex * 7,
    420 + ParkIndex * 80, LandIndex,
    28 + ParkIndex * 9 + LandIndex * 7,
    CASE WHEN ParkIndex = 3 AND LandIndex = 2 THEN N'VIB-32' ELSE NULL END,
    CASE WHEN ParkIndex = 3 AND LandIndex = 2 THEN N'Inspect drive assembly during the next maintenance window.' ELSE N'Continue standard monitoring.' END
FROM @Rides;

INSERT INTO MaintenanceAssets (id, assetName, assetType, parkId, currentStatus, riskScore, nextMaintenanceDate, lastInspectionDate)
SELECT NEWID(), name, attractionType, parkId,
    CASE WHEN 28 + ParkIndex * 9 + LandIndex * 7 > 70 THEN N'Inspection Required' WHEN 28 + ParkIndex * 9 + LandIndex * 7 > 50 THEN N'Monitor' ELSE N'Operational' END,
    28 + ParkIndex * 9 + LandIndex * 7,
    DATEADD(day, 2 + LandIndex, @Now), DATEADD(day, -(5 + ParkIndex), @Now)
FROM @Rides;

INSERT INTO CrowdZones (id, parkId, name, crowdScore, congestionStatus)
SELECT NEWID(), parkId, name, 42 + ParkIndex * 5 + LandIndex * 8,
    CASE WHEN LandIndex = 2 THEN N'Busy' ELSE N'Moderate' END
FROM @Lands;

DECLARE @Washrooms TABLE (
    ParkIndex int,
    LandIndex int,
    id uniqueidentifier,
    parkId uniqueidentifier,
    landId uniqueidentifier,
    name nvarchar(160),
    PRIMARY KEY (ParkIndex, LandIndex)
);

INSERT INTO @Washrooms
SELECT l.ParkIndex, l.LandIndex, NEWID(), l.parkId, l.id, l.name + N' Guest Restrooms'
FROM @Lands l
WHERE l.LandIndex < 2;

INSERT INTO Washrooms (id, parkId, landId, name, facilityType, latitude, longitude, capacity, accessibilityEnabled)
SELECT w.id, w.parkId, w.landId, w.name, N'Guest washroom',
    p.latitude + CASE w.LandIndex WHEN 0 THEN -0.002 ELSE 0.002 END,
    p.longitude + CASE w.LandIndex WHEN 0 THEN 0.002 ELSE -0.002 END,
    36 + w.ParkIndex * 4, 1
FROM @Washrooms w
JOIN @Parks p ON p.ParkIndex = w.ParkIndex;

INSERT INTO WashroomTelemetries (id, washroomId, [timestamp], occupancy, trafficCount, soapLevel, paperTowelLevel, toiletPaperLevel, maintenanceIssueCount, cleaningUrgencyScore, lastCleanedTime, assignedCastMember, nextCleaningTime)
SELECT NEWID(), id, @Now, 38 + ParkIndex * 7 + LandIndex * 9, 34 + ParkIndex * 5,
    72 - ParkIndex * 4, 66 - LandIndex * 7, 81 - ParkIndex * 3, 0,
    36 + ParkIndex * 8 + LandIndex * 10,
    DATEADD(minute, -(55 + LandIndex * 30), @Now), N'Facilities Team ' + CONVERT(nvarchar(2), ParkIndex + 1),
    DATEADD(minute, 30 + LandIndex * 15, @Now)
FROM @Washrooms;

INSERT INTO WeatherSnapshots (id, [timestamp], temperature, humidity, windSpeed, precipitationProbability, weatherCode)
VALUES (NEWID(), @Now, 29, 68, 12, 18, 2);

INSERT INTO OperationsAlerts (id, category, severity, title, description, relatedEntityId, relatedEntityType, recommendedAction, createdTime, acknowledged)
SELECT TOP 1 NEWID(), N'maintenance', N'high', N'Inspection window recommended',
    N'Ride telemetry indicates elevated vibration and maintenance risk.', id, N'Ride',
    N'Inspect the drive assembly during the next maintenance window.', @Now, 0
FROM @Rides
ORDER BY ParkIndex DESC, LandIndex DESC;

INSERT INTO AIInsights (id, category, severity, title, description, relatedScreen, relatedEntityId, recommendation, createdTime)
VALUES (NEWID(), N'operations', N'medium', N'Operational baseline established',
    N'The resort digital twin is now reading its operational baseline from Fabric SQL.', N'operations', NULL,
    N'Monitor crowd and maintenance exceptions as live telemetry accumulates.', @Now);

COMMIT TRANSACTION;
PRINT 'ParkPulse Fabric SQL baseline created.';