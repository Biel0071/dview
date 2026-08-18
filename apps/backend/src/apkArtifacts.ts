import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface EnrollmentPayload {
  serverUrl: string;
  enrollmentToken: string;
  deviceName: string;
  generatedAt: string;
}

export interface AgentArtifact {
  fileName: string;
  contentType: string;
  buffer: Buffer;
  sha256: string;
  kind: "apk" | "enrollment-package";
  note: string;
}

const APK_CANDIDATES = [
  ["artifacts", "android", "DroidView-Agent-debug.apk"],
  ["apps", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"],
  ["..", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"],
  ["..", "..", "apps", "android-agent", "app", "build", "outputs", "apk", "debug", "app-debug.apk"]
];

export function encodeEnrollment(payload: EnrollmentPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeEnrollment(config: string): EnrollmentPayload {
  const decoded = Buffer.from(config, "base64url").toString("utf8");
  const parsed = JSON.parse(decoded) as Partial<EnrollmentPayload>;

  if (!parsed.serverUrl || !parsed.enrollmentToken) {
    throw new Error("Invalid enrollment config");
  }

  return {
    serverUrl: parsed.serverUrl,
    enrollmentToken: parsed.enrollmentToken,
    deviceName: parsed.deviceName ?? "Android Device",
    generatedAt: parsed.generatedAt ?? new Date().toISOString()
  };
}

export async function resolveAgentArtifact(config: string): Promise<AgentArtifact> {
  const enrollment = decodeEnrollment(config);
  const apkPath = findBuiltApk();

  if (apkPath) {
    const apk = await readFile(apkPath);
    return {
      fileName: "DroidView-Agent-debug.apk",
      contentType: "application/vnd.android.package-archive",
      buffer: apk,
      sha256: sha256(apk),
      kind: "apk",
      note: "Real debug APK built from apps/android-agent."
    };
  }

  const buffer = createEnrollmentZip(enrollment);
  return {
    fileName: "DroidView-Agent-enrollment-package.zip",
    contentType: "application/zip",
    buffer,
    sha256: sha256(buffer),
    kind: "enrollment-package",
    note: "Android SDK/Gradle build output not found; this package contains pairing config and build instructions, not an APK."
  };
}

export function findBuiltApk(): string | null {
  for (const parts of APK_CANDIDATES) {
    const candidate = resolve(process.cwd(), join(...parts));
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function createEnrollmentZip(enrollment: EnrollmentPayload) {
  const configJson = JSON.stringify(enrollment, null, 2);
  const readme = [
    "# DroidView Agent enrollment package",
    "",
    "This ZIP is a fallback package, not an APK.",
    "",
    "A real APK is served automatically when this file exists:",
    "artifacts/android/DroidView-Agent-debug.apk",
    "",
    "Development build output is also detected at:",
    "apps/android-agent/app/build/outputs/apk/debug/app-debug.apk",
    "",
    "Build the APK with Android Studio or Gradle:",
    "cd apps/android-agent",
    "gradle assembleDebug",
    "",
    "After installing the APK, open this pairing link on the device:",
    `droidview://enroll?config=${encodeEnrollment(enrollment)}`,
    "",
    "Remote sessions require visible user consent on the Android device."
  ].join("\n");

  return zip([
    { name: "enrollment.json", data: Buffer.from(configJson, "utf8") },
    { name: "README.md", data: Buffer.from(readme, "utf8") }
  ]);
}

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function zip(files: Array<{ name: string; data: Buffer }>) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, file.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + file.data.length;
  }

  const centralStart = offset;
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
