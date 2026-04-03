export const metadata = {
  title: "Privacy Policy | Flow Arts Professional",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#000", color: "#ccc", minHeight: "100vh", fontFamily: "Inter, sans-serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", lineHeight: 1.8 }}>
        <h1 style={{ color: "#00FF00", fontSize: 28, marginBottom: 8 }}>Flow Arts Professional — Privacy Policy</h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 32 }}>Last updated: March 19, 2026</p>

        <Section title="1. Information We Collect">
          <p>When you use Flow Arts Professional (&quot;FlowArts.pro&quot;), we may collect:</p>
          <ul>
            <li><strong>Videos you upload</strong> — stored temporarily for processing and distribution to social media platforms.</li>
            <li><strong>Instagram handle</strong> — if provided, used for attribution in video captions.</li>
            <li><strong>Email address</strong> — if provided, used for communication about your submissions.</li>
            <li><strong>Usage data</strong> — anonymous analytics to improve our service (via PostHog).</li>
            <li><strong>IP address</strong> — used for rate limiting to prevent abuse.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>Process and distribute your videos to YouTube, Instagram, Facebook, and TikTok.</li>
            <li>Credit you as the featured artist in video captions.</li>
            <li>Improve the service through anonymous analytics.</li>
            <li>Prevent abuse through rate limiting.</li>
          </ul>
        </Section>

        <Section title="3. Video Content">
          <p>By uploading a video to Flow Arts Professional, you grant us a non-exclusive, worldwide license to:</p>
          <ul>
            <li>Host, process, and transcode your video.</li>
            <li>Publish your video on our social media channels (YouTube, Instagram, Facebook, TikTok).</li>
            <li>Add background music and captions to your video.</li>
          </ul>
          <p>You retain all ownership rights to your original video content.</p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Supabase</strong> — database and file storage</li>
            <li><strong>Vercel</strong> — website hosting</li>
            <li><strong>Railway</strong> — video processing pipeline</li>
            <li><strong>YouTube, Instagram, Facebook, TikTok</strong> — video distribution</li>
            <li><strong>Stripe</strong> — payment processing</li>
            <li><strong>PostHog</strong> — anonymous analytics</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>Uploaded videos are stored for processing and may be retained on our social media channels indefinitely. You may request removal of your content by contacting us.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li>Request access to your personal data.</li>
            <li>Request deletion of your data and uploaded content.</li>
            <li>Opt out of analytics tracking.</li>
          </ul>
        </Section>

        <Section title="7. Contact">
          <p>For privacy inquiries, contact us at <a href="mailto:hello@flowarts.pro" style={{ color: "#00FF00" }}>hello@flowarts.pro</a></p>
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
