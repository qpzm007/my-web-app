-- ==========================================
-- SmartFactory Go - Supabase Initial Schema
-- ==========================================

-- 0. 기존 테이블 초기화 (재실행 시 에러 방지용)
DROP TABLE IF EXISTS help_signals CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS processes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- 1. Projects Table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "targetDate" TEXT NOT NULL,
    "startDate" TEXT NOT NULL
);

-- 2. Processes Table
CREATE TABLE processes (
    id TEXT PRIMARY KEY,
    "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    inventory INTEGER NOT NULL DEFAULT 0,
    "avgTime" INTEGER NOT NULL,
    "currentTime" INTEGER NOT NULL,
    "requiredAmount" INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL
);

-- 3. Workers Table
CREATE TABLE workers (
    id TEXT PRIMARY KEY,
    "loginId" TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'master', 'manager', 'worker'
    "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    "skillLevel" INTEGER NOT NULL DEFAULT 5,
    "currentProcessId" TEXT REFERENCES processes(id) ON DELETE SET NULL,
    "taskState" TEXT, -- 'waiting', 'working', 'paused'
    "assignedQuantity" INTEGER,
    avatar TEXT NOT NULL
);

-- 4. Logs Table
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'photo', 'defect', 'system'
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    "processId" TEXT REFERENCES processes(id) ON DELETE CASCADE
);

-- 5. Help Signals Table
CREATE TABLE help_signals (
    id TEXT PRIMARY KEY,
    "processId" TEXT REFERENCES processes(id) ON DELETE CASCADE,
    "workerName" TEXT NOT NULL,
    message TEXT NOT NULL
);

-- Disable Row Level Security (RLS) for simple MVPs (Warning: Not for production without policies)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE help_signals DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- 🔥 핵심: 실시간 웹소켓(Realtime) 방송 기능 강제 활성화 🔥
-- ==========================================
begin;
  -- 만약 publication이 없다면 생성 (보통 Supabase는 기본 내장되어 있음)
  -- drop publication if exists supabase_realtime;
  -- create publication supabase_realtime;
  
  alter publication supabase_realtime add table projects;
  alter publication supabase_realtime add table processes;
  alter publication supabase_realtime add table workers;
  alter publication supabase_realtime add table logs;
  alter publication supabase_realtime add table help_signals;
commit;

-- Insert Mock Initial Data
INSERT INTO projects (id, name, "targetQuantity", "targetDate", "startDate") 
VALUES ('proj1', '라인 A-01 (자동차 부품)', 5000, '2026-04-30', '2026-03-01');

INSERT INTO processes (id, "projectId", name, status, inventory, "avgTime", "currentTime", "requiredAmount", description) 
VALUES 
('p1', 'proj1', '정밀 가공', 'normal', 120, 10, 8, 1, 'CNC 선반 가공'),
('p2', 'proj1', '조립 라인', 'delay', 450, 25, 32, 2, '부품 체결');

INSERT INTO workers (id, "loginId", password, role, "projectId", name, department, "skillLevel", "currentProcessId", "taskState", "assignedQuantity", avatar) 
VALUES 
('admin', 'admin', '1234', 'master', 'proj1', '최고관리자', '시스템', 10, NULL, NULL, NULL, 'https://ui-avatars.com/api/?name=Admin&background=f97316&color=fff'),
('m1', 'm1', '1', 'manager', 'proj1', '이수진', '생산관리팀', 8, NULL, NULL, NULL, 'https://ui-avatars.com/api/?name=이수진&background=000'),
('w1', 'w1', '1', 'worker', 'proj1', '김철수', '가공팀', 9, 'p1', 'waiting', 100, 'https://ui-avatars.com/api/?name=김철수&background=000'),
('w2', 'w2', '1', 'worker', 'proj1', '박영희', '조립팀', 5, 'p2', 'working', 200, 'https://ui-avatars.com/api/?name=박영희&background=000'),
('w3', 'w3', '1', 'worker', 'proj1', '정민수', '대기조', 7, NULL, 'waiting', NULL, 'https://ui-avatars.com/api/?name=정민수&background=000');
