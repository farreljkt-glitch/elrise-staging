// Definisikan seluruh tipe data TypeScript untuk aplikasi HRIS "Terhubung Gajiku"
// Menggunakan pendekatan strict typing untuk menjaga integritas data.

export type UserRole = "SUPERADMIN" | "ADMIN" | "PEGAWAI";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string;      // ID Klien jika role adalah ADMIN atau PEGAWAI
  clientName?: string;    // Nama Klien
  employeeId?: string;    // ID Pegawai jika role adalah PEGAWAI
  avatarUrl?: string;
  position?: string;
}

export type ClientStatus = "AKTIF" | "SUSPEND" | "NONAKTIF";

export interface Client {
  id: string;
  code: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  picName: string;
  status: ClientStatus;
  projectCount: number;
  employeeCount: number;
  kasbonIntegration: boolean;
  createdAt: string;
  brandColor?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  address: string;
  latitude: number;
  longitude: number;
  attendanceRadiusMeters: number;
  employeeCount: number;
  isHeadquarters: boolean;
  isActive: boolean;
}

export type SalaryCycle = "SIKLUS_A" | "SIKLUS_B" | "SIKLUS_C" | "SIKLUS_D";
export type EmployeeStatus = "TETAP" | "KONTRAK" | "PROBATION" | "RESIGN";

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  basicSalary: number;
  fixedAllowance: number;
  mealAllowance: number;
  transportAllowance: number;
  salaryCycle: SalaryCycle;
  joinDate: string;
  bankName: string;
  bankAccount: string;
  eWallet?: string;
  status: EmployeeStatus;
  avatar?: string;
}

export type AttendanceStatus =
  | "HADIR"
  | "TELAT"
  | "ALPHA"
  | "CUTI"
  | "IZIN"
  | "DINAS"
  | "LIBUR";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  projectId: string;
  projectName: string;
  clientId: string;
  date: string;               // YYYY-MM-DD
  checkInTime?: string;       // HH:mm:ss
  checkOutTime?: string;      // HH:mm:ss
  status: AttendanceStatus;
  lateMinutes: number;
  gpsValid: boolean;
  gpsAccuracyMeters: number;
  ipValid: boolean;
  ipAddress: string;
  photoVerified: boolean;
  photoUrl?: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
}

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveType = "TAHUNAN" | "SAKIT" | "MELAHIRKAN" | "PENTING" | "IZIN_KHUSUS";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  clientId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  rejectionReason?: string;
  appliedDate: string;
  approvedOrRejectedDate?: string;
  approvedOrRejectedBy?: string;
}

export interface EmployeeLeaveBalance {
  employeeId: string;
  annualQuota: number;
  usedDays: number;
  remainingDays: number;
}

export type PayrollStatus = "DRAFT" | "REVIEW" | "LOCKED" | "PAID";

export interface PayrollPeriod {
  id: string;
  clientId: string;
  clientName: string;
  periodName: string;        // contoh: "Maret 2026"
  periodCode: string;        // contoh: "2026-03"
  salaryCycle: SalaryCycle;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: PayrollStatus;
  createdAt: string;
  lockedAt?: string;
  paidAt?: string;
}

export interface PayrollItem {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  position: string;
  basicSalary: number;
  fixedAllowance: number;
  mealAllowance: number;
  transportAllowance: number;
  overtimePay: number;
  alphaDeduction: number;
  kasbonDeduction: number;
  otherDeductions: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
}

export type KasbonStatus = "SUKSES" | "SETTLED" | "BELUM_SETTLED" | "SELISIH";

export interface KasbonTransaction {
  id: string;
  gajikuTxId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  clientId: string;
  periodCode: string;
  amount: number;
  adminFee: number;
  totalDeduction: number;
  status: KasbonStatus;
  settlementStatus: string;
  settlementDate?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  clientId?: string;
  clientName?: string;
  module: string;
  action: string;
  description: string;
  status: "SUCCESS" | "WARNING" | "FAILURE";
  ipAddress: string;
}

export interface MouConfig {
  clientId: string;
  modules: {
    attendance: boolean;
    leave: boolean;
    payroll: boolean;
    gajikuKasbon: boolean;
  };
  workRules: {
    startTime: string;      // 08:30
    endTime: string;        // 17:30
    gracePeriodMinutes: number; // 15
    workDaysPerWeek: number;    // 5
    offDays: string[];          // ["Sabtu", "Minggu"]
  };
  attendanceValidation: {
    requireSelfie: boolean;
    requireGps: boolean;
    requireOfficeIp: boolean;
    validationCombo: "GPS_ONLY" | "IP_ONLY" | "GPS_OR_IP" | "GPS_AND_IP";
    gpsRadiusMeters: number;
    maxGpsAccuracyMeters: number;
  };
  leaveRules: {
    annualQuota: number;
    allowBeforeProbation: boolean;
    allowNegativeBalance: boolean;
    singleLevelApproval: boolean;
  };
  payrollRules: {
    activeCycles: SalaryCycle[];
    fixedAllowance: boolean;
    mealAllowance: boolean;
    transportAllowance: boolean;
    overtimeMultiplier: number;
    alphaDeductionPerDay: number;
  };
}
