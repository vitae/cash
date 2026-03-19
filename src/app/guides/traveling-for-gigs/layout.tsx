import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traveling for Gigs",
  description: "How to build a touring circuit, budget for travel gigs, and make every trip count as a flow arts performer.",
  openGraph: {
    title: "Traveling for Gigs — Flow Arts Professional",
    description: "How to build a touring circuit, budget for travel gigs, and make every trip count.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
