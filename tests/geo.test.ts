import { describe, it, expect } from "vitest";
import { calculateHaversineDistance, validateGpsAttendance } from "../lib/geo";

describe("Geospatial & Haversine Distance Validation", () => {
  const officeLocation = { latitude: -6.3021, longitude: 107.0984 }; // MM2100 Cikarang

  it("menghitung jarak 0 meter untuk koordinat yang identik", () => {
    const distance = calculateHaversineDistance(officeLocation, officeLocation);
    expect(distance).toBe(0);
  });

  it("menghitung jarak akurat dalam satuan meter antar dua titik", () => {
    // Titik berjarak ~105 meter dari kantor
    const nearby = { latitude: -6.303, longitude: 107.0988 };
    const distance = calculateHaversineDistance(officeLocation, nearby);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(130);
  });

  it("menerima absensi jika posisi berada di dalam radius kantor dan akurasi GPS baik", () => {
    const insideLocation = { latitude: -6.3022, longitude: 107.0985 }; // ~15m
    const result = validateGpsAttendance({
      employeeLocation: insideLocation,
      officeLocation,
      accuracyMeters: 10,
      maxRadiusMeters: 100,
      maxAccuracyToleranceMeters: 50,
    });

    expect(result.isValid).toBe(true);
    expect(result.isWithinRadius).toBe(true);
    expect(result.isAccuracyValid).toBe(true);
    expect(result.suspiciousFlags).toBeUndefined();
  });

  it("menolak absensi jika pegawai berada di luar radius kantor", () => {
    const farLocation = { latitude: -6.3155, longitude: 107.1422 }; // ~5km di Jababeka
    const result = validateGpsAttendance({
      employeeLocation: farLocation,
      officeLocation,
      accuracyMeters: 15,
      maxRadiusMeters: 100,
      maxAccuracyToleranceMeters: 50,
    });

    expect(result.isValid).toBe(false);
    expect(result.isWithinRadius).toBe(false);
    expect(result.suspiciousFlags).toContain("melebihi radius kantor");
  });

  it("memberi flag mencurigakan jika akurasi GPS bernilai 0 (potensi emulator/mock)", () => {
    const insideLocation = { latitude: -6.3021, longitude: 107.0984 };
    const result = validateGpsAttendance({
      employeeLocation: insideLocation,
      officeLocation,
      accuracyMeters: 0,
      maxRadiusMeters: 100,
      maxAccuracyToleranceMeters: 50,
    });

    expect(result.isValid).toBe(false);
    expect(result.suspiciousFlags).toContain("Akurasi bernilai 0");
  });

  it("melempar error jika input koordinat berada di luar batas bumi", () => {
    expect(() =>
      calculateHaversineDistance({ latitude: 120, longitude: 107.0 }, officeLocation)
    ).toThrow();
  });
});
