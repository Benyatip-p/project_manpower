# ทดสอบ API แก้ไขและลบผู้ใช้งาน

## ขั้นตอนการแก้ปัญหา:

### 1. Build และ Restart Backend
```powershell
cd d:\Coding\year3\Project\project_manpower\backend
go build -o main ./cmd/api
./main
```

### 2. ทดสอบ API ด้วย PowerShell (หาก Backend ทำงาน)

#### ทดสอบ GET employees (ดูว่ามี employee_id อะไรบ้าง)
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/employees" -Method GET -Headers $headers
```

#### ทดสอบ DELETE employee
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$employeeId = "213312"  # หรือ "E001" ตามที่เห็นในรายการ
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/employees/$employeeId" -Method DELETE -Headers $headers
```

#### ทดสอบ PUT employee
```powershell
$token = "YOUR_JWT_TOKEN_HERE"
$employeeId = "213312"
$body = @{
    firstName = "TestUpdate"
    lastName = "LastUpdate"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/employees/$employeeId" -Method PUT -Headers $headers -Body $body
```

### 3. ตรวจสอบ Console Log
เปิด Browser DevTools (F12) → Console tab
- ดูว่า console.log แสดง employeeId อะไร
- ตรวจสอบว่าเป็น string หรือ number

### 4. ตรวจสอบ Network Tab
DevTools → Network tab
- ดู Request URL ว่าถูกต้องหรือไม่
- ดู Request Method (PUT/DELETE)
- ดู Response Status Code

## สาเหตุที่เป็นไปได้:
1. ✅ Backend ยังไม่ได้ restart หลังเพิ่ม handlers
2. ✅ employee_id ใน database เป็น numeric (213312) แต่ต้องเป็น string
3. ✅ Frontend ส่ง id ผิด (ใช้ index แทน employeeId)
4. ✅ JWT token หมดอายุ
5. ✅ CORS issues

## แก้ไขแล้ว:
- ✅ เปลี่ยน `id: index + 1` เป็น `id: user.employeeId`
- ✅ เพิ่ม console.log เพื่อ debug
- ⏳ รอ restart backend
