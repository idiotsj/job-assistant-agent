INSERT INTO app_users (
  id,
  email,
  password_hash,
  name,
  role,
  status,
  email_verified_at
)
VALUES
  (
    'user-1',
    'demo@example.com',
    '$argon2id$v=19$m=19456,t=2,p=1$f9r4BtvtI9PRHdhzCD/6xw$ipHShyYD1SMWQlr3QdLvdWnSmXJy9kA0FGItfq2cJ3E',
    '演示用户',
    'user',
    'active',
    NOW()
  )
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified_at = EXCLUDED.email_verified_at,
  updated_at = NOW();

INSERT INTO companies (id, name, industry, city, description, is_featured, updated_at)
VALUES
  ('company-1', '星河科技', '互联网', '上海', '聚焦校园招聘与职业成长工具。', TRUE, NOW()),
  ('company-2', '明日数据', '数据服务', '北京', '提供企业数据分析与可视化平台。', FALSE, NOW()),
  ('company-3', '流光互娱', '互联网', '上海', '专注年轻用户内容与互动产品。', TRUE, NOW())
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  city = EXCLUDED.city,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  updated_at = EXCLUDED.updated_at;

INSERT INTO jobs (
  id,
  company_id,
  company_name,
  company_industry,
  title,
  work_location,
  tags,
  required_skills,
  description,
  is_featured,
  deadline,
  popularity,
  raw_requirements,
  published_at
)
VALUES
  (
    'job-1',
    'company-1',
    '星河科技',
    '互联网',
    '前端开发实习生',
    '上海',
    ARRAY['前端', '实习'],
    ARRAY['TypeScript', 'React'],
    '负责招聘站点前端开发。',
    TRUE,
    NOW() + INTERVAL '3 day',
    98,
    '{"education":"本科","bonus":["作品集"]}'::jsonb,
    NOW() - INTERVAL '2 day'
  ),
  (
    'job-2',
    'company-1',
    '星河科技',
    '互联网',
    'Web 开发工程师',
    '上海',
    ARRAY['Web'],
    ARRAY['React', 'SQL'],
    '负责企业门户建设。',
    FALSE,
    NOW() + INTERVAL '10 day',
    80,
    '{"education":"本科"}'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    'job-3',
    'company-2',
    '明日数据',
    '数据服务',
    '数据分析助理',
    '北京',
    ARRAY['数据'],
    ARRAY['Python'],
    '负责报表分析。',
    FALSE,
    NOW() + INTERVAL '15 day',
    66,
    '{"education":"本科"}'::jsonb,
    NOW() - INTERVAL '4 day'
  ),
  (
    'job-4',
    'company-3',
    '流光互娱',
    '互联网',
    '前端开发工程师',
    '上海',
    ARRAY['前端'],
    ARRAY['TypeScript'],
    '负责活动页面开发。',
    TRUE,
    NOW() + INTERVAL '5 day',
    91,
    '{"education":"本科","bonus":["活动项目经验"]}'::jsonb,
    NOW() - INTERVAL '3 day'
  )
ON CONFLICT (id) DO UPDATE
SET
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  company_industry = EXCLUDED.company_industry,
  title = EXCLUDED.title,
  work_location = EXCLUDED.work_location,
  tags = EXCLUDED.tags,
  required_skills = EXCLUDED.required_skills,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  deadline = EXCLUDED.deadline,
  popularity = EXCLUDED.popularity,
  raw_requirements = EXCLUDED.raw_requirements,
  published_at = EXCLUDED.published_at;

INSERT INTO student_cases (id, title, career_path, background_major, city, tags, summary, is_featured, published_at)
VALUES
  ('case-1', '从计算机专业到前端开发', '前端开发', '计算机科学', '上海', ARRAY['React', 'TypeScript'], '聚焦校园项目包装和作品集优化。', TRUE, NOW() - INTERVAL '7 day'),
  ('case-2', '数据岗求职复盘', '数据分析', '统计学', '北京', ARRAY['Python'], '强调项目和实习经历。', FALSE, NOW() - INTERVAL '20 day')
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  career_path = EXCLUDED.career_path,
  background_major = EXCLUDED.background_major,
  city = EXCLUDED.city,
  tags = EXCLUDED.tags,
  summary = EXCLUDED.summary,
  is_featured = EXCLUDED.is_featured,
  published_at = EXCLUDED.published_at;

INSERT INTO career_events (
  id,
  title,
  company_name,
  company_industry,
  city,
  start_at,
  end_at,
  registration_deadline,
  description,
  is_featured
)
VALUES
  (
    'event-1',
    '星河科技春招宣讲会',
    '星河科技',
    '互联网',
    '上海',
    NOW() + INTERVAL '2 day',
    NOW() + INTERVAL '2 day 2 hour',
    NOW() + INTERVAL '1 day',
    '介绍春招岗位与培养体系。',
    TRUE
  ),
  (
    'event-2',
    '京津地区双选会',
    '城市人才中心',
    '公共服务',
    '北京',
    NOW() + INTERVAL '9 day',
    NULL,
    NULL,
    '综合性招聘会。',
    FALSE
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  company_name = EXCLUDED.company_name,
  company_industry = EXCLUDED.company_industry,
  city = EXCLUDED.city,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  registration_deadline = EXCLUDED.registration_deadline,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured;

INSERT INTO daily_content (
  id,
  kind,
  title,
  body,
  tags,
  target_industries,
  target_cities,
  is_featured,
  active_from,
  active_to
)
VALUES
  (
    'daily-1',
    'advice',
    '先投递上海互联网岗位',
    '你的城市与行业偏好比较明确，今天优先处理高匹配岗位，并准备针对性的项目介绍。',
    ARRAY['投递'],
    ARRAY['互联网'],
    ARRAY['上海'],
    TRUE,
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  kind = EXCLUDED.kind,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  tags = EXCLUDED.tags,
  target_industries = EXCLUDED.target_industries,
  target_cities = EXCLUDED.target_cities,
  is_featured = EXCLUDED.is_featured,
  active_from = EXCLUDED.active_from,
  active_to = EXCLUDED.active_to;

INSERT INTO postgraduate_advice (id, title, summary, action_items, target_majors, updated_at)
VALUES
  ('pg-1', '保留考研备选路径', '如果你还在比较就业与考研，可先明确目标院校与备考窗口。', ARRAY['确认目标院校', '评估暑期备考计划'], ARRAY['计算机科学'], NOW())
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  action_items = EXCLUDED.action_items,
  target_majors = EXCLUDED.target_majors,
  updated_at = EXCLUDED.updated_at;

INSERT INTO civil_service_advice (id, title, summary, action_items, target_cities, updated_at)
VALUES
  ('cs-1', '关注本地选调与事业编', '优先看上海及周边地区的报名节点。', ARRAY['收藏公告源', '整理报名时间线'], ARRAY['上海'], NOW())
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  action_items = EXCLUDED.action_items,
  target_cities = EXCLUDED.target_cities,
  updated_at = EXCLUDED.updated_at;

INSERT INTO user_profiles (
  user_id,
  university,
  major,
  grade,
  target_industries,
  target_cities,
  skills,
  preferred_job_types,
  considers_postgraduate,
  considers_civil_service,
  resume_data
)
VALUES
  (
    'user-1',
    '同济大学',
    '计算机科学',
    '大四',
    ARRAY['互联网'],
    ARRAY['上海'],
    ARRAY['TypeScript', 'React', 'SQL'],
    ARRAY['前端开发'],
    TRUE,
    FALSE,
    NULL
  )
ON CONFLICT (user_id) DO UPDATE
SET
  university = EXCLUDED.university,
  major = EXCLUDED.major,
  grade = EXCLUDED.grade,
  target_industries = EXCLUDED.target_industries,
  target_cities = EXCLUDED.target_cities,
  skills = EXCLUDED.skills,
  preferred_job_types = EXCLUDED.preferred_job_types,
  considers_postgraduate = EXCLUDED.considers_postgraduate,
  considers_civil_service = EXCLUDED.considers_civil_service,
  resume_data = EXCLUDED.resume_data,
  updated_at = NOW();

INSERT INTO schedule_items (id, user_id, title, source, start_at, end_at, city, description)
VALUES
  (
    'personal-1',
    'user-1',
    '更新简历项目描述',
    'user',
    NOW() + INTERVAL '1 day',
    NULL,
    NULL,
    '补齐两个 React 项目的量化结果。'
  )
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  city = EXCLUDED.city,
  description = EXCLUDED.description;
