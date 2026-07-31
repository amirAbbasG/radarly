import type { Tool } from "@/lib/tools-data";

export function buildDigest(
  tools: Tool[],
  unsubToken: string,
  baseUrl: string,
): string {
  const rows = tools
    .map((t, i) => {
      const url = `${baseUrl}/tools/${encodeURIComponent(t.slug)}`;
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #eee;">
            <div style="font-size:11px;color:#8a8a8a;margin-bottom:2px;">#${i + 1}</div>
            <a href="${url}" style="font-size:16px;font-weight:600;color:#111;text-decoration:none;">${escapeHtml(t.name)}</a>
            <div style="font-size:13px;color:#555;margin-top:2px;">${escapeHtml(t.hook)}</div>
          </td>
        </tr>`;
    })
    .join("");

  const unsubUrl = `${baseUrl}/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#111;color:#fff;">
                <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;">The Sunday Signal</div>
                <h1 style="margin:8px 0 0;font-size:22px;">Trending AI tools this week</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <a href="${unsubUrl}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
