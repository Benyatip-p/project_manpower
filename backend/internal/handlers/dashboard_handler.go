package handlers

import (
    "net/http"

    "mantest/backend/internal/database"
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

    // A) totals
    err := database.DB.QueryRow(`
        SELECT
          COUNT(*)                                              AS requests,
          COUNT(*) FILTER (WHERE overall_status='IN_PROGRESS')  AS pending,
          COUNT(*) FILTER (WHERE overall_status='APPROVED')     AS approved,
          COUNT(*) FILTER (WHERE overall_status='REJECTED')     AS rejected
        FROM manpower_requests;
    `).Scan(&resp.Totals.Requests, &resp.Totals.Pending, &resp.Totals.Approved, &resp.Totals.Rejected)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error":"totals query failed"})
        return
    }

    // B) pie
    err = database.DB.QueryRow(`
        SELECT
          COUNT(*) FILTER (WHERE overall_status='APPROVED')    AS approved,
          COUNT(*) FILTER (WHERE overall_status='IN_PROGRESS') AS waiting
        FROM manpower_requests;
    `).Scan(&resp.ApprovalPie.Approved, &resp.ApprovalPie.Waiting)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error":"pie query failed"})
        return
    }

    // C) per department
    rows, err := database.DB.Query(`
        WITH hires AS (
          SELECT requesting_dept_id AS dept_id, COALESCE(SUM(num_required),0) AS new_hires
          FROM manpower_requests
          WHERE overall_status='APPROVED'
          GROUP BY requesting_dept_id
        ),
        resigns AS (
          SELECT dept_id, COUNT(*)::int AS resigns
          FROM employee_resignations
          GROUP BY dept_id
        )
        SELECT d.dept_id, d.dept_name,
               COALESCE(h.new_hires,0) AS new_hires,
               COALESCE(r.resigns,0)   AS resigns
        FROM departments d
        LEFT JOIN hires   h ON h.dept_id = d.dept_id
        LEFT JOIN resigns r ON r.dept_id = d.dept_id
        ORDER BY d.dept_id;
    `)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error":"dept series query failed"})
        return
    }
    defer rows.Close()

    list := make([]models.DeptSeries, 0)
    for rows.Next() {
        var d models.DeptSeries
        if err := rows.Scan(&d.DeptID, &d.DeptName, &d.NewHires, &d.Resigns); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error":"scan error"})
            return
        }
        list = append(list, d)
    }
    resp.PerDepartment = list

    c.JSON(http.StatusOK, resp)
}

// GetDashboardOverview จัดการคำขอเพื่อดึงข้อมูลสรุปสำหรับแดชบอร์ด