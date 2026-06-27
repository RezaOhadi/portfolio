import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductByIdAdmin } from "@/lib/data/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductByIdAdmin(id);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-silver-300 hover:text-ivory"
      >
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <h1 className="mb-8 font-serif text-3xl text-ivory">Edit · {product.title}</h1>
      <ProductForm product={product} />
    </div>
  );
}
