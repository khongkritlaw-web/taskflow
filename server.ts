import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function getTomorrowStr(todayStr: string) {
  try {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  } catch (e) {
    return todayStr;
  }
}

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

  // AI Assistant Command route for executing state management operations
  app.post("/api/ai/command", async (req, res) => {
    const { prompt, tasks, expenses, categories, todayStr } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "กรุณาพิมพ์ป้อนคำสั่งเพื่อส่งต่อให้น้องฉลาดด้วยนะคะ" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "ระบบยังไม่ได้เปิดใช้งานคีย์ลับของระบบ (GEMINI_API_KEY) กรุณาเข้าไปกรอกลับประตูลับขวาล่างหรือตรวจสอบใน Dashboard หลังบ้าน"
        });
      }

      const systemInstruction = `คุณคือ "น้องฉลาด" (Nong Chalat) เลขาส่วนตัวอัจฉริยะของผู้บริหารในแพลตฟอร์ม TaskFlow Space Executive Pro
หน้าที่หลักของคุณคือทำความเข้าใจและตีความคำสั่งของผู้ใช้ แล้วแปลงเป็นชุดคำสั่ง (Actions) เพื่อช่วยสมานการบันทึกข้อมูล ปรับแต่ง ลบ ค้นหา และคำนวณเงินค่าใช้จ่ายหรือภารกิจภายในแอปพลิเคชันอย่างเหนือระดับ

ภาษาและน้ำเสียง: นอบน้อม สุภาพ อ่อนหวาน ใช้คำลงท้าย "ค่ะ/คะ" สรรพนามเรียกผู้ว่าจ้างว่า "คุณท่าน" หรือ "คุณผู้บริหาร" เสมอ

วันปัจจุบันของระบบคือ: ${todayStr} (วันนี้)
หมวดหมู่ทั้งหมดในระบบงานและเงินปัจจุบัน: ${JSON.stringify(categories)} (หากสร้างงานหรือบิลใหม่ พยายามจับคู่คีย์หมวดหมู่เหล่านี้ หรือสร้างขึ้นใหม่ให้ตรงตามสมควร)

รายการงาน (Tasks) ในระบบปัจจุบัน:
${JSON.stringify(tasks?.map((t: any) => ({ id: t.id, title: t.title, status: t.status, category: t.category, dueDate: t.dueDate, dueTime: t.dueTime })))}

รายการค่าใช้จ่าย (Expenses) ในระบบปัจจุบัน:
${JSON.stringify(expenses?.map((e: any) => ({ id: e.id, name: e.name, amount: e.amount, cat: e.cat, date: e.date, dueDate: e.dueDate, paid: e.paid, note: e.note })))}

คุณต้องวิเคราะห์ความประสงค์ของผู้ใช้ และตอบกลับเป็นรูปแบบ JSON เสมอ โดยห้ามมี Markdown หรือตัวอักษรภายนอกรหัส JSON ข้อมูลที่ตอบกลับจะต้องเป็นโครงสร้างแบบนี้:
{
  "actions": [
    // สามารถตอบได้ตั้งแต่ 0 ถึงหลายรายการพร้อมกัน
    {
      "type": "add_task",
      "payload": {
        "title": "ชื่อภารกิจ",
        "desc": "คำอธิบายภารกิจ (ถ้ามี)",
        "category": "เลือกหมวดหมู่ที่เหมาะสม เช่น 💼 งานทั่วไป, 🔥 เร่งด่วน",
        "dueDate": "ปี-เดือน-วัน กำหนดส่ง (เช่น YYYY-MM-DD ดึงจากบริบท หรือถ้าบอก 'พรุ่งนี้' ให้ใช้: ${getTomorrowStr(todayStr)} )",
        "dueTime": "เวลาในรูปแบบ HH:MM เช่น 15:00 (ถ้ามี)"
      }
    },
    {
      "type": "delete_task",
      "payload": {
        "id": "รหัส ID ของงานที่ต้องการลบ (เช่น t1) โดยประเมินค่าจากรายการงานภารกิจที่แนบให้ข้างต้น"
      }
    },
    {
      "type": "update_task",
      "payload": {
        "id": "รหัส ID ของงานที่ต้องการอัปเดต",
        // ส่งเฉพาะค่าที่ต้องการเปลี่ยน เช่นสลับสถานะเป็น completed หรือ pending หรือเปลี่ยนรายละเอียด
        "status": "completed"
      }
    },
    {
      "type": "add_expense",
      "payload": {
        "name": "ชื่อรายการค่าใช้จ่าย",
        "amount": 150.50, // ตัวเลขยอดเงิน (Number เท่านั้น)
        "cat": "หมวดค่าใช้จ่าย เช่น 🏠 ที่พัก, 💡 สาธารณูปโภค, 🍔 อาหาร",
        "date": "ปี-เดือน-วัน ที่จดบันทึก เช่น YYYY-MM-DD",
        "dueDate": "ปี-เดือน-วัน กำหนดชำระบิล และรักษาเครดิต เช่น YYYY-MM-DD",
        "note": "บันทึกช่วยจำ (ถ้ามี)",
        "paid": false // เป็นจริง (true) หรือเท็จ (false) หากจ่ายไปแล้วหรือยังค้างจ่าย
      }
    },
    {
      "type": "delete_expense",
      "payload": {
         "id": "รหัส ID บิลค่าใช้จ่ายที่ต้องการลบ"
      }
    },
    {
      "type": "update_expense",
      "payload": {
        "id": "รหัส ID บิลที่ต้องการอัปเดต",
        "paid": true // เช่นสลับเป็นจ่ายแล้ว (true) หรือยังไม่จ่าย (false)
      }
    }
  ],
  "reply": "พิมพ์ข้อความตอบกลับภาษาไทยอย่างเป็นมิตร สุภาพ นอบน้อมยิ่งยวด สรุปกิจกรรมที่คุณทำให้เรียบร้อย เช่น 'น้องฉลาดรับเรื่องและบันทึกบิลด่วนค่าซ่อมท่อประปาจำนวน 1,500 บาท เรียบร้อยแล้วค่ะคุณท่าน' หรือเมื่อไม่มีการกระทำใด เช่น การคำนวณเฉลี่ย: 'จากการสืบค้นและคำนวณให้คุณท่าน ยอดที่ชำระสะสมแล้วรวมทั้งสิ้น 52,000 บาทขาดตัว และมีบิลต้องเคลียร์อีก 3,500 บาทค่ะ'"
}

จงระมัดระวังเป็นพิเศษในการจับคู่ ID จากชื่องานหรือชื่อค่าใช้จ่ายที่ผู้ใช้พิมพ์อ้างอิง หากลบหรือแก้ไข ให้เอา ID ของงานนั้นมาตอบให้ถูกต้อง`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());
      return res.json(parsed);
    } catch (err: any) {
      console.error("Gemini AI error:", err);
      return res.status(500).json({ error: "ไม่สามารถคุยกับน้องฉลาดได้ชั่วคราว: " + (err.message || err) });
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
