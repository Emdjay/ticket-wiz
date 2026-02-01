import Link from "next/link";
import { maskEmail, verifyUnsubscribeToken } from "@/lib/unsubscribe";

type UnsubscribePageProps = {
  searchParams?: { token?: string };
};

export default function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const token = searchParams?.token ?? "";
  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
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
          <h1 style={{ margin: "0 0 12px", fontSize: 24 }}>Link expired</h1>
          <p style={{ margin: "0 0 16px", color: "#6c757d" }}>
            This unsubscribe link is invalid or has expired. If you still want to stop
            alerts, contact us at{" "}
            <a href="mailto:info@ticket-wiz.com" style={{ color: "#007bff" }}>
              info@ticket-wiz.com
            </a>
            .
          </p>
          <Link href="/" style={{ color: "#007bff", textDecoration: "none" }}>
            Return to Ticket Wiz
          </Link>
        </section>
      </main>
    );
  }

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
        <h1 style={{ margin: "0 0 12px", fontSize: 26 }}>Confirm unsubscribe</h1>
        <p style={{ margin: "0 0 20px", color: "#6c757d", lineHeight: 1.5 }}>
          You are about to stop receiving Ticket Wiz weekly deals and price alerts for{" "}
          <strong>{maskEmail(payload.email)}</strong>.
        </p>
        <form method="post" action="/api/unsubscribe">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Unsubscribe me
          </button>
        </form>
        <p style={{ margin: "16px 0 0", color: "#6c757d", fontSize: 12 }}>
          Changed your mind?{" "}
          <Link href="/" style={{ color: "#007bff", textDecoration: "none" }}>
            Back to Ticket Wiz
          </Link>
        </p>
      </section>
    </main>
  );
}
