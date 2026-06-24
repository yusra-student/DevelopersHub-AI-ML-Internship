import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_API_URL || "https://yusrawaheedyw79-internshiptask3.hf.space";
    const response = await fetch(`${backendUrl}/metrics`, {
      method: "GET",
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: errText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy error in /api/metrics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to communicate with metrics backend." },
      { status: 500 }
    );
  }
}
