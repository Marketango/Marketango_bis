"use strict";

const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CHROME_PATH = process.env.CHROME_PATH || "/usr/bin/chromium";
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || "";

// ── Auth middleware ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (!SERVICE_TOKEN) return next();
  const auth = req.headers["authorization"] || "";
  if (auth !== `Bearer ${SERVICE_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bi-platform-pdf" });
});

// ── PDF generation ────────────────────────────────────────────────────────────
// POST /generate
// Body: { url: string, wait_for?: string, timeout?: number, format?: string }
app.post("/generate", async (req, res) => {
  const {
    url,
    wait_for = ".dashboard-ready",
    timeout = 30000,
    format = "A4",
  } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  // Validate URL is relative or from allowed origin to prevent SSRF
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const allowedHosts = (process.env.ALLOWED_HOSTS || "nextjs").split(",").map((h) => h.trim());
  if (!allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname === "localhost")) {
    return res.status(400).json({ error: "URL not allowed" });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--font-render-hinting=none",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1.5 });

    // Intercept and block non-essential resources in print mode
    await page.setRequestInterception(true);
    page.on("request", (interceptedReq) => {
      const type = interceptedReq.resourceType();
      if (["media", "websocket"].includes(type)) {
        interceptedReq.abort();
      } else {
        interceptedReq.continue();
      }
    });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout,
    });

    // Wait for dashboard content to be ready
    try {
      await page.waitForSelector(wait_for, { timeout: 5000 });
    } catch {
      // Selector not found is non-fatal — proceed with current page state
    }

    // Inject print styles
    await page.addStyleTag({
      content: `
        @media print {
          .print\\:hidden { display: none !important; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .no-print, [data-no-print] { display: none !important; }
      `,
    });

    const pdfBuffer = await page.pdf({
      format,
      printBackground: true,
      margin: { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:8px;color:#9CA3AF;padding:0 12mm;display:flex;justify-content:space-between;">
          <span>BI Platform — Reporte de Rendimiento</span>
          <span></span>
        </div>
      `,
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#9CA3AF;padding:0 12mm;display:flex;justify-content:space-between;">
          <span>Generado el ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=reporte.pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[PDF] Generation error:", err.message);
    res.status(500).json({ error: "PDF generation failed", detail: err.message });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`[PDF Service] Listening on port ${PORT}`);
  console.log(`[PDF Service] Chrome path: ${CHROME_PATH}`);
});
