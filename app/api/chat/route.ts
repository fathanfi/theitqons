import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey,
});

// Test user IDs
const TEST_USER_IDS = [
  'fathanrbe@gmail.com',
  'pptqmiftahulkhoir@gmail.com'
];

// Define the database schema for the AI
const DB_SCHEMA = `
Tables:
- students (
    id, name, gender, status, total_pages, created_at, updated_at,
    registration_number, national_id, family_id, joined_date, notes,
    class_id, level_id, father_name, mother_name, wali_name,
    school_info, place_of_birth, date_of_birth, phone_number, last_achievement
  )
- student_total_points (student_id, earned_points, redeemed_points, total_points, created_at)
- activity_logs (student_id, action_type, message, related_id, metadata, created_at)
- student_badges (student_id, badge_id, created_at)
- badges (id, icon, description, created_at)
- classes (id, name, description, teacher_id, created_at)
- levels (id, name, description, created_at)
- teachers (id, name, address, date_of_birth, place_of_birth, phone, join_date, gender, created_at)
- itqon_exams (id, exam_id, student_id, teacher_id, exam_date, tahfidz_score, tajwid_score, status, created_at, updated_at)
- exams (id, name, description, created_at)
- group_students (id, student_id, group_id, created_at)
- groups (id, name, description, created_at)
- school_settings (id, name, account_number, principal_name, established_year, address, city, state_province, 
     postal_code, country, phone_number, email, website, facilities, student_count, staff_count, school_code, 
     latitude, longitude, bank_account, created_at
  )
- points (id, name, description, point, created_at)
- student_points (id, student_id, point_id, created_at)
- redemptions (id, student_id, rewards_name, points, icon, redeemed_at)

Class IDs Reference (Marhalah):
- Ibtidai (Elementary): b7a0d756-125d-46e6-8cc1-aa2ac1c736bd
- Wustho (Junior High): bc0c439a-d9ef-44a4-8a88-bd840207b13d
- Aly (Senior High): dcad05e4-87e4-4186-b4e4-53c184c50d7b
- Graduation: 880147f0-99ac-4404-a3f1-838cda942a52
- Out: c0afbe00-d694-4d7b-887b-ff49d79fc99d

Level IDs Reference:
- Juz 30: 4732b096-5144-4440-a2f9-b28b53e5248d
- Juz 29: 5c978db3-a0b4-414c-9f21-73462ad12cb8
- Juz 28: 144532db-f5c5-4f31-be89-dad2d70f8bfa
- Juz 1: 343c5a0a-db7d-4326-a477-e5782c060e1b
- Takhosus: cbbd188c-8ffc-4d54-9782-6d3356fbfaa6

Relationships:
- students.class_id -> classes.id
- students.level_id -> levels.id
- student_total_points.student_id -> students.id
- activity_logs.student_id -> students.id
- student_badges.student_id -> students.id
- student_badges.badge_id -> badges.id
- classes.teacher_id -> teachers.id
- itqon_exams.student_id -> students.id
- itqon_exams.teacher_id -> teachers.id
- itqon_exams.exam_id -> exams.id
- group_students.student_id -> students.id
- group_students.group_id -> groups.id
- student_points.student_id -> students.id
- student_points.point_id -> points.id
- redemptions.student_id -> students.id

Note: All column names use snake_case format (e.g., total_pages, last_achievement, date_of_birth)
Status in students table is boolean:
- TRUE: active, aktif
- FALSE: inactive, non aktif, tidak aktif

Indonesian Language Context:
1. Students can be referred to as:
   - santri
   - siswa
   - murid

2. Teachers can be referred to as:
   - guru
   - muahfidz/muhafizh
   - asatidz/asatiz/asatid
   - guru tahfidz/tahfizh

3. Classes can be referred to as:
   - kelas
   - marhalah
   - Ibtidai (Elementary)
   - Wustho (Junior High)
   - Aly (Senior High)
   - Graduation
   - Out

4. Levels can be referred to as:
   - juz
   - kelas itqon
   - tingkatan
   - Juz 30
   - Juz 29
   - Juz 28
   - Juz 1
   - Takhosus/Khusus

5. Badges can be referred to as:
   - badge
   - lencana
   - penghargaan

6. Redemptions can be referred to as:
   - tukar poin
   - tukar
   - penukaran
   - redem

7. Principal can be referred to as:
   - mudir
   - pimpinan
   - direktur
   - principal
   - kepala sekolah
   - kepala madrasah
   - kepala pesantren
   - school leader
   - school principal
   - school director
   - school head
   - pimpinan pondok
   - mudir pesantren
   - principal_name (column in school_settings)

8. Gender terms:
   - Female: akhwat, perempuan
   - Male: ikhwan, laki-laki, laki

9. School can be referred to as:
   - pesantren
   - madrasah
   - pptq
   - ponpes
   - lembaga
   - sekolah

10. Total Pages can be referred to as:
    - Total Hafalan
    - Momorized
    - Total Halaman
    - Hafalan

11. School information can be referred to as:
    - school information
    - school profile
    - profil sekolah
    - informasi sekolah
    - detail sekolah
    - detail madrasah
    - detail pesantren
    - profil madrasah
    - profil pesantren
    - all columns in school_settings

Example SQL Queries:
1. Count total students by gender:
SELECT s.gender, COUNT(*) as total
FROM students s
GROUP BY s.gender;

2. Count active and inactive students by gender:
SELECT 
  s.gender,
  SUM(CASE WHEN s.status = true THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN s.status = false THEN 1 ELSE 0 END) as inactive
FROM students s
GROUP BY s.gender;

3. Count students by marhalah (class) and gender:
SELECT 
  c.name as marhalah,
  s.gender,
  COUNT(*) as total
FROM students s
JOIN classes c ON s.class_id = c.id
GROUP BY c.name, s.gender;

4. Count students by level and gender:
SELECT 
  l.name as level,
  s.gender,
  COUNT(*) as total
FROM students s
JOIN levels l ON s.level_id = l.id
GROUP BY l.name, s.gender;

// Example SQL Query for principal:
// Q: Who is the principal of the school?
// A: SELECT principal_name FROM school_settings LIMIT 1;
// Q: Siapa mudir pesantren?
// A: SELECT principal_name FROM school_settings LIMIT 1;

// Example SQL Query for school information:
// Q: Give me the detail of school information
// A: SELECT * FROM school_settings LIMIT 1;
// Q: Berikan detail informasi sekolah
// A: SELECT * FROM school_settings LIMIT 1;

22. IMPORTANT: For any query about activity_logs (e.g., student activities, aktivitas santri), always select action_type, message, and created_at (and optionally student_id or name if needed). Never use SELECT activity_logs or SELECT * for this table; always specify columns.

// Example SQL Query for last 10 student activities:
// Q: Give me last 10 student activities
// A: SELECT action_type, message, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10;
// Q: Tampilkan 10 aktivitas santri terakhir
// A: SELECT action_type, message, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10;

23. IMPORTANT: For questions about a student's activities by name, join activity_logs and students on student_id, filter by students.name, and select action_type, message, created_at from activity_logs. Always order by created_at DESC and limit results if recent activities are requested.

// Example SQL Query for recent activities of a student by name (using ILIKE for partial match):
// Q: Show me recent activities of student: Rahmi
// A: SELECT a.action_type, a.message, a.created_at FROM activity_logs a JOIN students s ON a.student_id = s.id WHERE s.name ILIKE '%Rahmi%' ORDER BY a.created_at DESC LIMIT 10;
// Q: Tampilkan aktivitas terakhir santri Rahmi
// A: SELECT a.action_type, a.message, a.created_at FROM activity_logs a JOIN students s ON a.student_id = s.id WHERE s.name ILIKE '%Rahmi%' ORDER BY a.created_at DESC LIMIT 10;
`;

// GET endpoint to retrieve chat history
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user email from header
    const userEmail = req.headers.get('x-user-email');
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - No email provided' },
        { status: 401 }
      );
    }

    // For testing: Allow specific test users
    const isTestUser = TEST_USER_IDS.includes(userEmail);
    
    if (!isTestUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Not a test user' },
        { status: 401 }
      );
    }

    // Get chat history for the user
    const { data: history, error: historyError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('History error:', historyError);
      throw historyError;
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Chat History Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get user email from request body
    const { question, userEmail } = await req.json();
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - No email provided' },
        { status: 401 }
      );
    }

    // For testing: Allow specific test users
    const isTestUser = TEST_USER_IDS.includes(userEmail);
    
    if (!isTestUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Not a test user' },
        { status: 401 }
      );
    }

    // First, get the SQL query from GPT-3.5-turbo-16k
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are an expert SQL query generator for a student management system. Your task is to convert natural language questions into precise SQL queries. You can understand both English and Indonesian language queries.

Database Schema:
${DB_SCHEMA}

Guidelines:
1. Generate only the SQL query, no explanations
2. Use proper SQL syntax and best practices
3. Include necessary JOINs and WHERE clauses
4. Optimize for performance
5. Handle NULL values appropriately
6. Use proper date formatting
7. Include ORDER BY when relevant
8. Use appropriate aggregations (COUNT, SUM, AVG, etc.)
9. Always reference student_id for relationships
10. Consider pagination for large result sets
11. IMPORTANT: Use snake_case for all column names
12. IMPORTANT: Always use COUNT(*) AS for counting
13. IMPORTANT: For complex queries, use UNION ALL to combine multiple SELECT statements
14. IMPORTANT: Only use SELECT statements, no WITH clauses
15. IMPORTANT: Always include SELECT, FROM, and GROUP BY in each query
16. IMPORTANT: Never use table aliases to avoid syntax errors
17. Understand both English and Indonesian terms for entities
18. IMPORTANT: 'mudir', 'principal', 'direktur', 'pimpinan', 'kepala sekolah', 'kepala madrasah', 'kepala pesantren', 'school leader', 'school principal', 'school director', 'school head', 'pimpinan pondok', 'mudir pesantren' all refer to the principal, which is stored in the principal_name column of the school_settings table.
19. IMPORTANT: Questions about school information, profile, or detail (in English or Indonesian) should return all columns from school_settings.
20. IMPORTANT: 'siapa mudir pesantren' means 'who is the principal of the school?' and should return principal_name from school_settings.
21. IMPORTANT: This school follows the Madzhab Syafii. If a user asks a general religious question (not about data, e.g., how to perform shalat), answer using the GPT model with an answer based on the Syafii school, and do NOT generate or run a SQL query. Only use the database for data-related questions.
22. IMPORTANT: For any query about activity_logs (e.g., student activities, aktivitas santri), always select action_type, message, and created_at (and optionally student_id or name if needed). Never use SELECT activity_logs or SELECT * for this table; always specify columns.
23. IMPORTANT: For questions about a student's activities by name, join activity_logs and students on student_id, filter by students.name, and select action_type, message, created_at from activity_logs. Always order by created_at DESC and limit results if recent activities are requested.

Example Complex Query:
SELECT 'Total Santri' as category, gender, COUNT(*) as total FROM students GROUP BY gender
UNION ALL
SELECT 'Status Aktif' as category, gender, COUNT(*) as total FROM students WHERE status = true GROUP BY gender
UNION ALL
SELECT 'Status Non Aktif' as category, gender, COUNT(*) as total FROM students WHERE status = false GROUP BY gender
UNION ALL
SELECT 'Marhalah Ibtidai' as category, gender, COUNT(*) as total FROM students WHERE class_id = 'b7a0d756-125d-46e6-8cc1-aa2ac1c736bd' GROUP BY gender
UNION ALL
SELECT 'Marhalah Wustho' as category, gender, COUNT(*) as total FROM students WHERE class_id = 'bc0c439a-d9ef-44a4-8a88-bd840207b13d' GROUP BY gender
UNION ALL
SELECT 'Marhalah Aly' as category, gender, COUNT(*) as total FROM students WHERE class_id = 'dcad05e4-87e4-4186-b4e4-53c184c50d7b' GROUP BY gender
UNION ALL
SELECT 'Level Juz 30' as category, gender, COUNT(*) as total FROM students WHERE level_id = '4732b096-5144-4440-a2f9-b28b53e5248d' GROUP BY gender
UNION ALL
SELECT 'Level Juz 28' as category, gender, COUNT(*) as total FROM students WHERE level_id = '144532db-f5c5-4f31-be89-dad2d70f8bfa' GROUP BY gender
UNION ALL
SELECT 'Level Juz 29' as category, gender, COUNT(*) as total FROM students WHERE level_id = '5c978db3-a0b4-414c-9f21-73462ad12cb8' GROUP BY gender
UNION ALL
SELECT 'Level Juz 1' as category, gender, COUNT(*) as total FROM students WHERE level_id = '343c5a0a-db7d-4326-a477-e5782c060e1b' GROUP BY gender
ORDER BY category, gender;

// Example for principal:
// Q: Who is the principal of the school?
// A: SELECT principal_name FROM school_settings LIMIT 1;
// Q: Siapa mudir pesantren?
// A: SELECT principal_name FROM school_settings LIMIT 1;
// Example for school information:
// Q: Give me the detail of school information
// A: SELECT * FROM school_settings LIMIT 1;
// Q: Berikan detail informasi sekolah
// A: SELECT * FROM school_settings LIMIT 1;

// Example SQL Query for last 10 student activities:
// Q: Give me last 10 student activities
// A: SELECT action_type, message, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10;
// Q: Tampilkan 10 aktivitas santri terakhir
// A: SELECT action_type, message, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10;
`
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const sqlQuery = completion.choices[0].message.content;

    if (!sqlQuery) {
      throw new Error('No SQL query generated');
    }

    // Clean up the SQL query
    const cleanQuery = sqlQuery
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/;$/, '') // Remove trailing semicolon
      .replace(/\\n/g, ' ') // Replace \n with space
      .replace(/\n/g, ' ') // Replace actual newlines with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/```sql\s*|\s*```/g, '') // Remove markdown code block markers
      .replace(/--.*?(?=\s|$)/g, '') // Remove SQL comments
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical comments
      .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
      .replace(/\bCOUNT\s+AS\b/gi, 'COUNT(*) AS') // Fix COUNT AS to COUNT(*) AS
      .replace(/\bCOUNTas\b/gi, 'COUNT(*) AS') // Fix COUNTas to COUNT(*) AS
      .replace(/\bUNION\s+ALL\b/gi, 'UNION ALL') // Ensure proper UNION ALL spacing
      .replace(/\bGROUP\s+BY\b/gi, 'GROUP BY') // Ensure proper GROUP BY spacing
      .replace(/\bORDER\s+BY\b/gi, 'ORDER BY') // Ensure proper ORDER BY spacing
      .replace(/\bWHERE\s+/gi, 'WHERE ') // Ensure proper WHERE spacing
      .replace(/\bFROM\s+/gi, 'FROM ') // Ensure proper FROM spacing
      .replace(/\bJOIN\s+/gi, 'JOIN ') // Ensure proper JOIN spacing
      .replace(/\bON\s+/gi, 'ON ') // Ensure proper ON spacing
      .replace(/\bAS\s+/gi, 'AS ') // Ensure proper AS spacing
      .replace(/\bWITH\s+.*?SELECT/gi, 'SELECT') // Remove WITH clauses
      .replace(/\bSELECT\s+.*?FROM/gi, 'SELECT') // Fix any mangled SELECT statements
      .replace(/\bFROM\s+.*?WHERE/gi, 'FROM') // Fix any mangled FROM clauses
      .replace(/\bWHERE\s+.*?GROUP/gi, 'WHERE') // Fix any mangled WHERE clauses
      .replace(/\bGROUP\s+.*?BY/gi, 'GROUP BY') // Fix any mangled GROUP BY clauses
      .replace(/\bSELECT\s+.*?GROUP/gi, 'SELECT') // Fix any mangled SELECT statements
      .replace(/\bFROM\s+.*?GROUP/gi, 'FROM') // Fix any mangled FROM clauses
      .replace(/\bWHERE\s+.*?BY/gi, 'WHERE') // Fix any mangled WHERE clauses
      .replace(/\bGROUP\s+.*?UNION/gi, 'GROUP BY') // Fix any mangled GROUP BY clauses
      .replace(/\bUNION\s+.*?SELECT/gi, 'UNION ALL SELECT') // Fix any mangled UNION ALL clauses
      .replace(/\bSELECT\s+BY/gi, 'SELECT') // Fix mangled SELECT BY
      .replace(/\bSELECT\s+WHERE/gi, 'SELECT') // Fix mangled SELECT WHERE
      .replace(/\bSELECT\s+JOIN/gi, 'SELECT') // Fix mangled SELECT JOIN
      .replace(/\bFROM\s+JOIN/gi, 'FROM') // Fix mangled FROM JOIN
      .replace(/\bWHERE\s+JOIN/gi, 'WHERE') // Fix mangled WHERE JOIN
      .replace(/\bGROUP\s+JOIN/gi, 'GROUP BY') // Fix mangled GROUP JOIN
      .replace(/\bUNION\s+JOIN/gi, 'UNION ALL') // Fix mangled UNION JOIN
      // Fix specific badge query patterns
      .replace(/SELECT.*?badge.*?student.*?/i, 'SELECT b.icon, b.description FROM badges b JOIN student_badges sb ON b.id = sb.badge_id JOIN students s ON s.id = sb.student_id WHERE s.name ILIKE')
      .replace(/SELECT.*?student.*?badge.*?/i, 'SELECT b.icon, b.description FROM badges b JOIN student_badges sb ON b.id = sb.badge_id JOIN students s ON s.id = sb.student_id WHERE s.name ILIKE')
      // Fix specific halaqoh/group query patterns
      .replace(/SELECT.*?(?:halaqoh|kelompok|group).*?(?:guru|teacher).*?/i, 'SELECT s.id, s.name, s.gender, s.status, s.total_pages, s.registration_number, s.national_id, s.family_id, s.joined_date, s.notes, s.class_id, s.level_id, s.father_name, s.mother_name, s.wali_name, s.school_info, s.place_of_birth, s.date_of_birth, s.phone_number, s.last_achievement, g.name as group_name, g.description as group_description, t.name as teacher_name FROM students s JOIN group_students gs ON s.id = gs.student_id JOIN groups g ON gs.group_id = g.id JOIN teachers t ON g.teacher_id = t.id WHERE t.name ILIKE')
      .replace(/SELECT.*?(?:guru|teacher).*?(?:halaqoh|kelompok|group).*?/i, 'SELECT s.id, s.name, s.gender, s.status, s.total_pages, s.registration_number, s.national_id, s.family_id, s.joined_date, s.notes, s.class_id, s.level_id, s.father_name, s.mother_name, s.wali_name, s.school_info, s.place_of_birth, s.date_of_birth, s.phone_number, s.last_achievement, g.name as group_name, g.description as group_description, t.name as teacher_name FROM students s JOIN group_students gs ON s.id = gs.student_id JOIN groups g ON gs.group_id = g.id JOIN teachers t ON g.teacher_id = t.id WHERE t.name ILIKE')
      .replace(/SELECT.*?(?:halaqoh|kelompok|group).*?(?:name|nama).*?/i, 'SELECT s.id, s.name, s.gender, s.status, s.total_pages, s.registration_number, s.national_id, s.family_id, s.joined_date, s.notes, s.class_id, s.level_id, s.father_name, s.mother_name, s.wali_name, s.school_info, s.place_of_birth, s.date_of_birth, s.phone_number, s.last_achievement, g.name as group_name, g.description as group_description, t.name as teacher_name, COUNT(*) OVER() as total_students FROM students s JOIN group_students gs ON s.id = gs.student_id JOIN groups g ON gs.group_id = g.id JOIN teachers t ON g.teacher_id = t.id WHERE g.name ILIKE')
      .replace(/SELECT.*?(?:name|nama).*?(?:halaqoh|kelompok|group).*?/i, 'SELECT s.id, s.name, s.gender, s.status, s.total_pages, s.registration_number, s.national_id, s.family_id, s.joined_date, s.notes, s.class_id, s.level_id, s.father_name, s.mother_name, s.wali_name, s.school_info, s.place_of_birth, s.date_of_birth, s.phone_number, s.last_achievement, g.name as group_name, g.description as group_description, t.name as teacher_name, COUNT(*) OVER() as total_students FROM students s JOIN group_students gs ON s.id = gs.student_id JOIN groups g ON gs.group_id = g.id JOIN teachers t ON g.teacher_id = t.id WHERE g.name ILIKE')
      // Remove any remaining table aliases that might cause issues
      .replace(/\b[a-z]+\.[a-z]+\.[a-z]+\b/gi, '') // Remove nested table references
      .replace(/\b[a-z]+\.[a-z]+\b/gi, '') // Remove simple table references
      // Clean up any remaining issues
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
      .replace(/\s*=\s*/g, ' = ') // Normalize equals spacing
      .replace(/\s*LIKE\s*/gi, ' ILIKE ') // Normalize LIKE to ILIKE
      .replace(/\s*ILIKE\s*/gi, ' ILIKE ') // Normalize ILIKE spacing
      // Fix ILIKE patterns
      .replace(/ILIKE\s+'%([^%]+)'/gi, "ILIKE '%$1%'") // Add missing closing % in ILIKE patterns
      .replace(/ILIKE\s+'([^%]+)%'/gi, "ILIKE '%$1%'") // Add missing opening % in ILIKE patterns
      .replace(/ILIKE\s+'([^%]+)'/gi, "ILIKE '%$1%'"); // Add both % if missing in ILIKE patterns

    // Validate and fix the query using GPT
    const validationCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are an expert SQL query validator and fixer. Your task is to fix any malformed SQL queries and ensure they follow proper syntax.

Database Schema:
${DB_SCHEMA}

Guidelines:
1. Fix any malformed SQL queries
2. Ensure proper SELECT, FROM, WHERE, GROUP BY clauses
3. Fix any mangled keywords or statements
4. Remove any table aliases
5. Ensure proper UNION ALL syntax
6. Return only the fixed SQL query, no explanations
7. IMPORTANT: Do not add semicolons at the end of queries
8. For counting queries, always use COUNT(*) AS total
9. For grouping queries, always include GROUP BY
10. For complex queries, use UNION ALL to combine results
11. IMPORTANT: Always fully qualify column names with their table names to avoid ambiguity
12. For badge queries, ALWAYS use this exact format:
    SELECT b.icon, b.description 
    FROM badges b 
    JOIN student_badges sb ON b.id = sb.badge_id 
    JOIN students s ON s.id = sb.student_id 
    WHERE s.name ILIKE '%name%'
13. IMPORTANT: Always ensure ILIKE patterns have both opening and closing % symbols
14. For halaqoh/group queries by teacher name, ALWAYS use this exact format:
    SELECT 
      g.name as group_name,
      t.name as teacher_name,
      COUNT(*) OVER() as total_students,
      s.name as student_name,
      l.name as level_name
    FROM students s 
    JOIN group_students gs ON s.id = gs.student_id 
    JOIN groups g ON gs.group_id = g.id 
    JOIN teachers t ON g.teacher_id = t.id 
    JOIN levels l ON s.level_id = l.id
    WHERE t.name ILIKE '%teacher_name%'
    ORDER BY s.name
15. For halaqoh/group queries by group name, ALWAYS use this exact format:
    SELECT 
      g.name as group_name,
      t.name as teacher_name,
      COUNT(*) OVER() as total_students,
      s.name as student_name,
      l.name as level_name
    FROM students s 
    JOIN group_students gs ON s.id = gs.student_id 
    JOIN groups g ON gs.group_id = g.id 
    JOIN teachers t ON g.teacher_id = t.id 
    JOIN levels l ON s.level_id = l.id
    WHERE g.name ILIKE '%group_name%'
    ORDER BY s.name
16. IMPORTANT: For any query containing 'group', 'groups', 'halaqoh', 'kelompok', or similar terms, ALWAYS use the group query format and NEVER treat it as an activity_logs query
17. IMPORTANT: If the question contains any of these terms: 'group', 'groups', 'halaqoh', 'kelompok', 'list student on group', 'list santri di halaqoh', ALWAYS use the group query format regardless of other terms in the question
18. IMPORTANT: For group queries, ONLY select these columns:
    - g.name as group_name
    - t.name as teacher_name
    - COUNT(*) OVER() as total_students
    - s.name as student_name
    - l.name as level_name

Example Queries:
1. "lists student on group Asma" -> Use group query format with g.name ILIKE '%Asma%'
2. "List santri di halaqoh guru: Rina" -> Use group query format with t.name ILIKE '%Rina%'
3. "Badge list of student: John" -> Use badge query format with s.name ILIKE '%John%'`
        },
        {
          role: "user",
          content: `Please fix this malformed SQL query: ${cleanQuery}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const fixedQuery = validationCompletion.choices[0].message.content
      ?.trim()
      .replace(/;$/, ''); // Remove any trailing semicolon

    if (!fixedQuery) {
      throw new Error('Failed to fix SQL query');
    }

    // For group/halaqoh queries, force the exact query format we want
    if (/group|groups|halaqoh|kelompok|teacher|guru/i.test(question)) {
      // Extract group name or teacher name using more specific patterns
      const groupName = question.match(/(?:group|halaqoh|kelompok)[:\s]+(\w+)/i)?.[1] || 
                       question.match(/(?:from\s+group|from\s+halaqoh|from\s+kelompok)[:\s]+(\w+)/i)?.[1] ||
                       question.match(/(\w+)(?:\s+group|\s+halaqoh|\s+kelompok)/i)?.[1];
      
      const teacherName = question.match(/(?:teacher|guru)[:\s]+(\w+)/i)?.[1] ||
                         question.match(/(?:from\s+teacher|from\s+guru)[:\s]+(\w+)/i)?.[1] ||
                         question.match(/(\w+)(?:\s+teacher|\s+guru)/i)?.[1];
      
      if (groupName || teacherName) {
        const cleanedQuery = `SELECT 
          g.name as group_name,
          t.name as teacher_name,
          COUNT(*) OVER(PARTITION BY g.name) as total_students,
          s.name as student_name,
          l.name as level_name
        FROM students s 
        JOIN group_students gs ON s.id = gs.student_id 
        JOIN groups g ON gs.group_id = g.id 
        JOIN teachers t ON g.teacher_id = t.id 
        JOIN levels l ON s.level_id = l.id
        WHERE ${groupName ? `g.name ILIKE '%${groupName}%'` : `t.name ILIKE '%${teacherName}%'`}
        ORDER BY g.name, s.name`;
        
        // Execute the cleaned query on Supabase
        const { data, error } = await supabase.rpc('execute_sql', { query: cleanedQuery });
        
        if (error) {
          return NextResponse.json({
            error: 'Failed to execute SQL query',
            details: error.message,
            originalQuery: cleanQuery,
            fixedQuery: cleanedQuery
          }, { status: 500 });
        }

        // Get explanation from GPT
        const explanation = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-16k",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that explains student data analysis results in a clear and concise way.

For group/halaqoh/teacher queries, ALWAYS format the response exactly like this:
Halaqoh: [group_name]
Teacher: [teacher_name]
Total students: [total_students]
List:
1. [student_name], [level_name]
2. [student_name], [level_name]
...

If no students are found, respond with:
The list of students from teacher "[teacher_name]" is currently empty.

IMPORTANT: When the data contains multiple groups, format each group's students separately with their own header:
Halaqoh: [group_name]
Teacher: [teacher_name]
Total students: [total_students]
List:
1. [student_name], [level_name]
2. [student_name], [level_name]
...

Halaqoh: [next_group_name]
Teacher: [teacher_name]
Total students: [total_students]
List:
1. [student_name], [level_name]
2. [student_name], [level_name]
...`
            },
            {
              role: "user",
              content: `Question: "${question}"
Data: ${JSON.stringify(data)}

Please provide a clear and concise explanation of these results, focusing only on what was specifically asked in the question.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const explanationText = explanation.choices[0].message.content || '';

        // Save the chat history
        await supabase
          .from('chat_history')
          .insert({
            user_email: userEmail,
            question,
            sql_query: cleanedQuery,
            result: data,
            explanation: explanationText,
            created_at: new Date().toISOString()
          })
          .select();

        return NextResponse.json({
          data,
          explanation: explanationText,
          sqlQuery: cleanedQuery
        });
      }
    }

    // Add class name filtering for marhalah queries
    if (/marhalah|ibtidai|wustho|aly/i.test(question)) {
      const classId = question.match(/ibtidai/i) ? 'b7a0d756-125d-46e6-8cc1-aa2ac1c736bd' :
                     question.match(/wustho/i) ? 'bc0c439a-d9ef-44a4-8a88-bd840207b13d' :
                     question.match(/aly/i) ? 'dcad05e4-87e4-4186-b4e4-53c184c50d7b' : null;
      
      if (classId) {
        const cleanedQuery = `SELECT 
          s.name as student_name,
          c.name as class_name,
          stp.total_points,
          l.name as level_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN student_total_points stp ON s.id = stp.student_id
        JOIN levels l ON s.level_id = l.id
        WHERE s.class_id = '${classId}'
        ORDER BY stp.total_points DESC
        LIMIT 5`;
        
        // Execute the cleaned query on Supabase
        const { data, error } = await supabase.rpc('execute_sql', { query: cleanedQuery });
        
        if (error) {
          return NextResponse.json({
            error: 'Failed to execute SQL query',
            details: error.message,
            originalQuery: cleanQuery,
            fixedQuery: cleanedQuery
          }, { status: 500 });
        }

        // Get explanation from GPT
        const explanation = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-16k",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that explains student data analysis results in a clear and concise way.

For top students by points queries, ALWAYS format the response exactly like this:
Top 5 students in [class_name]:
1. [student_name], [level_name] - [total_points] points
2. [student_name], [level_name] - [total_points] points
3. [student_name], [level_name] - [total_points] points
4. [student_name], [level_name] - [total_points] points
5. [student_name], [level_name] - [total_points] points

If no students are found, respond with:
No students found in [class_name].`
            },
            {
              role: "user",
              content: `Question: "${question}"
Data: ${JSON.stringify(data)}

Please provide a clear and concise explanation of these results, focusing only on what was specifically asked in the question.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const explanationText = explanation.choices[0].message.content || '';

        // Save the chat history
        await supabase
          .from('chat_history')
          .insert({
            user_email: userEmail,
            question,
            sql_query: cleanedQuery,
            result: data,
            explanation: explanationText,
            created_at: new Date().toISOString()
          })
          .select();

        return NextResponse.json({
          data,
          explanation: explanationText,
          sqlQuery: cleanedQuery
        });
      }
    }

    // Block forbidden activity_logs queries with a friendly message
    if (/FROM\s+activity_logs/i.test(fixedQuery) && !/FROM\s+groups/i.test(fixedQuery) && !/FROM\s+group_students/i.test(fixedQuery) && !/group|groups|halaqoh|kelompok/i.test(question)) {
      const explanationText = 'Sorry, you do not have permission to view student activities.';
      // Save to chat history
      await supabase
        .from('chat_history')
        .insert({
          user_email: userEmail,
          question,
          sql_query: fixedQuery,
          result: null,
          explanation: explanationText,
          created_at: new Date().toISOString()
        })
        .select();
      return NextResponse.json({
        data: null,
        explanation: explanationText,
        sqlQuery: fixedQuery
      });
    }

    // Execute the fixed query on Supabase
    const { data, error } = await supabase.rpc('execute_sql', { query: fixedQuery });

    // Always save the query and result (or error) to chat history
    let explanationText: string = '';
    if (error) {
      console.error('SQL Execution Error:', error);
      explanationText = `Error: ${error.message}`;
      // Save the failed query and error to chat history
      await supabase
        .from('chat_history')
        .insert({
          user_email: userEmail,
          question,
          sql_query: fixedQuery,
          result: null,
          explanation: explanationText,
          created_at: new Date().toISOString()
        })
        .select();
      return NextResponse.json(
        {
          error: 'Failed to execute SQL query',
          details: error.message,
          originalQuery: cleanQuery,
          fixedQuery: fixedQuery
        },
        { status: 500 }
      );
    }

    // Get explanation from GPT
    const explanation = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that explains student data analysis results in a clear and concise way.

For group/halaqoh/teacher queries, ALWAYS format the response exactly like this:
Halaqoh: [group_name]
Teacher: [teacher_name]
Total students: [total_students]
List:
1. [student_name], [level_name]
2. [student_name], [level_name]
...

If no students are found, respond with:
The list of students from teacher "[teacher_name]" is currently empty.`
        },
        {
          role: "user",
          content: `Question: "${question}"
Data: ${JSON.stringify(data)}

Please provide a clear and concise explanation of these results, focusing only on what was specifically asked in the question.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    explanationText = explanation.choices[0].message.content || '';

    // Save the chat history
    await supabase
      .from('chat_history')
      .insert({
        user_email: userEmail,
        question,
        sql_query: fixedQuery,
        result: data,
        explanation: explanationText,
        created_at: new Date().toISOString()
      })
      .select();

    return NextResponse.json({
      data,
      explanation: explanationText,
      sqlQuery: fixedQuery
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process your question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}