import { NextRequest, NextResponse } from "next/server";

/**
 * High-Capacity Evaluation Bridge
 * Bypasses standard Next.js body limits to support large audio uploads (STT/WASM).
 * Forwards the multipart/form-data stream directly to the AI Judge.
 */
export async function POST(request: NextRequest) {
  // Direct internal Docker network link to the STT Backend
  const backendUrl = "http://backend:8000/evaluate";

  console.log(`[BRIDGE] Forwarding evaluation request to: ${backendUrl}`);

  try {
    const formData = await request.formData();
    
    // Construct a new Request for the backend
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      body: formData,
      // Pass through headers like content-type (Next.js fetch handles boundary automatically for FormData)
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`[BRIDGE] Backend returned error (${backendResponse.status}):`, errorText);
      return NextResponse.json(
        { detail: `Backend Error: ${errorText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[BRIDGE] [CRITICAL] Failure in proxy layer:", err);
    return NextResponse.json(
      { detail: "The evaluation bridge failed to reach the AI Judge." },
      { status: 500 }
    );
  }
}

// Ensure this route doesn't have a static body limit
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minute timeout for Whisper
