import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your Brand Online",
  description: "Grow your flow arts audience on Instagram, TikTok, and YouTube. Content strategy, filming tips, and monetization playbook.",
  openGraph: {
    title: "Build Your Brand Online — Flow Arts Professional",
    description: "Grow your flow arts audience and go viral with this complete social media playbook.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
