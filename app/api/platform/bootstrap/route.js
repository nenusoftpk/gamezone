import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import PlatformData from "@/lib/models/PlatformData";
import { connectToDatabase } from "@/lib/mongodb";
import { getDemoVideoSource, isSecureWebUrl } from "@/lib/resources";
import { requireSuperadmin } from "@/lib/server-auth";

export const runtime = "nodejs";

const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
const cleanResources = (resources) => ({
  mobileUrl: resources.mobileUrl.trim(),
  desktopUrl: resources.desktopUrl.trim(),
  videos: resources.videos.map((video) => ({ id: video.id, title: video.title.trim(), url: video.url.trim() })),
});

function normalizePlatform(data, accounts) {
  if (!isRecord(data) || !isRecord(data.plans) || !Array.isArray(data.tenants) || !Array.isArray(data.payments)
    || !isRecord(data.resources) || !Array.isArray(data.resources.videos) || !Array.isArray(data.platformAudit)
    || !Array.isArray(accounts)) {
    return { error: "Platform data is incomplete and cannot be migrated." };
  }

  const planNames = Object.keys(data.plans);
  if (!planNames.length || planNames.some((name) => {
    const plan = data.plans[name];
    return !name.trim() || !isRecord(plan) || !Number.isFinite(plan.price) || plan.price <= 0
      || !Number.isInteger(plan.stations) || plan.stations < 1
      || !Number.isInteger(plan.employees) || plan.employees < 0;
  })) return { error: "Platform plans contain invalid values." };
  if (data.tenants.length > 1000 || data.payments.length > 20000 || data.platformAudit.length > 20000) {
    return { error: "Platform data is too large to migrate in one request." };
  }

  const tenants = [];
  const tenantIds = new Set();
  for (const tenant of data.tenants) {
    if (!isRecord(tenant) || !tenant.name?.trim() || !tenant.owner?.trim() || !planNames.includes(tenant.plan)
      || !["Active", "Trial", "Suspended"].includes(tenant.status) || !Number.isFinite(Number(tenant.renewsAt))
      || typeof tenant.on !== "boolean") return { error: "A branch record contains invalid values." };
    const id = String(tenant.id);
    if (!id || tenantIds.has(id)) return { error: "Branch identifiers must be unique." };
    tenantIds.add(id);
    tenants.push({ id, name: tenant.name.trim(), owner: tenant.owner.trim(), plan: tenant.plan, status: tenant.status, renewsAt: Number(tenant.renewsAt), on: tenant.on });
  }

  const payments = [];
  for (const payment of data.payments) {
    if (!isRecord(payment) || !tenantIds.has(String(payment.tenantId)) || !Number.isFinite(payment.amt) || payment.amt <= 0
      || !Number.isFinite(Number(payment.t)) || typeof payment.method !== "string" || !payment.method.trim()
      || typeof payment.ref !== "string") return { error: "A payment record contains invalid values." };
    payments.push({ id: String(payment.id), tenantId: String(payment.tenantId), amt: payment.amt, t: Number(payment.t), method: payment.method.trim(), ref: payment.ref.trim() });
  }

  const resources = data.resources;
  if (typeof resources.mobileUrl !== "string" || typeof resources.desktopUrl !== "string"
    || [resources.mobileUrl, resources.desktopUrl].some((url) => url && !isSecureWebUrl(url.trim()))) {
    return { error: "Download links must be valid HTTPS URLs." };
  }
  if (resources.videos.length > 1000 || resources.videos.some((video) => !isRecord(video)
    || typeof video.id !== "string" || !video.id
    || typeof video.title !== "string" || !video.title.trim() || video.title.trim().length > 100
    || typeof video.url !== "string" || !getDemoVideoSource(video.url.trim()))) {
    return { error: "A demo video contains invalid values." };
  }
  if (data.platformAudit.some((entry) => !Array.isArray(entry) || entry.length < 4
    || entry.slice(0, 3).some((value) => typeof value !== "string") || !Number.isFinite(Number(entry[3])))) {
    return { error: "A platform audit entry contains invalid values." };
  }

  const seenUsernames = new Set();
  const branchAdmins = [];
  for (const account of accounts) {
    if (!isRecord(account) || account.role !== "admin" || !tenantIds.has(String(account.tenantId))
      || typeof account.username !== "string" || !account.username.trim() || account.username.trim().length > 64
      || typeof account.password !== "string" || account.password.length < 8 || typeof account.name !== "string") {
      return { error: "A branch admin account contains invalid values." };
    }
    const username = account.username.trim().toLowerCase();
    if (seenUsernames.has(username)) return { error: "Branch admin usernames must be unique." };
    seenUsernames.add(username);
    branchAdmins.push({
      id: String(account.id || `branch-admin-${account.tenantId}`),
      tenantId: String(account.tenantId),
      username,
      password: account.password,
      name: account.name.trim(),
      active: account.active !== false,
    });
  }

  return {
    data: {
      tenants,
      plans: structuredClone(data.plans),
      payments,
      resources: cleanResources(resources),
      platformAudit: data.platformAudit.map((entry) => [entry[0], entry[1], entry[2], Number(entry[3])]),
      branchAdmins: [],
    },
    branchAdmins: Promise.all(branchAdmins.map(async ({ password, ...account }) => ({
      ...account,
      passwordHash: await bcrypt.hash(password, 12),
    }))),
  };
}

function clientData(data) {
  return {
    ...data,
    branchAdmins: (data.branchAdmins || []).map(({ id, tenantId, username, name, active }) => ({ id, tenantId, username, name, active })),
  };
}

export async function POST(request) {
  const auth = await requireSuperadmin(request);
  if (auth.error) return fail(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid migration data.");
  }
  const normalized = normalizePlatform(body?.data, body?.adminAccounts);
  if (normalized.error) return fail(normalized.error);

  try {
    await connectToDatabase();
    const existing = await PlatformData.findOne({ key: "primary" });
    if (existing) return NextResponse.json({ initialized: true, data: clientData(existing.data) });

    const data = normalized.data;
    data.branchAdmins = await normalized.branchAdmins;
    try {
      const platform = await PlatformData.create({ key: "primary", data });
      return NextResponse.json({ initialized: true, data: clientData(platform.data) }, { status: 201 });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const platform = await PlatformData.findOne({ key: "primary" });
      if (!platform) throw error;
      return NextResponse.json({ initialized: true, data: clientData(platform.data) });
    }
  } catch (error) {
    console.error("Platform bootstrap failed:", error?.name || "UnknownError");
    return fail("Could not initialize platform data in MongoDB.", 503);
  }
}
