import { getEmailBaseUrl } from "@/lib/email";

type BrandedEmailParams = {
  contentHtml: string;
  footerNote: string;
  unsubscribeUrl?: string;
};

export function buildBrandedEmailHtml({ contentHtml, footerNote, unsubscribeUrl }: BrandedEmailParams) {
  const baseUrl = getEmailBaseUrl();
  const logoUrl = `${baseUrl}/ticket-wiz-logo.png`;
  const aboutUrl = `${baseUrl}/about`;
  const privacyUrl = `${baseUrl}/privacy`;
  const termsUrl = `${baseUrl}/terms`;
  const contactEmail = "info@ticket-wiz.com";

  return `
    <!doctype html>
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Ticket Wiz</title>
      </head>
      <body style="Margin:0;padding:0;background-color:#f8f9fa;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8f9fa;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <img src="${logoUrl}" alt="Ticket Wiz" style="height:32px;display:block;margin:0 0 8px;" />
                    <div style="color:#6c757d;font-size:14px;">Ticket Wiz • Flight deals finder</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px;color:#212529;font-family:Arial,sans-serif;">
                    ${contentHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6c757d;line-height:1.6;font-family:Arial,sans-serif;">
                    <p style="Margin:0 0 8px;">${footerNote}</p>
                    <p style="Margin:0 0 8px;">
                      <a href="${aboutUrl}" style="color:#007bff;text-decoration:none;">About</a> ·
                      <a href="${privacyUrl}" style="color:#007bff;text-decoration:none;">Privacy</a> ·
                      <a href="${termsUrl}" style="color:#007bff;text-decoration:none;">Terms</a>
                    </p>
                    <p style="Margin:0 0 8px;">
                      Contact: <a href="mailto:${contactEmail}" style="color:#007bff;text-decoration:none;">${contactEmail}</a>
                    </p>
                    ${
                      unsubscribeUrl
                        ? `<p style="Margin:0;"><a href="${unsubscribeUrl}" style="color:#007bff;text-decoration:none;">Unsubscribe</a></p>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
