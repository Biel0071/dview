import { describe, expect, it } from "vitest";
import { buildApp, deduplicateDeviceList } from "../src/app.js";
import type { Device } from "@droidview/shared";

describe("Device Deduplication System", () => {
  it("deduplicates devices sharing the same phone number", () => {
    const list: Device[] = [
      {
        id: "dev_carlos_offline",
        name: "Carlos Ferreira (Galaxy Note)",
        model: "SM-N975F",
        androidVersion: "7.1.2",
        status: "offline",
        battery: 50,
        networkType: "offline",
        ipAddress: "192.168.1.10",
        lastSeen: new Date(Date.now() - 100000).toISOString(),
        enrolledAt: new Date().toISOString(),
        phoneNumber: "+55 (11) 98765-4321",
        contactName: "Carlos Ferreira",
        apkName: "JADLOG Rastreio"
      },
      {
        id: "emu_carlos_online",
        name: "Carlos Ferreira (Pixel 8)",
        model: "Pixel 8 Pro",
        androidVersion: "14",
        status: "online",
        battery: 95,
        networkType: "wifi",
        ipAddress: "127.0.0.1",
        lastSeen: new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        phoneNumber: "+55 (11) 98765-4321",
        contactName: "Carlos Ferreira",
        apkName: "JADLOG Rastreio"
      }
    ];

    const deduplicated = deduplicateDeviceList(list);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].status).toBe("online");
    expect(deduplicated[0].phoneNumber).toBe("+55 (11) 98765-4321");
    expect(deduplicated[0].contactName).toBe("Carlos Ferreira");
  });

  it("prioritizes online status even if offline record comes second", () => {
    const list: Device[] = [
      {
        id: "dev_online_first",
        name: "Aparelho Online",
        model: "SM-G998B",
        androidVersion: "13",
        status: "online",
        battery: 80,
        networkType: "wifi",
        ipAddress: "192.168.100.5",
        lastSeen: new Date().toISOString(),
        enrolledAt: new Date().toISOString(),
        phoneNumber: "+55 (21) 99999-8888",
        contactName: "Mariana Alcantara"
      },
      {
        id: "dev_offline_second",
        name: "Aparelho Offline Antigo",
        model: "SM-G998B",
        androidVersion: "13",
        status: "offline",
        battery: 10,
        networkType: "offline",
        ipAddress: "192.168.100.99",
        lastSeen: new Date(0).toISOString(),
        enrolledAt: new Date().toISOString(),
        phoneNumber: "+55 (21) 99999-8888",
        contactName: "Mariana Alcantara"
      }
    ];

    const result = deduplicateDeviceList(list);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("online");
    expect(result[0].phoneNumber).toBe("+55 (21) 99999-8888");
  });

  it("deduplicates in GET /devices endpoint so duplicate devices never return", async () => {
    const app = buildApp();
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@dview.local", password: "admin123", totp: "123456" }
    });
    const { token } = JSON.parse(loginRes.body);

    const res = await app.inject({
      method: "GET",
      url: "/devices",
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.statusCode).toBe(200);
    const devicesList: Device[] = JSON.parse(res.body);

    // Verify no two devices in the list share the exact same clean phone number
    const phones = devicesList.map((d) => d.phoneNumber?.replace(/\D/g, "")).filter(Boolean);
    const uniquePhones = new Set(phones);
    expect(phones.length).toBe(uniquePhones.size);
  });
});
