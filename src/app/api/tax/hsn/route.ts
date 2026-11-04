import { NextResponse } from "next/server";
import { HSN_TAX_DIRECTORY, lookupHsn, suggestGstRateForHsn } from "@/lib/tax-hsn-directory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") || searchParams.get("q");
  const price = parseFloat(searchParams.get("price") || "0");

  if (code) {
    const suggestion = suggestGstRateForHsn(code, price);
    return NextResponse.json({
      hsnCode: code,
      ratePercent: suggestion.ratePercent,
      classification: suggestion.record,
      ruleExplanation: suggestion.ruleExplanation,
    });
  }

  return NextResponse.json({
    directoryCount: HSN_TAX_DIRECTORY.length,
    hsnRecords: HSN_TAX_DIRECTORY,
  });
}
