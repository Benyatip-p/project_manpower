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

-- =========================
-- EMPLOYEES
-- =========================
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

-- =========================
-- MANPOWER REQUESTS
-- =========================
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

    -- ข้อมูลเงื่อนไขพนักงานที่ต้องการ
    min_age INT,
    max_age INT,
    gender_id INT REFERENCES genders(gender_id),
    nationality_id INT REFERENCES nationalities(nat_id),
    experience_id INT REFERENCES experiences(exp_id),
    education_level_id INT REFERENCES education_levels(edu_id),
    special_qualifications TEXT,

    -- สถานะหลัก 3 ส่วน (คำนวณฝั่ง Go)
    origin_status VARCHAR(50) DEFAULT 'DRAFT',
    hr_status VARCHAR(50) DEFAULT 'NONE',
    overall_status VARCHAR(50) DEFAULT 'IN_PROGRESS',

    -- ผู้อนุมัติแต่ละขั้น
    approver_mgr_id     VARCHAR(50),
    approver_dir_id     VARCHAR(50),
    approver_recruit_id VARCHAR(50),
    approver_hrmgr_id   VARCHAR(50),
    approver_hrdir_id   VARCHAR(50),

    target_hire_date DATE,
    current_status VARCHAR(50) DEFAULT 'รอ HR พิจารณา',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- APPROVAL HISTORY
-- =========================
CREATE TABLE approval_history (
    history_id SERIAL PRIMARY KEY,
    request_id INT REFERENCES manpower_requests(request_id) ON DELETE CASCADE,
    approver_id VARCHAR(50) REFERENCES employees(employee_id),
    step SMALLINT NOT NULL,           -- 1=Mgr, 2=Dir, 3=Recruiter, 4=HRMgr, 5=HRDir
    action VARCHAR(20) NOT NULL,      -- APPROVE / REJECT / RETURN / SUBMIT
    notes TEXT,
    approval_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_resignations (
  id SERIAL PRIMARY KEY,
  dept_id INT REFERENCES departments(dept_id),
  resigned_at DATE NOT NULL DEFAULT CURRENT_DATE
);


-- =========================
-- SEED DATA
-- =========================
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
('E001', 'แอดมิน', 'ทดสอบ', 'admin@example.com', '1234', 4, 4, 5, 1),
('E002', 'ผู้ใช้งาน', 'ทดสอบ', 'user@example.com', '1234', 3, 3, 4, 3),
('E003', 'ผู้จัดการแผนก', 'ทดสอบ', 'manager@example.com', '1234', 1, 3, 4, 2),
('E004', 'ผู้อำนวยการฝ่าย', 'ทดสอบ', 'director@example.com', '1234', 8, 3, 4, 2),
('E005', 'เจ้าหน้าที่สรรหา', 'ทดสอบ', 'recruiter@example.com', '1234', 2, 2, 6, 2),
('E006', 'ผู้จัดการแผนก hr', 'ทดสอบ', 'manager_hr@example.com', '1234', 1, 2, 6, 2),
('E007', 'ผู้อำนวยการฝ่าย hr', 'ทดสอบ', 'director_hr@example.com', '1234', 8, 2, 6, 2);


INSERT INTO employees (employee_id, first_name, last_name, email, password, pos_id, dept_id, section_id, role_id)
VALUES
('E101', 'สมศักดิ์', 'ขยันยิ่ง', 'som@example.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายผลิต'),
 (SELECT section_id FROM sections WHERE section_name='แผนกผลิต'),
 3),

('E102', 'สมหญิง', 'รักงาน', 'somying@example.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายการตลาด'),
 (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
 3),

('E103', 'มานี', 'มีนา', 'manee@example.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายบัญชี'),
 (SELECT section_id FROM sections WHERE section_name='แผนกบัญชี'),
 3),

('E104', 'เอกชัย', 'เจริญสุข', 'ekachai@example.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายทรัพยากรบุคคล'),
 (SELECT section_id FROM sections WHERE section_name='แผนกบุคคล'),
 3),

('E105', 'วิทวัส', 'เก่งกาจ', 'witwat@example.com', '1234',
 (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
 (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเทคโนโลยีสารสนเทศ'),
 (SELECT section_id FROM sections WHERE section_name='แผนกไอที'),
 3);

-- ========== 1 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110012', 'E101', TO_DATE('23/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายผลิต'),
  (SELECT section_id FROM sections WHERE section_name='แผนกผลิต'),
  (SELECT pos_id FROM positions WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id  FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id  FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id  FROM request_reasons  WHERE rr_name='แทนตำแหน่งที่ว่าง'),
  'ช่างเชื่อม', 1,
  22, 45,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='3-5 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปวส.'),
  'มีความสามารถในการเชื่อม TIG, MIG และสามารถอ่านแบบได้เป็นอย่างดี',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 2 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110013', 'E102', TO_DATE('24/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายการตลาด'),
  (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
  (SELECT pos_id FROM positions  WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id  FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id  FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id  FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'เจ้าหน้าที่การตลาดดิจิทัล', 1,
  25, 35,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name IN ('3-5 ปี','1-2 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'มีความเชี่ยวชาญ Google Ads, Facebook Ads และเครื่องมือ SEO',
  'DIR_APPROVED', 'HR_INTAKE', 'IN_PROGRESS'
);

-- ========== 3 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110014', 'E103', TO_DATE('25/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายบัญชี'),
  (SELECT section_id FROM sections WHERE section_name='แผนกบัญชี'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='ชั่วคราว'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้าง 6 เดือน','สัญญาจ้างแบบมีระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'ผู้ช่วยนักบัญชี (ชั่วคราว)', 1,
  21, 30,
  (SELECT gender_id FROM genders WHERE gender_name='หญิง'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='ไม่มีประสบการณ์'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'สามารถใช้โปรแกรม Express ได้จะพิจารณาเป็นพิเศษ',
  'MGR_REJECTED', 'NONE', 'REJECTED'
);

-- ========== 4 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110015', 'E103', TO_DATE('26/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายทรัพยากรบุคคล'),
  (SELECT section_id FROM sections WHERE section_name='แผนกบุคคล'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='แทนตำแหน่งที่ว่าง'),
  'เจ้าหน้าที่สรรหาว่าจ้าง', 1,
  24, 35,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name IN ('1-2 ปี','3-5 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'มีทักษะการสื่อสารและมนุษยสัมพันธ์ดีเยี่ยม',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 5 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110016', 'E101', TO_DATE('27/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายเทคโนโลยีสารสนเทศ'),
  (SELECT section_id FROM sections WHERE section_name='แผนกไอที'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'IT Support', 1,
  22, 35,
  (SELECT gender_id FROM genders WHERE gender_name='ชาย'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='1-2 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'แก้ไขปัญหา Hardware/Software/Network พื้นฐานได้',
  'DIR_APPROVED', 'HR_INTAKE', 'IN_PROGRESS'
);

-- ========== 6 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110017', 'E105', TO_DATE('28/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายจัดซื้อ'),
  (SELECT section_id FROM sections WHERE section_name='แผนกจัดซื้อ'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'พนักงานจัดซื้อ', 1,
  25, 40,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name IN ('1-2 ปี','3-5 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'ทักษะการเจรจาต่อรองดี',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 7 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110018', 'E102', TO_DATE('29/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายผลิต'),
  (SELECT section_id FROM sections WHERE section_name='แผนกผลิต'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'พนักงานฝ่ายผลิต', 1,
  18, 40,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='ไม่มีประสบการณ์'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ม.3'),
  'ขยัน อดทน ทำงานเป็นกะได้',
  'DIR_APPROVED', 'HR_MANAGER_APPROVED', 'WAITING_HR_DIRECTOR'
);

-- ========== 8 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110019', 'E104', TO_DATE('30/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายจัดซื้อ'),
  (SELECT section_id FROM sections WHERE section_name='แผนกจัดซื้อ'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='ชั่วคราว'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้าง 1 ปี','สัญญาจ้างแบบมีระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'พนักงานคลังสินค้า', 1,
  20, 45,
  (SELECT gender_id FROM genders WHERE gender_name='ชาย'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='1-2 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ม.6'),
  'ขับโฟล์คลิฟท์ได้ (มีใบรับรองพิจารณาพิเศษ)',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 9 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110020', 'E105', TO_DATE('01/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายผลิต'),
  (SELECT section_id FROM sections WHERE section_name='แผนกผลิต'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='แทนตำแหน่งที่ว่าง'),
  'ช่างซ่อมบำรุง', 1,
  22, 50,
  (SELECT gender_id FROM genders WHERE gender_name='ชาย'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='3-5 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปวส.'),
  'ซ่อมบำรุงเครื่องจักรในโรงงานอุตสาหกรรม',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 10 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110021', 'E101', TO_DATE('02/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายการตลาด'),
  (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='ชั่วคราว'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างแบบมีระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'นักศึกษาฝึกงานการตลาด', 1,
  18, 25,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='ไม่มีประสบการณ์'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'สนใจการตลาดออนไลน์และคิดสร้างสรรค์',
  'SUBMITTED', 'HR_INTAKE', 'IN_PROGRESS'
);

-- ========== 11 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110022', 'E102', TO_DATE('03/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายทรัพยากรบุคคล'),
  (SELECT section_id FROM sections WHERE section_name='แผนกบุคคล'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'เจ้าหน้าที่สรรหาอาวุโส', 1,
  28, 40,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='5-10 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'มีประสบการณ์สรรหาตำแหน่งระดับผู้จัดการ',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 12 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110023', 'E102', TO_DATE('04/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายบัญชี'),
  (SELECT section_id FROM sections WHERE section_name='แผนกบัญชี'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='แทนตำแหน่งที่ว่าง'),
  'นักบัญชีอาวุโส', 1,
  30, 45,
  (SELECT gender_id FROM genders WHERE gender_name='ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name='5-10 ปี'),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'ปิดงบและภาษีได้ดี',
  'DIR_APPROVED', 'HR_DIRECTOR_APPROVED', 'APPROVED'
);

-- ========== 13 ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110024', 'E103', TO_DATE('24/11/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name='ฝ่ายการตลาด'),
  (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
  (SELECT pos_id  FROM positions   WHERE pos_name='พนักงานทั่วไป'),
  (SELECT et_id   FROM employment_types WHERE et_name='รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name='เพิ่มอัตรากำลังพล'),
  'พนักงานขาย', 1,
  23, 38,
  (SELECT gender_id FROM genders WHERE gender_name IN ('ไม่จำกัด') LIMIT 1),
  (SELECT nat_id    FROM nationalities WHERE nat_name='ไทย'),
  (SELECT exp_id    FROM experiences WHERE exp_name IN ('1-2 ปี','3-5 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name='ปริญญาตรี'),
  'มีรถยนต์ส่วนตัว เดินทางต่างจังหวัดได้',
  'SUBMITTED', 'HR_INTAKE', 'IN_PROGRESS'
);

-- ========== 14 (เดิมระบุ E002 แก้เป็น E102 ให้ไม่ชน FK) ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110025', 'E102', TO_DATE('05/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name = 'ฝ่ายการตลาด'),
  (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
  (SELECT pos_id  FROM positions   WHERE pos_name = 'นักการตลาด'),
  (SELECT et_id   FROM employment_types WHERE et_name = 'รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name = 'เพิ่มอัตรากำลังพล'),
  'เจ้าหน้าที่การตลาดดิจิทัล (Junior)', 1,
  22, 32,
  (SELECT gender_id FROM genders WHERE gender_name = 'ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name = 'ไทย'),
  (SELECT exp_id    FROM experiences   WHERE exp_name IN ('1-2 ปี','3-5 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name = 'ปริญญาตรี'),
  'วางแผน/ยิงโฆษณา Google & Facebook, พื้นฐาน SEO/GA4',
  'SUBMITTED', 'HR_INTAKE', 'IN_PROGRESS'
);

-- ========== 15 (เดิมระบุ E002 แก้เป็น E102 ให้ไม่ชน FK) ==========
INSERT INTO manpower_requests (
  doc_number, employee_id, doc_date,
  requesting_dept_id, requesting_section_id, requesting_pos_id,
  employment_type_id, contract_type_id, reason_id,
  required_position_name, num_required,
  min_age, max_age, gender_id, nationality_id, experience_id, education_level_id,
  special_qualifications,
  origin_status, hr_status, overall_status
) VALUES (
  'PQ24110026', 'E102', TO_DATE('06/12/2024','DD/MM/YYYY'),
  (SELECT dept_id FROM departments WHERE dept_name = 'ฝ่ายการตลาด'),
  (SELECT section_id FROM sections WHERE section_name='แผนกการตลาด'),
  (SELECT pos_id  FROM positions   WHERE pos_name = 'นักการตลาด'),
  (SELECT et_id   FROM employment_types WHERE et_name = 'รายเดือน'),
  (SELECT ct_id   FROM contract_types   WHERE ct_name IN ('สัญญาจ้างไม่มีกำหนด','สัญญาไม่มีกำหนดระยะเวลาเวลา','สัญญาไม่มีกำหนดระยะเวลา') ORDER BY ct_id LIMIT 1),
  (SELECT rr_id   FROM request_reasons  WHERE rr_name = 'แทนตำแหน่งที่ว่าง'),
  'นักวิเคราะห์การตลาด (Marketing Analyst)', 1,
  23, 35,
  (SELECT gender_id FROM genders WHERE gender_name = 'ไม่จำกัด'),
  (SELECT nat_id    FROM nationalities WHERE nat_name = 'ไทย'),
  (SELECT exp_id    FROM experiences   WHERE exp_name IN ('1-2 ปี','3-5 ปี') ORDER BY exp_id LIMIT 1),
  (SELECT edu_id    FROM education_levels WHERE edu_name = 'ปริญญาตรี'),
  'ใช้ Excel/SQL ได้ดี, รู้จัก Looker/Power BI จะพิจารณาเป็นพิเศษ',
  'SUBMITTED', 'HR_INTAKE', 'IN_PROGRESS'
);

UPDATE manpower_requests
SET hr_status = 'WAITING_RECRUITER'
WHERE hr_status = 'HR_INTAKE'
  AND origin_status = 'DIR_APPROVED';