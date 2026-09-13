import { createFileRoute } from "@tanstack/react-router";
import { ProductEditor } from "@/components/admin/product-editor";

export const Route = createFileRoute("/_authenticated/admin/products/new")({ component: () => <ProductEditor /> });
