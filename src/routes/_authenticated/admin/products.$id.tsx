import { createFileRoute } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/product-editor";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({ component: Page });

function Page() {
  const { id } = Route.useParams();
  return <ProductEditor productId={id} />;
}
