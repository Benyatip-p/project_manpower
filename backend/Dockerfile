# ใช้ Node.js เวอร์ชัน 20
FROM node:20-alpine

# ตั้งค่าโฟลเดอร์ทำงาน
WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง Dependencies
RUN npm install

# คัดลอกไฟล์โค้ดที่เหลือทั้งหมด
COPY . .

# เปิดพอร์ตของ Vite Dev Server
EXPOSE 5173

# คำสั่งสำหรับเริ่มการทำงาน (สำคัญมาก)
CMD ["npm", "run", "dev", "--", "--host"]