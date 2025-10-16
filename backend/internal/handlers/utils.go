package handlers

// mapStatusForRole ฟังก์ชันนี้จะทำการแมปสถานะคำขอตามบทบาทของผู้ใช้
// โดยมีการแปลสถานะเป็นข้อความที่เหมาะสมสำหรับแต่ละบทบาท
// - สำหรับ "Admin" จะเห็นสถานะจริง (เช่น APPROVED, IN_PROGRESS)
// - สำหรับ "Approve" จะเห็นสถานะในรูปแบบที่เข้าใจง่ายขึ้น เช่น "รอ Recruiter พิจารณา"
// - สำหรับผู้ใช้ทั่วไป จะเห็นสถานะในรูปแบบที่เข้าใจง่าย เช่น "แบบร่าง", "ส่งคำขอแล้ว"

func mapStatusForRole(role, origin, hr, management, overall string) string {
	switch role {
	case "Admin":
		return overall // admin เห็นสถานะจริงเลย เช่น APPROVED / IN_PROGRESS

	case "Approve":
		if overall == "WAITING_RECRUITER" {
			return "รอ Recruiter พิจารณา"
		} else if overall == "WAITING_HR_MANAGER" {
			return "รอผู้จัดการ HR อนุมัติ"
		} else if overall == "WAITING_HR_DIRECTOR" {
			return "รอผู้อำนวยการ HR อนุมัติ"
		} else if overall == "WAITING_MANAGEMENT" {
			return "รอฝ่ายบริหารอนุมัติ"
		} else if overall == "APPROVED" {
			return "อนุมัติเรียบร้อยแล้ว"
		} else if overall == "REJECTED" {
			return "ถูกปฏิเสธ"
		}
		return "กำลังดำเนินการ"

	default: // User ทั่วไป
		switch origin {
		case "DRAFT":
			return "แบบร่าง"
		case "SUBMITTED":
			return "ส่งคำขอแล้ว"
		case "MGR_APPROVED":
			return "รอฝ่ายบริหารอนุมัติ"
		case "MGR_REJECTED":
			return "ถูกปฏิเสธโดยฝ่ายบริหาร"
		}
		if overall == "APPROVED" {
			return "อนุมัติเรียบร้อยแล้ว"
		} else if overall == "REJECTED" {
			return "ถูกปฏิเสธ"
		}
		return "กำลังดำเนินการ"
	}
}