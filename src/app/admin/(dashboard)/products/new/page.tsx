import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-silver-300 hover:text-ivory"
      >
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <h1 className="mb-8 font-serif text-3xl text-ivory">New product</h1>
      <ProductForm />
    </div>
  );
}
