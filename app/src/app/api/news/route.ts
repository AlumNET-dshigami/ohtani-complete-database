import { NextResponse } from "next/server";
import { getOhtaniNews } from "@/lib/news-api";

export async function GET() {
  try {
    const articles = await getOhtaniNews();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
