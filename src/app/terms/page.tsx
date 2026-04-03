export const metadata = {
  title: "Terms of Service | Flow Arts Professional",
};

export default function TermsOfService() {
  return (
    <div style={{ background: "#000", color: "#ccc", minHeight: "100vh", fontFamily: "Inter, sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", lineHeight: 1.8 }}>
        <h1 style={{ color: "#00FF00", fontSize: 28, marginBottom: 8 }}>Flow Arts Professional — Terms of Service</h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 32 }}>Last updated: March 19, 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using Flow Arts Professional (&quot;FlowArts.pro&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Flow Arts Professional is a platform for flow artists to submit videos for distribution across social media platforms including YouTube, Instagram, Facebook, and TikTok. We also provide AI-powered tools for generating sponsor pitches, booking sheets, and press kits.</p>
        </Section>

        <Section title="3. User Content">
          <p><strong>Ownership:</strong> You retain ownership of all videos and content you upload.</p>
          <p><strong>License:</strong> By uploading content, you grant Flow Arts Professional a non-exclusive, royalty-free, worldwide license to host, process, distribute, and display your content on our platforms and social media channels.</p>
          <p><strong>Responsibility:</strong> You represent that you own or have the necessary rights to all content you upload. You are solely responsible for your content and any claims arising from it.</p>
        </Section>

        <Section title="4. Prohibited Content">
          <p>You may not upload content that:</p>
          <ul>
            <li>Infringes on intellectual property rights of others.</li>
            <li>Contains illegal, harmful, or offensive material.</li>
            <li>Violates the terms of the social media platforms we distribute to.</li>
            <li>Contains malware or malicious code.</li>
          </ul>
        </Section>

        <Section title="5. Music and Audio">
          <p>We may add royalty-free background music to your videos for distribution. This music is sourced from licensed libraries (Jamendo) and is cleared for commercial use on all platforms.</p>
        </Section>

        <Section title="6. Social Media Distribution">
          <p>Videos uploaded to Flow Arts Professional may be posted to our official accounts on YouTube, Instagram, Facebook, and TikTok. We will credit you as the featured artist in the caption when your identity is provided or detectable.</p>
        </Section>

        <Section title="7. Payments and Refunds">
          <p>Certain features (AI-generated press kits, sponsor pitches, booking sheets) require payment via Stripe. All sales are final. If you experience a technical issue preventing delivery, contact us for resolution.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>Flow Arts Professional is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to loss of data, revenue, or content.</p>
        </Section>

        <Section title="9. Content Removal">
          <p>We reserve the right to remove any content at our discretion. If you wish to have your content removed from our platforms, contact us and we will make reasonable efforts to remove it.</p>
        </Section>

        <Section title="10. Modifications">
          <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>For questions about these terms, contact us at <a href="mailto:hello@flowarts.pro" style={{ color: "#00FF00" }}>hello@flowarts.pro</a></p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14 }}>{children}</div>
    </section>
  );
}
