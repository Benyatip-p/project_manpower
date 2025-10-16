package handlers

import (
	"net/http"

	"mantest/backend/internal/database"
	mw "mantest/backend/internal/middlewares"
	"mantest/backend/internal/models"

	"github.com/gin-gonic/gin"
)

type DashboardResponse struct {
	Totals        TotalsSummary `json:"totals"`
	ApprovalPie   PieSummary    `json:"approval_pie"`
	PerDepartment []DeptSeries  `json:"per_department"`
}

type TotalsSummary struct {
	Requests int `json:"requests"`
	Pending  int `json:"pending"`
	Approved int `json:"approved"`
	Rejected int `json:"rejected"`
}

type PieSummary struct {
	Approved int `json:"approved"`
	Waiting  int `json:"waiting"`
}

type DeptSeries struct {
	DeptID   int    `json:"dept_id"`
	DeptName string `json:"dept_name"`
	NewHires int    `json:"new_hires"`
	Resigns  int    `json:"resigns"`
}

// GetDashboardOverview godoc
// @Summary      Dashboard overview
// @Description  สรุปตัวเลขบนแดชบอร์ด: จำนวนคำขอทั้งหมด/รออนุมัติ/อนุมัติ/ไม่อนุมัติ, ข้อมูล pie (approved vs waiting) และสถิติรายฝ่าย (พนักงานเข้าใหม่/ลาออก)
// @Tags         Dashboard
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  models.DashboardResponse
// @Failure      500  {object}  map[string]string
// @Router       /dashboard/overview [get]
func GetDashboardOverview(c *gin.Context) {
	var resp models.DashboardResponse

	// ดึงข้อมูล user จาก context โดยใช้ constant จาก middleware
	deptID := c.GetInt(mw.CtxDeptID)
	posID := c.GetInt(mw.CtxPosID)
	secID := c.GetInt(mw.CtxSectionID)
	role := c.GetString(mw.CtxRoleName)

	// ดึง query parameters สำหรับ filter เดือน/ปี (optional)
	month := c.Query("month") // รูปแบบ "01", "02", ..., "12"
	year := c.Query("year")   // รูปแบบ "2025"

	// ตรวจสอบว่าเป็น HR department หรือไม่
	isHRDept := deptID == 2
	isManager := posID == 1
	isDirector := posID == 8

	// กำหนด WHERE clause สำหรับการ filter
	var whereClause string
	var args []interface{}

	// เรียงลำดับเงื่อนไขให้ตรงกับ request_handler.go
	if isHRDept {
		// HR department (ไม่ว่าจะเป็น Recruiter, HR Manager, HR Director) ให้เห็นทั้งหมด
		whereClause = ""
	} else if role == "Admin" {
		// Admin เห็นทั้งหมด
		whereClause = ""
	} else if isManager || isDirector {
		// Manager/Director ที่ไม่ใช่ HR เห็นเฉพาะ department ของตัวเอง
		whereClause = " WHERE requesting_dept_id = $1"
		args = append(args, deptID)
	} else {
		// User ทั่วไป: ถ้ามี section_id ให้กรอง section ก่อน ไม่งั้นกรองตาม department
		if secID > 0 {
			whereClause = " WHERE requesting_section_id = $1"
			args = append(args, secID)
		} else {
			whereClause = " WHERE requesting_dept_id = $1"
			args = append(args, deptID)
		}
	}

	// A) totals
	totalsQuery := `
        SELECT
          COUNT(*)                                              AS requests,
          COUNT(*) FILTER (WHERE overall_status='IN_PROGRESS')  AS pending,
          COUNT(*) FILTER (WHERE overall_status='APPROVED')     AS approved,
          COUNT(*) FILTER (WHERE overall_status='REJECTED')     AS rejected
        FROM manpower_requests` + whereClause + `;`

	err := database.DB.QueryRow(totalsQuery, args...).Scan(
		&resp.Totals.Requests,
		&resp.Totals.Pending,
		&resp.Totals.Approved,
		&resp.Totals.Rejected,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "totals query failed"})
		return
	}

	// B) pie
	pieQuery := `
        SELECT
          COUNT(*) FILTER (WHERE overall_status='APPROVED')    AS approved,
          COUNT(*) FILTER (WHERE overall_status='IN_PROGRESS') AS waiting
        FROM manpower_requests` + whereClause + `;`

	err = database.DB.QueryRow(pieQuery, args...).Scan(
		&resp.ApprovalPie.Approved,
		&resp.ApprovalPie.Waiting,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "pie query failed"})
		return
	}

	// C) per department
	var deptQuery string
	var deptArgs []interface{}

	// สร้าง date filter สำหรับเดือน/ปี
	var dateFilter string
	if month != "" && year != "" {
		// กรองตามเดือนและปีที่เลือก
		dateFilter = " AND EXTRACT(MONTH FROM resignation_date) = " + month +
			" AND EXTRACT(YEAR FROM resignation_date) = " + year
	} else if year != "" {
		// กรองเฉพาะปี
		dateFilter = " AND EXTRACT(YEAR FROM resignation_date) = " + year
	}

	if isHRDept || role == "Admin" {
		// HR department หรือ Admin เห็นทั้งหมด
		deptQuery = `
            WITH hires AS (
              SELECT requesting_dept_id AS dept_id, COALESCE(SUM(num_required),0) AS new_hires
              FROM manpower_requests
              WHERE overall_status='APPROVED'
              GROUP BY requesting_dept_id
            ),
            resigns AS (
              SELECT dept_id, COUNT(*)::int AS resigns
              FROM employee_resignations
              WHERE 1=1` + dateFilter + `
              GROUP BY dept_id
            )
            SELECT d.dept_id, d.dept_name,
                   COALESCE(h.new_hires,0) AS new_hires,
                   COALESCE(r.resigns,0)   AS resigns
            FROM departments d
            LEFT JOIN hires   h ON h.dept_id = d.dept_id
            LEFT JOIN resigns r ON r.dept_id = d.dept_id
            ORDER BY d.dept_id;`
	} else if isManager || isDirector {
		// Manager/Director ที่ไม่ใช่ HR เห็นเฉพาะ department ของตัวเอง
		deptQuery = `
            WITH hires AS (
              SELECT requesting_dept_id AS dept_id, COALESCE(SUM(num_required),0) AS new_hires
              FROM manpower_requests
              WHERE overall_status='APPROVED' AND requesting_dept_id = $1
              GROUP BY requesting_dept_id
            ),
            resigns AS (
              SELECT dept_id, COUNT(*)::int AS resigns
              FROM employee_resignations
              WHERE dept_id = $1` + dateFilter + `
              GROUP BY dept_id
            )
            SELECT d.dept_id, d.dept_name,
                   COALESCE(h.new_hires,0) AS new_hires,
                   COALESCE(r.resigns,0)   AS resigns
            FROM departments d
            LEFT JOIN hires   h ON h.dept_id = d.dept_id
            LEFT JOIN resigns r ON r.dept_id = d.dept_id
            WHERE d.dept_id = $1
            ORDER BY d.dept_id;`
		deptArgs = append(deptArgs, deptID)
	} else {
		// User ทั่วไป: เห็นเฉพาะ department ของตัวเอง (หรือ section ถ้ามี)
		var filterDeptID int
		if secID > 0 {
			// ถ้ามี section ให้หา dept_id จาก section
			filterDeptID = deptID
		} else {
			filterDeptID = deptID
		}

		deptQuery = `
            WITH hires AS (
              SELECT requesting_dept_id AS dept_id, COALESCE(SUM(num_required),0) AS new_hires
              FROM manpower_requests
              WHERE overall_status='APPROVED' AND requesting_dept_id = $1
              GROUP BY requesting_dept_id
            ),
            resigns AS (
              SELECT dept_id, COUNT(*)::int AS resigns
              FROM employee_resignations
              WHERE dept_id = $1` + dateFilter + `
              GROUP BY dept_id
            )
            SELECT d.dept_id, d.dept_name,
                   COALESCE(h.new_hires,0) AS new_hires,
                   COALESCE(r.resigns,0)   AS resigns
            FROM departments d
            LEFT JOIN hires   h ON h.dept_id = d.dept_id
            LEFT JOIN resigns r ON r.dept_id = d.dept_id
            WHERE d.dept_id = $1
            ORDER BY d.dept_id;`
		deptArgs = append(deptArgs, filterDeptID)
	}

	rows, err := database.DB.Query(deptQuery, deptArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "dept series query failed"})
		return
	}
	defer rows.Close()

	list := make([]models.DeptSeries, 0)
	for rows.Next() {
		var d models.DeptSeries
		if err := rows.Scan(&d.DeptID, &d.DeptName, &d.NewHires, &d.Resigns); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "scan error"})
			return
		}
		list = append(list, d)
	}
	resp.PerDepartment = list

	c.JSON(http.StatusOK, resp)
}
