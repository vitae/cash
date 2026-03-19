import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top 100 Flow Artists",
  description: "The most influential flow artists on Instagram. Hoopers, poi spinners, staff spinners, and multi-prop performers to follow and collaborate with.",
  openGraph: {
    title: "Top 100 Flow Artists — Flow Arts Professional",
    description: "The most influential flow artists on Instagram organized by prop specialty.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
