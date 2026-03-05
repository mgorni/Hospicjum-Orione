export async function onRequestPost({ request, env }) {
  // 1) tylko JSON
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return json({ ok: false, error: "bad_content_type" }, 415);

  const bodyText = await request.text();
  if (bodyText.length > 20_000) return json({ ok: false, error: "too_large" }, 413);

  let body;
  try { body = JSON.parse(bodyText); }
  catch { return json({ ok: false, error: "bad_json" }, 400); }

  const { name="", email="", message="", turnstileToken="", website="" } = body;

  // 2) honeypot (udaj sukces, żeby bot nie retry’ował)
  if (website) return json({ ok: true }, 200);

  const cleanName = String(name).trim().slice(0, 80);
  const cleanEmail = String(email).trim().slice(0, 120);
  const cleanMsg = String(message).trim().slice(0, 4000);

  if (!cleanMsg) return json({ ok: false, error: "empty_message" }, 400);
  if (!turnstileToken) return json({ ok: false, error: "missing_turnstile" }, 400);

  // 3) Turnstile siteverify (obowiązkowe)
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", turnstileToken);

  const vr = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const v = await vr.json();
  if (!v.success) return json({ ok: false, error: "bot_suspected" }, 403);

  // 4) MailChannels send
  const subject = `Formularz kontaktowy: ${cleanName || "bez imienia"}`;
  const text = `Imię: ${cleanName}\nEmail: ${cleanEmail}\n\nWiadomość:\n${cleanMsg}\n`;

  const payload = {
    personalizations: [{ to: [{ email: env.TO_EMAIL }] }],
    from: { email: env.FROM_EMAIL, name: "Hospicjum – formularz" },
    reply_to: cleanEmail ? { email: cleanEmail } : undefined,
    subject,
    content: [{ type: "text/plain", value: text }],
  };

  const mc = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // MailChannels Email API: klucz idzie w X-Api-Key
      "X-Api-Key": env.MAILCHANNELS_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!mc.ok) {
    const err = await mc.text().catch(() => "");
    return json({ ok: false, error: "mail_failed", detail: err.slice(0, 400) }, 502);
  }

  return json({ ok: true }, 200);
}

function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
