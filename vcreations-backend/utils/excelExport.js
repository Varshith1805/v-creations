const ExcelJS = require("exceljs");
const path = require("path");

const EXCEL_PATH = path.join(__dirname, "..", "..", "orders.xlsx");

const COLUMNS = [
  { header: "Order ID", key: "_id", width: 28 },
  { header: "Date", key: "date", width: 20 },
  { header: "Customer Name", key: "customerName", width: 20 },
  { header: "Email", key: "email", width: 28 },
  { header: "Phone", key: "phone", width: 15 },
  { header: "Address", key: "address", width: 30 },
  { header: "Pincode", key: "pincode", width: 10 },
  { header: "Items", key: "items", width: 45 },
  { header: "Total Amount", key: "totalAmount", width: 14 },
  { header: "Status", key: "status", width: 12 },
];

async function appendOrderToExcel(order) {
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  try {
    await workbook.xlsx.readFile(EXCEL_PATH);
    worksheet = workbook.getWorksheet("Orders");
  } catch {
    worksheet = workbook.addWorksheet("Orders");
    worksheet.columns = COLUMNS;
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7B1818" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
  }

  const itemsStr = order.products.map(p => `${p.name} x${p.quantity} (₹${p.price})`).join(", ");

  worksheet.addRow({
    _id: order._id.toString(),
    date: new Date(order.createdAt).toLocaleString("en-IN"),
    customerName: order.customerName,
    email: order.email,
    phone: order.phone || "",
    address: order.address || "",
    pincode: order.pincode || "",
    items: itemsStr,
    totalAmount: `₹${order.totalAmount}`,
    status: order.status,
  });

  await workbook.xlsx.writeFile(EXCEL_PATH);
  console.log("Order appended to Excel:", EXCEL_PATH);
}

module.exports = { appendOrderToExcel };
