import { NextResponse } from "next/server";
import { productRepository } from "@/lib/server/product-repository";

interface Params {
  params: {
    slug: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const product = await productRepository.getProductBySlug(params.slug);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found or not published." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error querying product details." },
      { status: 500 }
    );
  }
}
