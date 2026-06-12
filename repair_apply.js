import fs from 'fs';

const filePath = './src/components/AuthScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We search for lines starting with '          </div>' and ending on '        </div>' right before '{/* Content Body */}'
const startIndex = content.indexOf("formType === 'reset' && <Key className=\"w-7 h-7\" />");
if (startIndex !== -1) {
  // Let's find the exact bounding index
  const divCloseIndex = content.indexOf("          </div>", startIndex);
  const contentBodyIndex = content.indexOf("{/* Content Body */}", divCloseIndex);
  
  if (divCloseIndex !== -1 && contentBodyIndex !== -1) {
    const originalBlock = content.substring(divCloseIndex, contentBodyIndex);
    const replacement = `          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {formType === 'login' && 'เข้าสู่ระบบบริหารภารกิจ'}
            {formType === 'register' && 'สมัครบัญชีเครือข่ายใหม่'}
            {formType === 'forgot' && 'ลืมรหัสผ่านหรือเปลี่ยนไอดี?'}
            {formType === 'otp' && 'ตรวจสอบความปลอดภัย OTP'}
            {formType === 'reset' && 'ตั้งค่ารหัสความปลอดภัยเข้าใช้ใหม่'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed dark:text-slate-400">
            {formType === 'login' && 'สแกนตรวจสอบสถิติและซิงค์ข้อมูลลงเซิร์ฟเวอร์แบบ Real-time'}
            {formType === 'register' && 'บันทึกประวัติเพื่อใช้งานหลายอุปกรณ์แบบไร้รอยต่อ'}
            {formType === 'forgot' && 'ค้นหาและซิงค์รหัสของคุณด้วยเลขโทรศัพท์และอีเมลเดิม'}
            {formType === 'otp' && 'กรอกรหัสยืนยัน 6 หลักที่เราจัดส่งทางอีเมลความโปร่งใส'}
            {formType === 'reset' && 'ไอดีผู้ใช้ของคุณถูกกู้คืนแล้ว คุณสามารถตั้งรหัสผ่านใหม่ได้ทันที'}
          </p>
        </div>
        
        `;
    
    content = content.replace(originalBlock, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: AuthScreen.tsx repaired successfully via boundaries!');
  } else {
    console.log('ERROR: Boundaries inside file not detected');
  }
} else {
  console.log('ERROR: Reset identifier line not detected');
}
