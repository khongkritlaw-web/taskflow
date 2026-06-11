import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send email
  app.post("/api/send-email", async (req, res) => {
    const {
      to,
      subject,
      body,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      smtpSenderName
    } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: "ข้อมูลผู้รับ หัวข้อ หรือเนื้อหาอีเมลไม่ครบถ้วน" });
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลตั้งค่าเซิร์ฟเวอร์ SMTP (Host, User, Password) ให้ครบถ้วนในแถบตั้งค่า" });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: smtpSecure === true || smtpSecure === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false // Let self-signed certificates or standard SMTP transport work reliably
        }
      });

      const fromName = smtpSenderName || "System Auto Mailer";
      const info = await transporter.sendMail({
        from: `"${fromName}" <${smtpUser}>`,
        to: to,
        subject: subject,
        text: body,
      });

      console.log("Email sent successfully: ", info.messageId);
      return res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error("Error sending email via SMTP: ", error);
      return res.status(500).json({ error: error.message || "ล้มเหลวในการเชื่อมต่อหรือส่งอีเมลผ่าน SMTP" });
    }
  });

  // Serve static files in production or delegate to Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
