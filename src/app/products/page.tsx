import { redirect } from "next/navigation";

export default function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (typeof v === "string") query.set(k, v);
      else if (Array.isArray(v)) v.forEach((val) => query.append(k, val));
    });
  }
  const queryString = query.toString();
  redirect(queryString ? `/catalog?${queryString}` : "/catalog");
}
