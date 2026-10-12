// Utilitas Validasi Geospasial Absensi (Formula Haversine)
// Menghitung jarak akurat antara koordinat pegawai dan titik kantor.

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface GpsValidationResult {
  isValid: boolean;
  distanceMeters: number;
  isWithinRadius: boolean;
  isAccuracyValid: boolean;
  suspiciousFlags?: string;
}

/**
 * Hitung jarak dua titik koordinat bumi dalam satuan Meter menggunakan Formula Haversine
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  // Validasi input koordinat
  if (
    isNaN(coord1.latitude) ||
    isNaN(coord1.longitude) ||
    isNaN(coord2.latitude) ||
    isNaN(coord2.longitude) ||
    coord1.latitude < -90 ||
    coord1.latitude > 90 ||
    coord2.latitude < -90 ||
    coord2.latitude > 90 ||
    coord1.longitude < -180 ||
    coord1.longitude > 180 ||
    coord2.longitude < -180 ||
    coord2.longitude > 180
  ) {
    throw new Error("Koordinat latitude atau longitude tidak valid.");
  }

  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Pembulatan 1 desimal meter
}

/**
 * Validasi posisi GPS terhadap radius kantor dan toleransi akurasi MOU
 */
export function validateGpsAttendance(params: {
  employeeLocation: GeoCoordinates;
  officeLocation: GeoCoordinates;
  accuracyMeters: number;
  maxRadiusMeters: number;
  maxAccuracyToleranceMeters: number;
}): GpsValidationResult {
  const {
    employeeLocation,
    officeLocation,
    accuracyMeters,
    maxRadiusMeters,
    maxAccuracyToleranceMeters,
  } = params;

  const distanceMeters = calculateHaversineDistance(employeeLocation, officeLocation);
  const isWithinRadius = distanceMeters <= maxRadiusMeters;
  const isAccuracyValid = accuracyMeters > 0 && accuracyMeters <= maxAccuracyToleranceMeters;

  const flags: string[] = [];

  if (!isWithinRadius) {
    flags.push(`Jarak ${distanceMeters}m melebihi radius kantor ${maxRadiusMeters}m`);
  }

  if (accuracyMeters === 0) {
    flags.push("Akurasi bernilai 0 (Potensi fake GPS emulator)");
  } else if (accuracyMeters > maxAccuracyToleranceMeters) {
    flags.push(`Akurasi sinyal ${accuracyMeters}m melebihi batas toleransi ${maxAccuracyToleranceMeters}m`);
  }

  return {
    isValid: isWithinRadius && isAccuracyValid,
    distanceMeters,
    isWithinRadius,
    isAccuracyValid,
    suspiciousFlags: flags.length > 0 ? flags.join("; ") : undefined,
  };
}
