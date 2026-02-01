import Link from "next/link";

type SuccessPageProps = {
  searchParams?: { email?: string };
};

export default function UnsubscribeSuccessPage({ searchParams }: SuccessPageProps) {
  const email = searchParams?.email ?? "";
  return (
    <main style={{ background: "#f8f9fa", minHeight: "100vh", padding: "48px 16px" }}>
      <section
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "32px 28px",
          color: "#212529",
          fontFamily:
            "var(--font-figtree), system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: 26 }}>You’re all set</h1>
        <p style={{ margin: "0 0 20px", color: "#6c757d", lineHeight: 1.5 }}>
          {email
            ? `We’ve removed ${email} from Ticket Wiz weekly deals and alerts.`
            : "We’ve removed you from Ticket Wiz weekly deals and alerts."}
        </p>
        <Link href="/" style={{ color: "#007bff", textDecoration: "none" }}>
          Return to Ticket Wiz
        </Link>
      </section>
    </main>
  );
}
