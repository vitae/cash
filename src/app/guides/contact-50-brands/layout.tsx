import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact 50 Brands",
  description: "The ultimate list of flow arts, LED, festival, and lifestyle brands that sponsor artists with contact details.",
  openGraph: {
    title: "Contact 50 Brands — Flow Arts Professional",
    description: "50 brands that sponsor flow artists with websites, Instagram handles, and contact emails.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
