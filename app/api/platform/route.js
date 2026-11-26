import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import PlatformData from "@/lib/models/PlatformData";
import { connectToDatabase } from "@/lib/mongodb";
import { getDemoVideoSource, isSecureWebUrl } from "@/lib/resources";
import { requireSuperadmin } from "@/lib/server-auth";

export const runtime = "nodejs";

const DAY = 86400000;
const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
const clientData = (data) => ({
  ...data,
  branchAdmins: (data.branchAdmins || []).map(({ id, tenantId, username, name, active }) => ({ id, tenantId, username, name, active })),
});

export async function GET(request) {
  const auth = await requireSuperadmin(request);
  if (auth.error) return fail(auth.error, auth.status);
  try {
    await connectToDatabase();
    const platform = await PlatformData.findOne({ key: "primary" });
    if (!platform) return NextResponse.json({ initialized: false });
    return NextResponse.json({ initialized: true, data: clientData(platform.data) });
  } catch (error) {
    console.error("Platform data read failed:", error?.name || "UnknownError");
    return fail("Could not load platform data from MongoDB.", 503);
  }
}

export async function POST(request) {
  const auth = await requireSuperadmin(request);
  if (auth.error) return fail(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid platform update.");
  }
  if (typeof body?.action !== "string" || !isRecord(body.payload)) return fail("Invalid platform update.");

  try {
    await connectToDatabase();
    const platform = await PlatformData.findOne({ key: "primary" });
    if (!platform) return fail("Platform data has not been initialized.", 409);
    const data = platform.data;
    const payload = body.payload;
    const hasPlan = (name) => typeof name === "string" && Object.prototype.hasOwnProperty.call(data.plans, name);
    let action, details;

    if (body.action === "tenant.create") {
      const { name, owner, username, password, plan, days } = payload;
      const cleanName = typeof name === "string" ? name.trim() : "";
      const cleanOwner = typeof owner === "string" ? owner.trim() : "";
      const cleanUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
      if (!cleanName || !cleanOwner || !cleanUsername || cleanUsername.length > 64 || typeof password !== "string" || password.length < 8
        || !hasPlan(plan) || !Number.isInteger(Number(days)) || Number(days) < 0 || Number(days) > 3650) {
        return fail("Enter a valid branch name, owner, admin account, plan, and trial length.");
      }
      if (data.tenants.some((tenant) => tenant.name.toLowerCase() === cleanName.toLowerCase())
        || data.branchAdmins.some((account) => account.username === cleanUsername)) {
        return fail("That branch name or admin username is already in use.", 409);
      }
      const id = randomUUID();
      data.tenants.push({ id, name: cleanName, owner: cleanOwner, plan, status: "Trial", renewsAt: Date.now() + Number(days) * DAY, on: true });
      data.branchAdmins.push({
        id: randomUUID(), tenantId: id, username: cleanUsername,
        passwordHash: await bcrypt.hash(password, 12), name: cleanOwner, active: true,
      });
      action = "Branch created";
      details = `${cleanName} · ${plan} · ${days}-day trial`;
    } else if (body.action === "tenant.toggle") {
      const tenant = data.tenants.find((item) => item.id === String(payload.tenantId));
      if (!tenant) return fail("That branch no longer exists.", 404);
      tenant.on = !tenant.on;
      tenant.status = tenant.on ? "Active" : "Suspended";
      action = tenant.on ? "Branch reactivated" : "Branch suspended";
      details = tenant.name;
    } else if (body.action === "tenant.plan") {
      const tenant = data.tenants.find((item) => item.id === String(payload.tenantId));
      if (!tenant || !hasPlan(payload.plan)) return fail("Choose a valid branch and plan.");
      tenant.plan = payload.plan;
      action = "Plan changed";
      details = `${tenant.name} → ${payload.plan}`;
    } else if (body.action === "tenant.adminPassword") {
      const tenant = data.tenants.find((item) => item.id === String(payload.tenantId));
      const account = data.branchAdmins.find((item) => item.tenantId === String(payload.tenantId));
      if (!tenant || !account) return fail("The branch admin account could not be found.", 404);
      if (typeof payload.password !== "string" || payload.password.length < 8) return fail("Password must be at least 8 characters.");
      account.passwordHash = await bcrypt.hash(payload.password, 12);
      action = "Branch admin password changed";
      details = tenant.name;
    } else if (body.action === "tenant.delete") {
      const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : "";
      const tenant = data.tenants.find((item) => item.id === tenantId);
      if (!tenant) return fail("That branch no longer exists.", 404);
      data.tenants = data.tenants.filter((item) => item.id !== tenantId);
      data.branchAdmins = data.branchAdmins.filter((account) => account.tenantId !== tenantId);
      data.payments = data.payments.filter((payment) => payment.tenantId !== tenantId);
      action = "Branch deleted";
      details = `${tenant.name} · branch admin and payment history deleted`;
    } else if (body.action === "payment.record") {
      const tenant = data.tenants.find((item) => item.id === String(payload.tenantId));
      const method = typeof payload.method === "string" ? payload.method.trim() : "";
      const ref = typeof payload.ref === "string" ? payload.ref.trim() : "";
      const allowedMethods = ["Bank transfer", "Easypaisa", "JazzCash", "Cash"];
      if (!tenant || !hasPlan(tenant.plan)) return fail("Choose a valid branch.");
      if (!allowedMethods.includes(method) || !ref || ref.length > 200) return fail("Enter a valid payment method and reference.");
      const now = Date.now();
      const amount = data.plans[tenant.plan].price;
      data.payments.unshift({ id: randomUUID(), tenantId: tenant.id, amt: amount, t: now, method, ref });
      tenant.status = "Active";
      tenant.on = true;
      tenant.renewsAt = Math.max(tenant.renewsAt, now) + 30 * DAY;
      action = "Payment recorded";
      details = `${tenant.name} · Rs ${amount.toLocaleString()} (${method})`;
    } else if (body.action === "payment.update") {
      const paymentId = typeof payload.paymentId === "string" ? payload.paymentId : "";
      const payment = data.payments.find((item) => String(item.id) === paymentId);
      const amount = Number(payload.amount);
      const method = typeof payload.method === "string" ? payload.method.trim() : "";
      const ref = typeof payload.ref === "string" ? payload.ref.trim() : "";
      const allowedMethods = ["Bank transfer", "Easypaisa", "JazzCash", "Cash"];
      if (!payment) return fail("That payment record no longer exists.", 404);
      if (!Number.isFinite(amount) || amount <= 0 || !allowedMethods.includes(method) || !ref || ref.length > 200) {
        return fail("Enter a valid payment amount, method, and reference.");
      }
      payment.amt = amount;
      payment.method = method;
      payment.ref = ref;
      const tenantName = data.tenants.find((tenant) => tenant.id === String(payment.tenantId))?.name || "Unknown branch";
      action = "Payment updated";
      details = `${tenantName} · Rs ${amount.toLocaleString()} (${method})`;
    } else if (body.action === "payment.delete") {
      const paymentId = typeof payload.paymentId === "string" ? payload.paymentId : "";
      const index = data.payments.findIndex((item) => String(item.id) === paymentId);
      if (index < 0) return fail("That payment record no longer exists.", 404);
      const [payment] = data.payments.splice(index, 1);
      const tenantName = data.tenants.find((tenant) => tenant.id === String(payment.tenantId))?.name || "Unknown branch";
      action = "Payment deleted";
      details = `${tenantName} · Rs ${payment.amt.toLocaleString()} (${payment.method})`;
    } else if (body.action === "plan.update") {
      const plan = hasPlan(payload.name) ? data.plans[payload.name] : null;
      const patch = payload.patch;
      if (!plan || !isRecord(patch) || !Number.isFinite(patch.price) || patch.price <= 0
        || !Number.isInteger(patch.stations) || patch.stations < 1
        || !Number.isInteger(patch.employees) || patch.employees < 0) return fail("Enter valid plan prices and limits.");
      Object.assign(plan, { price: patch.price, stations: patch.stations, employees: patch.employees });
      action = "Plan updated";
      details = `${payload.name}: Rs ${plan.price}`;
    } else if (body.action === "plan.create") {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      const price = Number(payload.price), stations = Number(payload.stations), employees = Number(payload.employees);
      if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,39}$/.test(name)
        || !Number.isFinite(price) || price <= 0
        || !Number.isInteger(stations) || stations < 1
        || !Number.isInteger(employees) || employees < 0) {
        return fail("Enter a valid plan name, price, and limits.");
      }
      if (Object.keys(data.plans).some((existingName) => existingName.toLowerCase() === name.toLowerCase())) {
        return fail("A plan with that name already exists.", 409);
      }
      data.plans[name] = { price, stations, employees };
      action = "Plan created";
      details = `${name}: Rs ${price.toLocaleString()}`;
    } else if (body.action === "plan.delete") {
      const name = typeof payload.name === "string" ? payload.name : "";
      if (!hasPlan(name)) return fail("That plan no longer exists.", 404);
      const assignedBranches = data.tenants.filter((tenant) => tenant.plan === name).length;
      if (assignedBranches) return fail("Move all branches to another plan before deleting this plan.", 409);
      delete data.plans[name];
      action = "Plan deleted";
      details = name;
    } else if (body.action === "resources.downloads") {
      const { mobileUrl, desktopUrl } = payload;
      if (typeof mobileUrl !== "string" || typeof desktopUrl !== "string"
        || [mobileUrl, desktopUrl].some((url) => url.trim() && !isSecureWebUrl(url.trim()))) {
        return fail("Download links must be valid HTTPS URLs.");
      }
      data.resources.mobileUrl = mobileUrl.trim();
      data.resources.desktopUrl = desktopUrl.trim();
      action = "Download links updated";
      details = "Public app downloads";
    } else if (body.action === "resources.video.save") {
      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      const url = typeof payload.url === "string" ? payload.url.trim() : "";
      if (!title || title.length > 100) return fail("Enter a video title of 1–100 characters.");
      if (!getDemoVideoSource(url)) return fail("Use a secure YouTube, Vimeo, or direct video URL.");
      const video = data.resources.videos.find((item) => item.id === payload.id);
      if (payload.id && !video) return fail("That demo video no longer exists.", 404);
      if (video) Object.assign(video, { title, url });
      else data.resources.videos.unshift({ id: randomUUID(), title, url });
      action = video ? "Demo video updated" : "Demo video added";
      details = title;
    } else if (body.action === "resources.video.delete") {
      const video = data.resources.videos.find((item) => item.id === payload.id);
      if (!video) return fail("That demo video no longer exists.", 404);
      data.resources.videos = data.resources.videos.filter((item) => item.id !== payload.id);
      action = "Demo video removed";
      details = video.title;
    } else {
      return fail("That platform action is not supported.");
    }

    data.platformAudit.unshift([action, "Platform Team", details, Date.now()]);
    platform.markModified("data");
    await platform.save();
    return NextResponse.json({ data: clientData(platform.data) });
  } catch (error) {
    if (error?.name === "VersionError") return fail("Platform data changed in another request. Reload and try again.", 409);
    console.error("Platform data update failed:", error?.name || "UnknownError");
    return fail("Could not save platform changes to MongoDB.", 503);
  }
}
