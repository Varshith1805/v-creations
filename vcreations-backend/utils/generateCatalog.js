const PDFDocument = require("pdfkit");
const https = require("https");
const http = require("http");
const Product = require("../models/Product");

function drawCircle(doc, x, y, r) {
  doc.circle(x, y, r).fillOpacity(0.06).fill("#2874F0").fillOpacity(1);
}

function fetchImage(url) {
  if (!url || typeof url !== "string") return Promise.resolve(null);
  if (!url.startsWith("http")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { timeout: 5000 }, res => {
      if (res.statusCode < 200 || res.statusCode >= 400) {
        res.resume();
        return resolve(null);
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : null));
    }).on("error", () => resolve(null)).on("timeout", function() { this.destroy(); resolve(null); });
  });
}

async function generateCatalog() {
  const products = await Product.find();
  const productImages = await Promise.all(products.map(p => fetchImage(p.image)));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, layout: "landscape" });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    doc.rect(0, 0, pageW, pageH).fill("#f0f4ff");
    drawCircle(doc, 60, 50, 130);
    drawCircle(doc, pageW - 80, 60, 110);
    drawCircle(doc, 100, pageH - 80, 100);
    drawCircle(doc, pageW - 100, pageH - 60, 120);
    doc.rect(8, 8, pageW - 16, pageH - 16).lineWidth(2).stroke("#2874F0");
    doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(8).stroke("#2874F0");
    doc.moveTo(0, pageH).lineTo(pageW, pageH).lineWidth(5).stroke("#2874F0");

    doc.fontSize(34).fillColor("#2874F0").font("Helvetica-Bold").text("V CREATIONS", 60, 55, { align: "center" });
    doc.fontSize(14).fillColor("#FFD814").font("Helvetica").text("Rakshabandhan Special Collection", { align: "center" });
    doc.fontSize(10).fillColor("#888").text("Celebrate the bond of brotherhood with our exclusive rakhi collection", { align: "center" });
    const lineY = doc.y + 6;
    doc.moveTo(80, lineY).lineTo(pageW - 80, lineY).lineWidth(1).stroke("#2874F0");
    doc.moveDown(1.2);

    const startY = doc.y;

    if (products.length === 0) {
      doc.fontSize(14).fillColor("#999").text("No products available yet.", { align: "center" });
    } else {
      const cols = 3;
      const cardW = (pageW - 130) / cols;
      const cardH = 200;
      const gapX = 20;
      const gapY = 20;
      let curX = 45;
      let curY = startY;
      let colCount = 0;

      products.forEach((p, i) => {
        if (curY + cardH > pageH - 35) {
          doc.addPage();
          doc.rect(0, 0, pageW, pageH).fill("#f0f4ff");
          doc.rect(8, 8, pageW - 16, pageH - 16).lineWidth(2).stroke("#2874F0");
          doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(8).stroke("#2874F0");
          drawCircle(doc, 60, 50, 100);
          drawCircle(doc, pageW - 80, 60, 90);
          curX = 45;
          curY = 40;
          colCount = 0;
        }
        drawCard(doc, curX, curY, cardW, cardH, p, productImages[i], colCount);
        colCount++;
        curX += cardW + gapX;
        if (colCount >= cols) {
          curX = 45;
          curY += cardH + gapY;
          colCount = 0;
        }
      });
    }

    doc.fontSize(9).fillColor("#999").text("V Creations  |  Rakshabandhan Collection  |  Contact: 8143435500", 40, pageH - 22, { align: "center" });
    doc.end();
  });
}

function drawCard(doc, x, y, w, h, product, imgBuffer, col) {
  doc.roundedRect(x, y, w, h, 6).fillOpacity(1).fill("#ffffff");
  doc.roundedRect(x, y, w, h, 6).lineWidth(1).stroke("#c0d4f5");
  doc.rect(x, y, w, 4).fillOpacity(1).fill("#2874F0");
  doc.fillOpacity(1);

  const imgX = x + 10;
  const imgY = y + 12;
  const imgW = 85;
  const imgH = 85;

  if (imgBuffer && imgBuffer.length > 200) {
    try {
      doc.rect(imgX, imgY, imgW, imgH).lineWidth(1).stroke("#c0d4f5");
      doc.image(imgBuffer, imgX, imgY, { width: imgW, height: imgH, fit: [imgW, imgH], align: "center", valign: "center" });
    } catch {
      drawImagePlaceholder(doc, imgX, imgY, imgW, imgH, product);
    }
  } else {
    drawImagePlaceholder(doc, imgX, imgY, imgW, imgH, product);
  }

  const textX = imgX + imgW + 10;
  const textW = w - imgW - 32;
  doc.fontSize(12).fillColor("#212121").font("Helvetica-Bold").text(product.name || "Product", textX, y + 14, { width: textW });
  if (product.category) {
    doc.fontSize(8).fillColor("#2874F0").font("Helvetica").text(product.category, textX, y + 32, { width: textW });
  }
  doc.fontSize(15).fillColor("#2874F0").font("Helvetica-Bold").text(`Rs. ${product.price}`, textX, y + 48, { width: textW });
  const orig = Math.round(product.price * 1.3);
  doc.fontSize(9).fillColor("#999").font("Helvetica").text(`MRP: Rs. ${orig}`, textX, y + 68, { width: textW });
  if (product.description) {
    doc.fontSize(8).fillColor("#666").text(product.description, textX, y + 84, { width: textW, height: 28 });
  }
  if (product.offers && product.offers.length > 0) {
    const offerText = product.offers.map(o => typeof o === "string" ? o : `${o.quantity} for Rs. ${o.price}`).join(", ");
    doc.fontSize(8).fillColor("#2874F0").text(`Special: ${offerText}`, x + 10, y + h - 40, { width: w - 20 });
  }
  const stockY = product.offers && product.offers.length > 0 ? y + h - 22 : y + h - 30;
  const stockColor = product.stock <= 0 ? "#ef4444" : "#007600";
  doc.fontSize(8).fillColor(stockColor).text(
    product.stock <= 0 ? "Currently unavailable" : `${product.stock} in stock`,
    x + 10, stockY, { width: w - 20 }
  );
  doc.rect(x, y + h - 2, w, 2).fillOpacity(1).fill("#2874F0");
  doc.fillOpacity(1);
}

function drawImagePlaceholder(doc, x, y, w, h, product) {
  const isGold = (product.name || "").length % 2 === 0;
  const bg = isGold ? "#e3f2fd" : "#f0f4ff";
  const accent = "#2874F0";
  doc.rect(x, y, w, h).fill(bg);
  doc.rect(x, y, w, h).lineWidth(1.5).stroke(accent);
  for (let i = 5; i < w - 5; i += 12) {
    doc.circle(x + i, y + 5, 1.5).fillOpacity(0.4).fill(accent).fillOpacity(1);
    doc.circle(x + i, y + h - 5, 1.5).fillOpacity(0.4).fill(accent).fillOpacity(1);
  }
  for (let i = 5; i < h - 5; i += 12) {
    doc.circle(x + 5, y + i, 1.5).fillOpacity(0.4).fill(accent).fillOpacity(1);
    doc.circle(x + w - 5, y + i, 1.5).fillOpacity(0.4).fill(accent).fillOpacity(1);
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  doc.circle(cx, cy, 22).fillOpacity(0.12).fill(accent).fillOpacity(1);
  doc.circle(cx, cy, 20).lineWidth(1).stroke(accent);
  doc.circle(cx, cy, 6).fillOpacity(0.25).fill(accent).fillOpacity(1);
  for (let a = 0; a < 360; a += 45) {
    const rad = a * Math.PI / 180;
    const r1 = 23;
    const r2 = 30;
    doc.moveTo(cx + r1 * Math.cos(rad), cy + r1 * Math.sin(rad)).lineTo(cx + r2 * Math.cos(rad), cy + r2 * Math.sin(rad)).lineWidth(1).strokeOpacity(0.3).stroke(accent).strokeOpacity(1);
  }
  const initial = (product.name || "R")[0].toUpperCase();
  doc.fontSize(11).fillColor(accent).font("Helvetica-Bold").text(initial, cx - 5, cy - 6, { width: 10, align: "center" });
  doc.fontSize(7).fillColor("#999").font("Helvetica").text("Rakhi", x, y + h - 14, { width: w, align: "center" });
}

module.exports = { generateCatalog };
