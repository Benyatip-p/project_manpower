-- =========================
-- MASTER DATA
-- =========================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(10) DEFAULT 'Active'
);

CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE positions (
    pos_id SERIAL PRIMARY KEY,
    pos_name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(10) DEFAULT 'Active'
);

CREATE TABLE sections (
    section_id SERIAL PRIMARY KEY,
    section_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE employment_types (
    et_id SERIAL PRIMARY KEY,
    et_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE contract_types (
    ct_id SERIAL PRIMARY KEY,
    ct_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE request_reasons (
    rr_id SERIAL PRIMARY KEY,
    rr_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE genders (
    gender_id SERIAL PRIMARY KEY,
    gender_name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE nationalities (
    nat_id SERIAL PRIMARY KEY,
    nat_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE experiences (
    exp_id SERIAL PRIMARY KEY,
    exp_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE education_levels (
    edu_id SERIAL PRIMARY KEY,
    edu_name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name  VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    profile_image TEXT,
    pos_id INT REFERENCES positions(pos_id),
    dept_id INT REFERENCES departments(dept_id),
    section_id INT REFERENCES sections(section_id),
    role_id INT REFERENCES roles(role_id) NOT NULL,
    status VARCHAR(10) DEFAULT 'Active'
);

CREATE TABLE manpower_requests (
    request_id SERIAL PRIMARY KEY,
    doc_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(employee_id) NOT NULL,
    doc_date DATE NOT NULL DEFAULT CURRENT_DATE,

    requesting_dept_id INT REFERENCES departments(dept_id) NOT NULL,
    requesting_section_id INT REFERENCES sections(section_id),
    requesting_pos_id INT REFERENCES positions(pos_id) NOT NULL,
    employment_type_id INT REFERENCES employment_types(et_id) NOT NULL,
    contract_type_id INT REFERENCES contract_types(ct_id) NOT NULL,
    reason_id INT REFERENCES request_reasons(rr_id) NOT NULL,

    required_position_name VARCHAR(100) NOT NULL,
    num_required INT NOT NULL DEFAULT 1,

    min_age INT,
    max_age INT,
    gender_id INT REFERENCES genders(gender_id),
    nationality_id INT REFERENCES nationalities(nat_id),
    experience_id INT REFERENCES experiences(exp_id),
    education_level_id INT REFERENCES education_levels(edu_id),
    special_qualifications TEXT,

    origin_status VARCHAR(50) DEFAULT 'DRAFT',
    hr_status VARCHAR(50) DEFAULT 'NONE',
    management_status VARCHAR(50) DEFAULT 'NONE',
    overall_status VARCHAR(50) DEFAULT 'IN_PROGRESS',

    approver_mgr_id     VARCHAR(50),
    approver_dir_id     VARCHAR(50),
    approver_recruit_id VARCHAR(50),
    approver_hrmgr_id   VARCHAR(50),
    approver_hrdir_id   VARCHAR(50),
    approver_mgmt_id    VARCHAR(50),

    target_hire_date DATE,
    current_status VARCHAR(50) DEFAULT 'รอ HR พิจารณา',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_history (
    history_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES manpower_requests(request_id) ON DELETE CASCADE,
    approver_id VARCHAR(50) REFERENCES employees(employee_id),
    step SMALLINT NOT NULL,           -- 1=Mgr, 2=Dir, 3=Recruiter, 4=HRMgr, 5=HRDir
    action VARCHAR(20) NOT NULL,      -- APPROVE / REJECT / RETURN / SUBMIT
    notes TEXT,
    approval_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_name) VALUES ('Admin'), ('Approve'), ('User');

INSERT INTO departments (dept_name) VALUES
('ฝ่ายบริหาร'), ('ฝ่ายทรัพยากรบุคคล'),
('ฝ่ายการตลาด'), ('ฝ่ายเทคโนโลยีสารสนเทศ'),
('ฝ่ายผลิต'), ('ฝ่ายบัญชี'), ('ฝ่ายจัดซื้อ');

INSERT INTO positions (pos_name) VALUES
('ผู้จัดการ'), ('เจ้าหน้าที่ HR'),
('นักการตลาด'), ('โปรแกรมเมอร์'),
('พนักงานทั่วไป'), ('นักบัญชี'), ('เจ้าหน้าที่จัดซื้อ'), ('ผู้อำนวยการฝ่าย');

INSERT INTO sections (section_name) VALUES
('แผนกธุรการ'), ('แผนกบัญชี'),
('แผนกจัดซื้อ'), ('แผนกการตลาด'),
('แผนกไอที'), ('แผนกบุคคล'), ('แผนกผลิต');

INSERT INTO employment_types (et_name) VALUES ('รายเดือน'), ('รายวัน'), ('ชั่วคราว');

INSERT INTO contract_types (ct_name) VALUES
('สัญญาไม่มีกำหนดระยะเวลา'),
('สัญญาจ้างแบบมีระยะเวลา');

INSERT INTO request_reasons (rr_name) VALUES ('เพิ่มอัตรากำลังพล'), ('แทนตำแหน่งที่ว่าง');

INSERT INTO genders (gender_name) VALUES ('ชาย'), ('หญิง'), ('ไม่จำกัด');

INSERT INTO nationalities (nat_name) VALUES ('ไทย'), ('ต่างชาติ'), ('ไม่จำกัด');

INSERT INTO experiences (exp_name) VALUES
('ไม่มีประสบการณ์'), ('1-2 ปี'),
('3-5 ปี'), ('5-10 ปี'), ('มากกว่า 10 ปี');

INSERT INTO education_levels (edu_name) VALUES
('ม.3'), ('ม.6'), ('ปวช.'), ('ปวส.'),
('ปริญญาตรี'), ('ปริญญาโท'), ('ปริญญาเอก'), ('ไม่จำกัดวุฒิ');

INSERT INTO employees (employee_id, first_name, last_name, email, password, pos_id, dept_id, section_id, role_id)
VALUES
('E001', 'แอดมิน', 'แอดมิน', 'admin@email.com', '1234', 4, 4, 5, 1),
('E002', 'ผู้ใช้งาน', 'ทดสอบ', 'user@email.com', '1234', 3, 3, 4, 3),
('E003', 'ผู้จัดการแผนก', 'ทดสอบ', 'manager@email.com', '1234', 1, 3, 4, 2),
('E004', 'ผู้อำนวยการฝ่าย', 'ทดสอบ', 'director@email.com', '1234', 8, 3, 4, 2),
('E005', 'เจ้าหน้าที่สรรหา', 'ทดสอบ', 'recruiter@email.com', '1234', 2, 2, 6, 2),
('E006', 'ผู้จัดการแผนก hr', 'ทดสอบ', 'manager_hr@email.com', '1234', 1, 2, 6, 2),
('E007', 'ผู้อำนวยการฝ่าย hr', 'ทดสอบ', 'director_hr@email.com', '1234', 8, 2, 6, 2);


INSERT INTO employees (employee_id, first_name, last_name, email, password, pos_id, dept_id, section_id, role_id)
VALUES

 ('E101', 'ชาวี', 'ชีวา', 'ceo@email.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายบริหาร'),
 (SELECT section_id FROM sections WHERE section_name='แผนกธุรการ'),
 2),
 ('E102', 'ตะวัน', 'วันตา', 'tawan@email.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายบัญชี'),
 (SELECT section_id FROM sections WHERE section_name='แผนกบัญชี'),
 3);

UPDATE manpower_requests
SET hr_status = 'WAITING_RECRUITER'
WHERE hr_status = 'HR_INTAKE'
  AND origin_status = 'DIR_APPROVED';