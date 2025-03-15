require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const XLSX = require("xlsx");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Load Twilio Credentials from .env file
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = "whatsapp:+17754149653"; // Twilio Sandbox Number
const client = new twilio(accountSid, authToken);

// Load Excel Data
const workbook = XLSX.readFile("data.xlsx");
const sheet_name = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name]);

console.log("Excel Data Loaded: ", data);

// Function to Search Data in Excel
const searchExcel = (query) => {
  if (!query || !data.length) return "No data available.";

  console.log("Searching for:", query); // ✅ Debug: Check the incoming query

  const result = data.filter((row) =>
    Object.values(row)
      .map((value) => String(value).trim().toLowerCase()) // Trim spaces, lowercase
      .some((value) => value.includes(query.trim().toLowerCase()))
  );

  console.log("Search Result:", result); // ✅ Debug: See if any matches are found

  return result.length
    ? JSON.stringify(result, null, 2)
    : "No matching data found. Try rephrasing.";
};

// WhatsApp Webhook
app.post("/whatsapp", async (req, res) => {
  const messageBody = req.body.Body ? req.body.Body.trim() : "";
  const sender = req.body.From;

  console.log(`Received: "${messageBody}" from ${sender}`); // ✅ Debug: Check incoming messages

  let responseText = searchExcel(messageBody);
  console.log("Response Sent:", responseText); // ✅ Debug: See response before sending

  // Send response back to WhatsApp
  await client.messages.create({
    from: twilioNumber,
    to: sender,
    body: responseText,
  });

  res.sendStatus(200);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
