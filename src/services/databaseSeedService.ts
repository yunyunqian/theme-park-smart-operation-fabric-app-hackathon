import type { Park } from '../../rayfin/data/operations';
import { DatabaseProvider } from '../providers/databaseProvider';
import { cleaningUrgencyScore, maintenanceRiskScore } from './scoringService';

type ParkTemplate = Pick<Park, 'name' | 'shortName' | 'latitude' | 'longitude' | 'color'>;

function parkTemplate(index: number): ParkTemplate {
  switch (index) {
    case 0: return { name: 'Magic Kingdom', shortName: 'MK', latitude: 28.4187, longitude: -81.5812, color: '#2d7ff9' };
    case 1: return { name: 'EPCOT', shortName: 'EP', latitude: 28.3747, longitude: -81.5494, color: '#00a88f' };
    case 2: return { name: 'Hollywood Studios', shortName: 'HS', latitude: 28.3575, longitude: -81.5583, color: '#df6c3f' };
    default: return { name: 'Animal Kingdom', shortName: 'AK', latitude: 28.3553, longitude: -81.5901, color: '#7a6f45' };
  }
}

function landName(parkIndex: number, landIndex: number): string {
  const key = parkIndex * 3 + landIndex;
  switch (key) {
    case 0: return 'Tomorrowland'; case 1: return 'Fantasyland'; case 2: return 'Frontierland';
    case 3: return 'World Celebration'; case 4: return 'World Discovery'; case 5: return 'World Nature';
    case 6: return 'Hollywood Boulevard'; case 7: return 'Galaxy’s Edge'; case 8: return 'Toy Story Land';
    case 9: return 'Discovery Island'; case 10: return 'Pandora'; default: return 'Asia';
  }
}

function rideName(parkIndex: number, rideIndex: number): string {
  const key = parkIndex * 3 + rideIndex;
  switch (key) {
    case 0: return 'TRON Lightcycle / Run'; case 1: return 'Seven Dwarfs Mine Train'; case 2: return 'Big Thunder Mountain Railroad';
    case 3: return 'Spaceship Earth'; case 4: return 'Guardians of the Galaxy: Cosmic Rewind'; case 5: return 'Soarin’ Around the World';
    case 6: return 'The Twilight Zone Tower of Terror'; case 7: return 'Star Wars: Rise of the Resistance'; case 8: return 'Slinky Dog Dash';
    case 9: return 'DINOSAUR'; case 10: return 'Avatar Flight of Passage'; default: return 'Expedition Everest';
  }
}

function attractionType(index: number): string {
  switch (index % 4) { case 0: return 'Launch coaster'; case 1: return 'Dark ride'; case 2: return 'Family coaster'; default: return 'Flight simulator'; }
}

export class DatabaseSeedService {
  constructor(private readonly database = new DatabaseProvider()) {}

  async seedIfEmpty(): Promise<boolean> {
    if ((await this.database.getParks()).length > 0) return false;
    const now = new Date();
    for (let parkIndex = 0; parkIndex < 4; parkIndex += 1) {
      const template = parkTemplate(parkIndex);
      const park = await this.database.parks.create({ id: crypto.randomUUID(), ...template, operationalStatus: 'Normal', averageWaitTime: 35 + parkIndex * 4, crowdScore: 48 + parkIndex * 3, healthScore: 94 - parkIndex * 2, lastUpdated: now });
      for (let landIndex = 0; landIndex < 3; landIndex += 1) {
        const land = await this.database.lands.create({ id: crypto.randomUUID(), parkId: park.id, name: landName(parkIndex, landIndex) });
        const wait = 25 + parkIndex * 7 + landIndex * 13;
        const ride = await this.database.rides.create({ id: crypto.randomUUID(), parkId: park.id, landId: land.id, name: rideName(parkIndex, landIndex), attractionType: attractionType(parkIndex + landIndex), latitude: park.latitude + (landIndex - 1) * 0.003, longitude: park.longitude + (landIndex - 1) * 0.003, currentStatus: 'Open', currentWaitTime: wait, previousWaitTime: wait, lastUpdated: now });
        const vibration = 22 + parkIndex * 8 + landIndex * 7;
        const temperature = 49 + parkIndex * 3 + landIndex * 2;
        const risk = maintenanceRiskScore(vibration, temperature, landIndex, 420 + parkIndex * 80);
        await this.database.rideTelemetry.create({ id: crypto.randomUUID(), rideId: ride.id, timestamp: now, motorTemperature: temperature, vibrationScore: vibration, cycleCount: 420 + parkIndex * 80, downtimeEvents: landIndex, maintenanceRiskScore: risk, faultCode: risk > 70 ? `VIB-${parkIndex}${landIndex}` : undefined, recommendedAction: risk > 70 ? 'Inspect drive assembly during the next maintenance window.' : 'Continue standard monitoring.' });
        await this.database.maintenance.create({ id: crypto.randomUUID(), assetName: ride.name, assetType: ride.attractionType, parkId: park.id, currentStatus: risk > 70 ? 'Inspection Required' : risk > 50 ? 'Monitor' : 'Operational', riskScore: risk, nextMaintenanceDate: new Date(now.getTime() + (2 + landIndex) * 86_400_000), lastInspectionDate: new Date(now.getTime() - (5 + parkIndex) * 86_400_000) });
        await this.database.crowdZones.create({ id: crypto.randomUUID(), parkId: park.id, name: land.name, crowdScore: 42 + parkIndex * 5 + landIndex * 8, congestionStatus: landIndex === 2 ? 'Busy' : 'Moderate' });
        if (landIndex < 2) {
          const washroom = await this.database.washrooms.create({ id: crypto.randomUUID(), parkId: park.id, landId: land.id, name: `${land.name} Guest Restrooms`, facilityType: 'Guest washroom', latitude: park.latitude + (landIndex ? 0.002 : -0.002), longitude: park.longitude + (landIndex ? -0.002 : 0.002), capacity: 36 + parkIndex * 4, accessibilityEnabled: true });
          const occupancy = 38 + parkIndex * 7 + landIndex * 9;
          const urgency = cleaningUrgencyScore(occupancy, 34 + parkIndex * 5, 55 + landIndex * 30, [72 - parkIndex * 4, 66 - landIndex * 7, 81 - parkIndex * 3], 0);
          await this.database.washroomTelemetry.create({ id: crypto.randomUUID(), washroomId: washroom.id, timestamp: now, occupancy, trafficCount: 34 + parkIndex * 5, soapLevel: 72 - parkIndex * 4, paperTowelLevel: 66 - landIndex * 7, toiletPaperLevel: 81 - parkIndex * 3, maintenanceIssueCount: 0, cleaningUrgencyScore: urgency, lastCleanedTime: new Date(now.getTime() - (55 + landIndex * 30) * 60_000), assignedCastMember: `Facilities Team ${parkIndex + 1}`, nextCleaningTime: new Date(now.getTime() + (30 + landIndex * 15) * 60_000) });
        }
      }
    }
    await this.database.weather.create({ id: crypto.randomUUID(), timestamp: now, temperature: 29, humidity: 68, windSpeed: 12, precipitationProbability: 18, weatherCode: 2 });
    await this.database.insights.create({ id: crypto.randomUUID(), category: 'operations', severity: 'medium', title: 'Operational baseline established', description: 'The resort digital twin is now reading its operational baseline from Fabric SQL.', relatedScreen: 'operations', recommendation: 'Monitor crowd and maintenance exceptions as live telemetry accumulates.', createdTime: now });
    return true;
  }
}