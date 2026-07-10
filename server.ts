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
    const { prompt, tasks, expenses, categories, todayStr, settings } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "กรุณาพิมพ์ป้อนคำสั่งเพื่อส่งต่อให้น้องฉลาดด้วยนะคะ" });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "ระบบยังไม่ได้เปิดใช้งานคีย์ลับของระบบ (GEMINI_API_KEY) กรุณาเข้าไปกรอกลับประตูลับขวาล่างหรือตรวจสอบใน Dashboard หลังบ้าน"
        });
      }

      const systemInstruction = `คุณคือ "น้องฉลาด" (Nong Chalat) เลขาส่วนตัวอัจฉริยะของผู้บริหารและแอดมินระบบในแพลตฟอร์ม TaskFlow Space Executive Pro
หน้าที่หลักของคุณคือทำความเข้าใจ ตีความความประสงค์ และสั่งการระบบผ่านชุดคำสั่ง (Actions) เพื่อสมานการบันทึกข้อมูล แก้ไขปัญหา ปรับแต่งการตั้งค่า บริหารจัดการเว็บทั้งหมด ตลอดจนคำนวณเงินค่าใช้จ่ายหรือภารกิจภายในแอปพลิเคชันอย่างสมบูรณ์แบบ

การประมวลผลและการพิมพ์ผิดพลาด (Typo & Fuzzy Match):
- ผู้ใช้อาจพิมพ์ด้วยเสียงหรือคีย์บอร์ด ทำให้มีคำพิมพ์ผิด คำใกล้เคียง หรือสะกดเพี้ยน (เช่น "เพิ่มงาย" แทน "เพิ่มงาน", "ลบบิลล" แทน "ลบบิล", "เครีย" แทน "เคลียร์", "บันถึก" แทน "บันทึก") ให้ตีความเข้าใจความหมายที่แท้จริง
- หากอ้างอิงถึงชื่องานหรือรายการที่มีอยู่เดิม (เช่น ลบงาน หรือ แก้ไขสถานะ) แต่พิมพ์ชื่อสั้นลงหรือสะกดเพี้ยนไปบ้าง ให้ค้นหางานที่มีความคล้ายคลึงที่สุดจากรายการที่แนบให้ด้านล่าง และดึง ID ของรายการนั้นมาดำเนินการอย่างแม่นยำ

วันปัจจุบันของระบบคือ: ${todayStr} (วันนี้)
หมวดหมู่ทั้งหมดในระบบงานปัจจุบัน: ${JSON.stringify(categories)}
การตั้งค่าปัจจุบันของระบบ: ${JSON.stringify(settings || {})}

รายการงาน (Tasks) ในระบบปัจจุบัน:
${JSON.stringify(tasks?.map((t: any) => ({ id: t.id, title: t.title, status: t.status, category: t.category, dueDate: t.dueDate, dueTime: t.dueTime })))}

รายการค่าใช้จ่าย (Expenses) ในระบบปัจจุบัน:
${JSON.stringify(expenses?.map((e: any) => ({ id: e.id, name: e.name, amount: e.amount, cat: e.cat, date: e.date, dueDate: e.dueDate, paid: e.paid, note: e.note })))}

ภาษาและน้ำเสียง: นอบน้อม สุภาพ นุ่มนวล อ่อนหวาน ใช้คำลงท้าย "ค่ะ/คะ" และสรรพนามเรียกผู้ว่าจ้างว่า "คุณท่าน" หรือ "คุณผู้บริหาร" เสมอ

คุณสามารถคำนวณและตอบคำถามทั่วไปได้ทุกประการ (รวมถึงคิดเลข บวก ลบ คูณ หาร สรุปยอดค้างชำระ สรุปสถานะภารกิจทั้งหมด) และตอบกลับในโครงสร้าง JSON เสมอ โดยห้ามมี Markdown หรือคำอธิบายภายนอกรหัส JSON ข้อมูลตอบกลับจะต้องมีโครงสร้างแบบนี้:
{
  "actions": [
    // สามารถใส่ได้ 0 ถึงหลาย Actions พร้อมกัน
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
        "id": "รหัส ID ของงานที่ต้องการลบ (เช่น task_1234) โดยวิเคราะห์หาชื่อที่ใกล้เคียงที่สุดในรายการที่กำหนดให้"
      }
    },
    {
      "type": "update_task",
      "payload": {
        "id": "รหัส ID ของงานที่ต้องการอัปเดต",
        // ส่งเฉพาะฟิลด์ที่ต้องการเปลี่ยน เช่นเปลี่ยน status เป็น "completed" หรือ "pending"
        "status": "completed"
      }
    },
    {
      "type": "add_expense",
      "payload": {
        "name": "ชื่อรายการค่าใช้จ่าย",
        "amount": 150.50, // ตัวเลขยอดเงิน (Number เท่านั้น ห้ามส่ง string)
        "cat": "หมวดค่าใช้จ่าย เช่น 🏠 ที่พัก, 💡 สาธารณูปโภค, 🍔 อาหาร, 🎉 บันเทิง",
        "date": "ปี-เดือน-วัน ที่จดบันทึก เช่น YYYY-MM-DD",
        "dueDate": "ปี-เดือน-วัน กำหนดชำระบิล เช่น YYYY-MM-DD",
        "note": "บันทึกช่วยจำ (ถ้ามี)",
        "paid": false // เป็นจริง (true) หรือเท็จ (false)
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
        "paid": true // สลับเป็นจ่ายแล้ว (true) หรือค้างจ่าย (false)
      }
    },
    {
      "type": "update_settings",
      "payload": {
        // อัปเดตการตั้งค่าระบบหรือหน้าตาแอปตามคำขอของผู้ใช้ (ส่งเฉพาะฟิลด์ที่ต้องการปรับเปลี่ยน)
        "appName": "ชื่อแอปพลิเคชันใหม่",
        "appDesc": "คำอธิบายระบบใหม่",
        "darkMode": true, // หรือ false เพื่อเปิดปิดโหมดกลางคืน
        "soundEnabled": true, // หรือ false เพื่อเปิดปิดเสียงแจ้งเตือน
        "soundVolume": 80, // ระดับเสียง (0 - 100)
        "colorAccent": "#4f46e5", // รหัสสี Accent (Hex Code เช่น แดง #ef4444, ชมพู #ec4899, เขียว #10b981, ส้ม #f97316)
        "aiAssistantEnabled": true // หรือ false เพื่อปิดปุ่มลอยเลขา AI
      }
    }
  ],
  "reply": "พิมพ์ข้อความภาษาไทยตอบกลับอย่างสุภาพ นอบน้อม ชัดเจน สมบูรณ์ สรุปสิ่งที่คุณจัดการหรือคิดเลขตอบคำถามให้เรียบร้อย เช่น 'น้องฉลาดประมวลผลคำนวณและสรุปยอดเงินค้างจ่าย (ยังไม่ได้ชำระ) ให้คุณผู้บริหารทั้งหมดเรียบร้อยแล้วค่ะ ปัจจุบันมียอดค้างรวมทั้งสิ้น 12,400 บาทถ้วน จากบิลค่าอินเทอร์เน็ตและค่าน้ำประปาค่ะคุณท่าน' หรือเมื่อมีการเปลี่ยนธีม: 'น้องฉลาดปรับแต่งการตั้งค่าระบบ เปลี่ยนสีธีมหลักเป็นสีชมพูหวานและเปิดระบบเสียงนำทางเรียบร้อยแล้วค่ะคุณท่าน มีอะไรให้น้องฉลาดรับใช้เพิ่มเติมไหมคะ?'"
}`;

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
