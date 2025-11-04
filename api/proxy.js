export default async function handler(req, res) {
  const targetUrl = "https://pokeasistente-ia-generative.vercel.app";

  const response = await fetch(targetUrl + req.url, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" ? undefined : req.body,
  });

  const data = await response.text();

  res.status(response.status);
  res.setHeader("Content-Type", response.headers.get("content-type") || "text/plain");
  res.send(data);
}
