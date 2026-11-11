import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { SAGES, getSage } from "@/lib/content";
import type { Relation } from "@/lib/judge";
import { relationText } from "@/lib/relationText";
import { loadGoogleFont } from "@/lib/og-font";
import type { SageId } from "@/lib/types";

const SIZE = { width: 1080, height: 1920 };
const RELATIONS: Relation[] = ["mutual", "unrequited", "unexpected", "none"];

function parseRelation(value: string | null): Relation {
  return (RELATIONS as string[]).includes(value ?? "") ? (value as Relation) : "none";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const typeSage = getSage(typeParam as SageId) ?? SAGES[0];

  const relations = SAGES.map((sage) => ({
    sage,
    relation: parseRelation(searchParams.get(`rel_${sage.id}`)),
  }));

  const title = "성현 판별";
  const relationLines = relations.map(({ sage, relation }) =>
    relationText(relation, sage.name)
  );
  const subsetText = Array.from(
    new Set(
      `${title}${typeSage.hanja}${typeSage.typeName}${typeSage.typeTagline}${relationLines.join("")}`.split(
        ""
      )
    )
  ).join("");
  const fontData = await loadGoogleFont("Noto Serif KR", subsetText);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#f5f0e4",
          fontFamily: "Noto Serif KR",
          padding: "120px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            right: 72,
            width: 72,
            height: 72,
            backgroundColor: "#b23a2e",
            borderRadius: 8,
          }}
        />

        <p style={{ fontSize: 36, color: "#6b6156", margin: 0 }}>{title}</p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 96,
          }}
        >
          <p style={{ fontSize: 220, color: "#2b2724", margin: 0, lineHeight: 1 }}>
            {typeSage.hanja}
          </p>
          <p
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#2b2724",
              margin: 0,
              marginTop: 24,
            }}
          >
            {typeSage.typeName}
          </p>
          <p style={{ fontSize: 40, color: "#6b6156", margin: 0, marginTop: 24 }}>
            {typeSage.typeTagline}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 2,
            backgroundColor: "#ddd4c2",
            marginTop: 120,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            marginTop: 96,
            gap: 56,
          }}
        >
          {relations.map(({ sage }, i) => (
            <div
              key={sage.id}
              style={{ display: "flex", flexDirection: "column", width: "100%" }}
            >
              <p style={{ fontSize: 32, color: "#6b6156", margin: 0 }}>
                {sage.hanja} · {sage.name}
              </p>
              <p
                style={{
                  fontSize: 44,
                  color: "#2b2724",
                  margin: 0,
                  marginTop: 12,
                  lineHeight: 1.4,
                }}
              >
                {relationLines[i]}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [{ name: "Noto Serif KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
