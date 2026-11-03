import { redirect } from "next/navigation";

export default function StoresSlugRedirect({ params }: { params: { slug: string } }) {
  redirect(`/store/${params.slug}`);
}
