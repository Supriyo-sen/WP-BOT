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
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const searchExcelWithAI = async (query) => {
  if (!query) return "Please provide a valid question.";

  const excelData = JSON.stringify(data, null, 2); // Convert Excel data to JSON
  const prompt = `
    You are an AI assistant helping users with data retrieval.
    Here is the database (Excel data converted to JSON):
    ${excelData}
    
    The user asked: "${query}".
    Search this dataset and respond meaningfully.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
    });

    return (
      completion.choices[0]?.message?.content ||
      "I couldn't find an exact match."
    );
  } catch (error) {
    console.error("Error with OpenAI:", error);
    return "There was an error processing your request.";
  }
};

// WhatsApp Webhook
app.post("/whatsapp", async (req, res) => {
  const messageBody = req.body.Body.trim();
  const sender = req.body.From;

  console.log(`Received: ${messageBody} from ${sender}`);

  let responseText = await searchExcelWithAI(messageBody); // Use AI-powered search

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
