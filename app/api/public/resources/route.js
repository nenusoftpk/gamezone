import { NextResponse } from "next/server";
import PlatformData from "@/lib/models/PlatformData";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const platform = await PlatformData.findOne({ key: "primary" });
    return NextResponse.json({
      resources: platform?.data?.resources || { mobileUrl: "", desktopUrl: "", videos: [] },
    });
  } catch (error) {
    console.error("Public resources read failed:", error?.name || "UnknownError");
    return NextResponse.json({ error: "Public resources are unavailable." }, { status: 503 });
  }
}
