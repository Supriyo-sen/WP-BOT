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
const twilioNumber = "whatsapp:+14155238886"; // Twilio Sandbox Number
const client = new twilio(accountSid, authToken);

// Load Excel Data
const workbook = XLSX.readFile("data.xlsx");
const sheet_name = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name]);

// Function to Search Data in Excel
const searchExcel = (query) => {
  console.log(query);
  const result = data.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(query.toLowerCase())
    )
  );
  return result.length
    ? JSON.stringify(result, null, 2)
    : "No matching data found.";
};

// WhatsApp Webhook
app.post("/whatsapp", async (req, res) => {
  const messageBody = req.body.Body.trim();
  const sender = req.body.From;

  console.log(`Received: ${messageBody} from ${sender}`);

  let responseText = searchExcel(messageBody);

  console.log(`Responding with: ${responseText}`);
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
