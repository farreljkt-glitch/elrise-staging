import { User } from "../types";

export const DEMO_USERS: Record<string, User> = {
  superadmin: {
    id: "usr-superadmin",
    name: "Alex Pratama (Superadmin)",
    email: "superadmin@example.com",
    role: "SUPERADMIN",
    position: "Chief Technology & Operations Officer",
  },
  admin: {
    id: "usr-admin-sms",
    name: "Dewi Sartika (HR Admin)",
    email: "admin@example.com",
    role: "ADMIN",
    clientId: "client-1",
    clientName: "PT Sumber Makmur Sejahtera",
    position: "Human Resources Lead",
  },
  pegawai: {
    id: "usr-emp-1",
    name: "Budi Santoso",
    email: "pegawai@example.com",
    role: "PEGAWAI",
    clientId: "client-1",
    clientName: "PT Sumber Makmur Sejahtera",
    employeeId: "emp-1",
    position: "Senior Production Supervisor",
  },
};

export const MOCK_ADMIN_LIST: User[] = [
  {
    id: "usr-admin-sms",
    name: "Dewi Sartika",
    email: "admin@example.com",
    role: "ADMIN",
    clientId: "client-1",
    clientName: "PT Sumber Makmur Sejahtera",
    position: "HR Lead",
  },
  {
    id: "usr-admin-dnj",
    name: "Rizky Firmansyah",
    email: "admin.dnj@example.com",
    role: "ADMIN",
    clientId: "client-2",
    clientName: "PT Digital Niaga Jaya",
    position: "People Operations Manager",
  },
];
