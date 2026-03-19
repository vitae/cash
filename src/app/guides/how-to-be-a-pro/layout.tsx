import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How To Be A Flow Arts Professional",
  description: "The complete playbook for turning your flow practice into a sustainable career. From finding local gigs to landing brand deals.",
  openGraph: {
    title: "How To Be A Flow Arts Professional",
    description: "The complete playbook for turning your flow practice into a sustainable career.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
