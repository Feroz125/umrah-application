const ALLOWED_ORIGINS = new Set([
  "https://al-muhammadtravels.com",
  "https://www.al-muhammadtravels.com"
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-ID, X-Requested-With, Accept, Origin"
  );
}

function toPath(pathInput) {
  if (Array.isArray(pathInput)) return pathInput.join("/");
  if (typeof pathInput === "string") return pathInput;
  return "";
}

module.exports = async function handler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const backendOrigin = process.env.BACKEND_ORIGIN;
  if (!backendOrigin) {
    return res.status(500).json({
      error: "Missing BACKEND_ORIGIN env var in Vercel project settings"
    });
  }

  const query = new URLSearchParams(req.query || {});
  query.delete("path");
  const queryString = query.toString();

  const path = toPath(req.query?.path);
  const target = `${backendOrigin.replace(/\/$/, "")}/api/${path}${queryString ? `?${queryString}` : ""}`;

  const headers = {};
  const passHeaders = ["authorization", "content-type", "x-tenant-id", "accept"];
  for (const header of passHeaders) {
    if (req.headers[header]) {
      headers[header] = req.headers[header];
    }
  }

  const hasBody = req.method && !["GET", "HEAD"].includes(req.method.toUpperCase());
  let body;
  if (hasBody && req.body !== undefined) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body
    });

    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const payload = await upstream.text();
    return res.status(upstream.status).send(payload);
  } catch (_err) {
    return res.status(502).json({ error: "Failed to reach backend origin" });
  }
};
