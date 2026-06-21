const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const Product = require("../models/Product");

const CATALOG_PATH = path.join(__dirname, "..", "..", "catalog.pdf");

function drawCircle(doc, x, y, r) {
  doc.circle(x, y, r).fillOpacity(0.06).fill("#7B1818").fillOpacity(1);
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
    const stream = fs.createWriteStream(CATALOG_PATH);

    doc.pipe(stream);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    // === Background ===
    doc.rect(0, 0, pageW, pageH).fill("#faf5ef");

    // Decorative circles
    drawCircle(doc, 60, 50, 130);
    drawCircle(doc, pageW - 80, 60, 110);
    drawCircle(doc, 100, pageH - 80, 100);
    drawCircle(doc, pageW - 100, pageH - 60, 120);

    // Border lines
    doc.rect(8, 8, pageW - 16, pageH - 16).lineWidth(2).stroke("#DAA520");
    doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(8).stroke("#7B1818");
    doc.moveTo(0, pageH).lineTo(pageW, pageH).lineWidth(5).stroke("#DAA520");

    // === Header ===
    doc.fontSize(34).fillColor("#7B1818").font("Helvetica-Bold").text("V CREATIONS", 60, 55, { align: "center" });
    doc.fontSize(14).fillColor("#DAA520").font("Helvetica").text("Rakshabandhan Special Collection", { align: "center" });
    doc.fontSize(10).fillColor("#888").text("Celebrate the bond of brotherhood with our exclusive rakhi collection", { align: "center" });
    const lineY = doc.y + 6;
    doc.moveTo(80, lineY).lineTo(pageW - 80, lineY).lineWidth(1).stroke("#DAA520");
    doc.moveDown(1.2);

    const startY = doc.y;

    if (products.length === 0) {
      doc.fontSize(14).fillColor("#999").text("No products available yet. Add products in the admin dashboard.", { align: "center" });
    } else {
      const cols = 3;
      const cardW = (pageW - 130) / cols;
      const cardH = 200;
      const gapX = 20;
      const gapY = 20;

      products.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 45 + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        if (y + cardH > pageH - 35) {
          doc.addPage();
          doc.rect(0, 0, pageW, pageH).fill("#faf5ef");
          doc.rect(8, 8, pageW - 16, pageH - 16).lineWidth(2).stroke("#DAA520");
          doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(8).stroke("#7B1818");
          drawCircle(doc, 60, 50, 100);
          drawCircle(doc, pageW - 80, 60, 90);
          drawCard(doc, x, 40, cardW, cardH, p, productImages[i], col);
        } else {
          drawCard(doc, x, y, cardW, cardH, p, productImages[i], col);
        }
      });
    }

    // === Footer ===
    doc.fontSize(9).fillColor("#999").text("V Creations  |  Rakshabandhan Collection  |  Contact: 8143435500", 40, pageH - 22, { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(CATALOG_PATH));
    stream.on("error", reject);
  });
}

function drawCard(doc, x, y, w, h, product, imgBuffer, col) {
  // Card background
  doc.roundedRect(x, y, w, h, 6).fillOpacity(1).fill("#ffffff");
  doc.roundedRect(x, y, w, h, 6).lineWidth(1).stroke("#e0d5c5");

  // Accent top bar
  doc.rect(x, y, w, 4).fillOpacity(1).fill(col % 2 === 0 ? "#7B1818" : "#DAA520");

  doc.fillOpacity(1);

  // Product image area
  const imgX = x + 10;
  const imgY = y + 12;
  const imgW = 90;
  const imgH = 90;

  doc.rect(imgX, imgY, imgW, imgH).lineWidth(1).stroke("#eee");

  if (imgBuffer && imgBuffer.length > 100) {
    try {
      doc.image(imgBuffer, imgX, imgY, { width: imgW, height: imgH, fit: [imgW, imgH], align: "center", valign: "center" });
    } catch {
      drawPlaceholder(doc, imgX, imgY, imgW, imgH, product.name);
    }
  } else {
    drawPlaceholder(doc, imgX, imgY, imgW, imgH, product.name);
  }

  // Product name (right of image)
  const textX = imgX + imgW + 10;
  const textW = w - imgW - 32;

  doc.fontSize(12).fillColor("#1a1a2e").font("Helvetica-Bold").text(product.name || "Product", textX, y + 14, { width: textW });

  // Category
  if (product.category) {
    doc.fontSize(8).fillColor("#DAA520").font("Helvetica").text(product.category, textX, y + 32, { width: textW });
  }

  // Price
  doc.fontSize(15).fillColor("#7B1818").font("Helvetica-Bold").text(`Rs. ${product.price}`, textX, y + 48, { width: textW });

  // MRP
  const orig = Math.round(product.price * 1.3);
  doc.fontSize(9).fillColor("#999").font("Helvetica").text(`MRP: Rs. ${orig}`, textX, y + 68, { width: textW });

  // Description
  if (product.description) {
    doc.fontSize(8).fillColor("#666").text(product.description, textX, y + 84, { width: textW, height: 28 });
  }

  // Offer badge
  if (product.offers && product.offers.length > 0) {
    const offerText = product.offers.map(o => typeof o === "string" ? o : `${o.quantity} for Rs. ${o.price}`).join(", ");
    doc.fontSize(8).fillColor("#DAA520").text(`Special: ${offerText}`, x + 10, y + h - 40, { width: w - 20 });
  }

  // Stock
  const stockY = product.offers && product.offers.length > 0 ? y + h - 22 : y + h - 30;
  const stockColor = product.stock <= 0 ? "#ef4444" : "#007600";
  doc.fontSize(8).fillColor(stockColor).text(
    product.stock <= 0 ? "Currently unavailable" : `${product.stock} in stock`,
    x + 10, stockY, { width: w - 20 }
  );

  // Bottom accent border
  doc.rect(x, y + h - 2, w, 2).fillOpacity(1).fill(col % 2 === 0 ? "#7B1818" : "#DAA520");
  doc.fillOpacity(1);
}

function drawPlaceholder(doc, x, y, w, h, name) {
  doc.rect(x, y, w, h).fill("#f5f0e8");
  doc.fontSize(9).fillColor("#B8A88A").font("Helvetica").text(name || "Rakhi", x, y + h / 2 - 8, { width: w, align: "center" });
}

module.exports = { generateCatalog, CATALOG_PATH };
