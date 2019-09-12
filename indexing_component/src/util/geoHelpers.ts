import { CountryGeometry } from "../models/countryGeometry";
import * as countryGeometry from '../data/countryGeometry.json';

export const CountryIsoList: string[] = countryGeometry.features.map(f => f.properties.ISO).concat(['00']);

export async function getCountry(coordinates: number[]): Promise<string> {
  const country = await CountryGeometry.Model.findOne({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        }
      }
    }
  }, { _id: 0, countryISO: 1 });

  if (!country) {
    console.error(`Country at [${coordinates[0]}, ${coordinates[1]}] not found.`);
    return '00';
  }

  return country.countryISO;
}

export async function getCountriesInRegion(coordinates: number[][]): Promise<string[]> {
  const country = await CountryGeometry.Model.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    }
  }, { _id: 0, countryISO: 1 });

  return country.map(c => c.countryISO).concat(['00']);
}


/// Computes a circle that encloses the rectangle
/// TODO: add support for arbitary polygons - compute minimal enclosing circle
export function getBoundingCircle(coordinates: number[][]): { center: number[]; radius: number } {
  const p1 = coordinates[0]; // An arbitary point
  const p2 = coordinates[2]; // Point opposite p1
  const d = [p2[0] - p1[0], p2[1] - p1[1]]; // Diagonal
  const l = Math.sqrt(d[0] * d[0] + d[1] * d[1]) * 6371000; // Radius in meters

  return { center: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], radius: l };
}