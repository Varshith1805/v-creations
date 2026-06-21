const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");

const FONT_PATH = path.join(__dirname, "..", "node_modules", "pdfkit", "data", "Helvetica.afm");
const CATALOG_PATH = path.join(__dirname, "..", "..", "catalog.pdf");

function drawCircle(doc, x, y, r) {
  doc.circle(x, y, r).fillOpacity(0.08).fill("#7B1818").fillOpacity(1);
}

async function generateCatalog() {
  const products = await Product.find();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40, layout: "landscape" });
    const stream = fs.createWriteStream(CATALOG_PATH);

    doc.pipe(stream);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    // === Background ===
    doc.rect(0, 0, pageW, pageH).fill("#fef5e7");

    // decorative circles
    drawCircle(doc, 60, 50, 120);
    drawCircle(doc, pageW - 80, 60, 100);
    drawCircle(doc, 100, pageH - 80, 90);
    drawCircle(doc, pageW - 100, pageH - 60, 110);

    // Top ornament line
    doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(6).stroke("#7B1818");
    doc.moveTo(0, pageH).lineTo(pageW, pageH).lineWidth(4).stroke("#DAA520");

    // === Header ===
    doc.fontSize(36).fillColor("#7B1818").text("🪢 V Creations", 60, 50, { align: "center" });
    doc.fontSize(16).fillColor("#DAA520").text("Rakshabandhan Special Collection", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#666").text("Celebrate the bond of brotherhood with our exclusive rakhi collection", { align: "center" });
    doc.moveTo(60, doc.y + 8).lineTo(pageW - 60, doc.y + 8).lineWidth(1).stroke("#DAA520");
    doc.moveDown(1.5);

    const startY = doc.y;

    if (products.length === 0) {
      doc.fontSize(14).fillColor("#999").text("No products available yet. Add products in the admin dashboard.", { align: "center" });
    } else {
      const cols = 3;
      const cardW = (pageW - 120) / cols;
      const cardH = 180;
      const gapX = 20;
      const gapY = 20;

      products.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        if (y + cardH > pageH - 40) {
          doc.addPage({ layout: "landscape" });
          doc.rect(0, 0, pageW, pageH).fill("#fef5e7");
          drawCircle(doc, 60, 50, 100);
          drawCircle(doc, pageW - 80, 60, 90);
          doc.moveTo(0, 0).lineTo(pageW, 0).lineWidth(6).stroke("#7B1818");
          const newY = 40;
          drawCard(doc, x, newY, cardW, cardH, p, col);
        } else {
          drawCard(doc, x, y, cardW, cardH, p, col);
        }
      });
    }

    // === Footer ===
    doc.fontSize(10).fillColor("#999").text("V Creations · Rakshabandhan Collection · Contact: 8143435500", 40, pageH - 30, { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(CATALOG_PATH));
    stream.on("error", reject);
  });
}

function drawCard(doc, x, y, w, h, product, col) {
  // Card background
  doc.roundedRect(x, y, w, h, 8).fillOpacity(1).fill("#ffffff");
  doc.roundedRect(x, y, w, h, 8).lineWidth(1).stroke("#e0d5c5");

  // Accent top line
  doc.rect(x, y, w, 4).fillOpacity(1).fill(col % 2 === 0 ? "#7B1818" : "#DAA520");

  doc.fillOpacity(1);

  // Product name
  doc.fontSize(13).fillColor("#1a1a2e").text(product.name || "Product", x + 12, y + 14, { width: w - 24 });

  // Category 
  if (product.category) {
    doc.fontSize(9).fillColor("#DAA520").text(product.category, x + 12, y + 32, { width: w - 24 });
  }

  // Price
  doc.fontSize(16).fillColor("#7B1818").text(`₹${product.price}`, x + 12, y + 50, { width: w - 24 });

  // Original price + discount
  const orig = Math.round(product.price * 1.3);
  doc.fontSize(10).fillColor("#999").text(`MRP: ₹${orig}`, x + 12, y + 72, { width: w - 24 });

  // Description
  if (product.description) {
    doc.fontSize(9).fillColor("#666").text(product.description, x + 12, y + 90, { width: w - 24, height: 35 });
  }

  // Stock
  const stockColor = product.stock <= 0 ? "#ef4444" : "#007600";
  doc.fontSize(9).fillColor(stockColor).text(
    product.stock <= 0 ? "Out of stock" : `${product.stock} in stock`,
    x + 12, y + h - 22, { width: w - 24 }
  );

  // Offer badge
  if (product.offers && product.offers.length > 0) {
    const offerText = product.offers.map(o => typeof o === "string" ? o : `${o.quantity} for ₹${o.price}`).join(", ");
    doc.fontSize(9).fillColor("#DAA520").text(`🎉 ${offerText}`, x + 12, y + h - 38, { width: w - 24 });
  }
}

module.exports = { generateCatalog, CATALOG_PATH };
