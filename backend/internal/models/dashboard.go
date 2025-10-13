package models

type DashboardTotals struct {
    Requests int `json:"requests"`
    Pending  int `json:"pending"`
    Approved int `json:"approved"`
    Rejected int `json:"rejected"`
}

type DashboardPie struct {
    Approved int `json:"approved"`
    Waiting  int `json:"waiting"`
}

type DeptSeries struct {
    DeptID   int    `json:"dept_id"`
    DeptName string `json:"dept_name"`
    NewHires int    `json:"new_hires"`
    Resigns  int    `json:"resigns"`
}

type DashboardResponse struct {
    Totals        DashboardTotals `json:"totals"`
    ApprovalPie   DashboardPie    `json:"approval_pie"`
    PerDepartment []DeptSeries    `json:"per_department"`
}