import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../prisma";
import { POST } from "@/app/api/newsletter/route";
import { NextRequest } from "next/server";

describe("Newsletter Subscription API & Audit Consent Engine", () => {
  const testEmail = `subscriber_${Date.now()}@example.com`;

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({
      where: { performedBy: testEmail },
    });
  });

  it("rejects invalid email formats with HTTP 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 1)}`,
      },
      body: JSON.stringify({ email: "invalid-email-address" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("valid email");
  });

  it("successfully subscribes valid patron and logs immutable consent audit record", async () => {
    const req = new NextRequest("http://localhost:3000/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `192.168.10.${Math.floor(Math.random() * 200 + 1)}`,
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const audit = await prisma.auditEvent.findFirst({
      where: {
        action: "NEWSLETTER_SUBSCRIBED",
        performedBy: testEmail,
      },
    });

    expect(audit).not.toBeNull();
    expect(audit?.note).toContain("Studio Dispatch newsletter subscription");
  });
});
