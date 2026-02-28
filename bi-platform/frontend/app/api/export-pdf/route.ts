import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, dateFrom, dateTo, token } = body;

  if (!slug || !dateFrom || !dateTo || !token) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
    const res = await fetch(
      `${apiUrl}/export/pdf/${slug}?date_from=${dateFrom}&date_to=${dateTo}&token=${token}`,
      {
        method: "GET",
        headers: { Cookie: `bi_client_token=${token}` },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "PDF generation failed" }, { status: res.status });
    }

    const pdf = await res.arrayBuffer();
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="informe-${slug}-${dateFrom}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF service unavailable" }, { status: 503 });
  }
}
