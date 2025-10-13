export function chipOrigin(origin) {
  switch (origin) {
    case "MGR_APPROVED":
    case "DIR_APPROVED":
      return "อนุมัติ";
    case "MGR_REJECTED":
    case "DIR_REJECTED":
      return "ไม่อนุมัติ";
    case "SUBMITTED":
      return "รอผู้จัดการ";
    case "RETURNED":
      return "ส่งกลับแก้ไข";
    default:
      return "รอดำเนินการ";
  }
}

export function chipHR(hr) {
  switch (hr) {
    case "WAITING_RECRUITER":
      return { text: "รอ Recruiter", tone: "orange" };
    case "WAITING_HR_MANAGER":
      return { text: "รอ HR Manager", tone: "orange" };
    case "WAITING_HR_DIRECTOR":
      return { text: "รอ HR Director", tone: "orange" };
    case "HR_MANAGER_APPROVED":
    case "HR_DIRECTOR_APPROVED":
      return { text: "อนุมัติ", tone: "green" };
    case "RECRUITER_REJECTED":
    case "HR_MANAGER_REJECTED":
    case "HR_DIRECTOR_REJECTED":
      return { text: "ไม่อนุมัติ", tone: "red" };
    case "NONE":
    case "HR_INTAKE":
      return { text: "รอดำเนินการ", tone: "orange" };
    default:
      return { text: "รอดำเนินการ", tone: "orange" };
  }
}

export function chipOverall(overall) {
  switch (overall) {
    case "APPROVED":
      return { text: "-", tone: "green" };
    case "REJECTED":
      return { text: "-", tone: "red" };
    default:
      return { text: "-", tone: "gray" };
  }
}
