"use client";

import { useState, useEffect, useRef } from "react";
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useStudentReportsStore } from '@/store/studentReportsStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SESSIONS = [
  { id: 1, name: 'SM1' },
  { id: 2, name: 'SM2' },
];
const PREDICATES = ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Basic 2", "100%"];

export default function StudentReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Section 1: Selectors
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const { 
    currentReport, 
    loadReport, 
    saveReport, 
    updateReport,
    getPrincipalName,
    getTeacherName,
    getParentName,
    getLevelName,
    getGroupName
  } = useStudentReportsStore();

  const [academicYear, setAcademicYear] = useState<string>('');
  const [sessionId, setSessionId] = useState<number>(2); // Fixed to SM2
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [levelName, setLevelName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');

  // Section 2: Student Info
  const student = students.find((s) => s.id === studentId);
  const classObj = classes.find((c) => c.id === classId);
  const academicYearObj = academicYears.find((y) => y.id === academicYear);
  const sessionObj = SESSIONS.find((s) => s.id === sessionId);

  // Section 3: Ziyadah
  const [ziyadah, setZiyadah] = useState({
    adab: { predicate: "", description: "" },
    murajaah: { predicate: "", description: "" },
    tahsin: { predicate: "", description: "" },
    target: { predicate: "", description: "" },
  });

  // Section 4: Catatan Tahfidz
  const [tahfidzNotes, setTahfidzNotes] = useState("");

  // Section 5: Score
  const [scores, setScores] = useState([
    { name: "Tahfizh", value: "", predicate: "" },
  ]);

  // Section 6: Attendance
  const [attendance, setAttendance] = useState({ present: 0, permit: 0, absence: 0 });

  // Section 7: Signatures
  const [signatures, setSignatures] = useState({
    place: "",
    date: new Date().toISOString().slice(0, 10),
    parent: "",
    principal: "",
    teacher: "",
  });

  useEffect(() => {
    loadAcademicYears();
    loadClasses();
    loadStudents();
  }, [loadAcademicYears, loadClasses, loadStudents]);

  // Set active academic year on load
  useEffect(() => {
    const activeYear = academicYears.find(y => y.status);
    if (activeYear) {
      setAcademicYear(activeYear.id);
    }
  }, [academicYears]);

  // Load report when academic year, session, or student changes
  useEffect(() => {
    if (academicYear && sessionId && studentId) {
      loadReport(academicYear, sessionId, studentId);
    }
  }, [academicYear, sessionId, studentId, loadReport]);

  // Load additional data when student changes
  useEffect(() => {
    const loadAdditionalData = async () => {
      if (studentId) {
        const [levelName, groupName, teacherName] = await Promise.all([
          getLevelName(student?.level_id || ''),
          getGroupName(studentId),
          getTeacherName(studentId)
        ]);

        setLevelName(levelName);
        setGroupName(groupName);
        setTeacherName(teacherName);
      }
    };

    loadAdditionalData();
  }, [studentId, student?.level_id, getLevelName, getGroupName, getTeacherName]);

  // Load signature data when student changes
  useEffect(() => {
    const loadSignatureData = async () => {
      if (studentId) {
        const [principalName, teacherName, parentName] = await Promise.all([
          getPrincipalName(),
          getTeacherName(studentId),
          getParentName(studentId)
        ]);

        setSignatures(prev => ({
          ...prev,
          principal: principalName,
          teacher: teacherName,
          parent: parentName
        }));
      }
    };

    loadSignatureData();
  }, [studentId, getPrincipalName, getTeacherName, getParentName]);

  // Update form when report is loaded
  useEffect(() => {
    if (currentReport) {
      setZiyadah(currentReport.meta_values.ziyadah);
      setTahfidzNotes(currentReport.meta_values.notes);
      setScores(currentReport.meta_values.score);
      setAttendance(currentReport.meta_values.attendance);
      setSignatures(currentReport.meta_values.signatures);
    } else {
      // Reset form when no report is found
      setZiyadah({
        adab: { predicate: "", description: "" },
        murajaah: { predicate: "", description: "" },
        tahsin: { predicate: "", description: "" },
        target: { predicate: "", description: "" },
      });
      setTahfidzNotes("");
      setScores([{ name: "Tahfizh", value: "", predicate: "" }]);
      setAttendance({ present: 0, permit: 0, absence: 0 });
      setSignatures(prev => ({
        ...prev,
        place: "",
        date: new Date().toISOString().slice(0, 10),
      }));
    }
  }, [currentReport]);

  // Filter classes by academic year if needed (if classes have academicYearId)
  const filteredClasses = classes; // adjust if you have academicYearId
  const filteredStudents = students.filter((s) => !classId || s.class_id === classId);

  // Save/Update handler
  const handleSave = async () => {
    const reportData = {
      academic_year_id: academicYear,
      student_id: studentId,
      session_id: sessionId,
      meta_values: {
        ziyadah,
        score: scores,
        attendance,
        notes: tahfidzNotes,
        signatures,
      },
    };

    let result;
    if (currentReport) {
      result = await updateReport({ ...reportData, id: currentReport.id, status: currentReport.status });
    } else {
      result = await saveReport(reportData);
    }

    if (!result.error) {
      alert(currentReport ? "Report updated successfully!" : "Report saved successfully!");
      // Reload the report to get the latest data
      loadReport(academicYear, sessionId, studentId);
    } else {
      alert("Error saving report. Please try again.");
    }
  };

  // Handlers for dynamic fields
  const handleZiyadahChange = (aspect: string, field: string, value: string) => {
    setZiyadah((prev) => ({ ...prev, [aspect]: { ...prev[aspect as keyof typeof prev], [field]: value } }));
  };
  const handleScoreChange = (idx: number, field: string, value: string) => {
    setScores((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const addScore = () => setScores((prev) => [...prev, { name: "", value: "", predicate: "" }]);
  const removeScore = (idx: number) => setScores((prev) => prev.filter((_, i) => i !== idx));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!reportRef.current) return;

    // A4 size
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    let y = 15;

    // --- Custom Header ---
    // Logo (placeholder, add base64 if available)
    // doc.addImage('logo_base64', 'PNG', 15, y, 25, 25); // Uncomment and set logo_base64 if available
    // School Info
    doc.setFontSize(14);
    doc.setTextColor(80, 90, 110);
    doc.setFont('helvetica', 'bold');
    doc.text('Yayasan Miftahul Khoir Al Islamy', 60, y + 5);
    doc.setFontSize(18);
    doc.text('PPTQ MIFTAHUL KHOIR', 60, y + 13);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Kp Pasirjaya, Sukajaya, Purbatu, Tasikmalaya', 60, y + 20);
    // Double line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.line(15, y + 27, 195, y + 27);
    doc.setLineWidth(0.5);
    doc.line(15, y + 29, 195, y + 29);
    y += 35;
    // Arabic & Indonesian Title
    doc.setFontSize(14);
    // Use a font that supports Arabic if available
    // If you have a base64 font, you can add it to jsPDF and use it here
    // For now, use default font and hope system font supports Arabic
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 90, 110);
    doc.text('تقرير نتائج الامتحان النهائي في تحسين القرآن وتحفيظه', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(13);
    doc.text('LAPORAN PENILAIAN UJIAN AKHIR SEMESTER TAHSIN DAN TAHFIDZ AL-QUR\'AN', 105, y, { align: 'center' });
    y += 10;

    // --- Student Info Table (3 rows x 2 columns, but Class and Level combined, Level replaced with Session) ---
    const infoRows = [
      [
        `Nama: ${student?.name || ''}`,
        `Kelas: ${classObj?.name || ''} / Sesi: ${sessionObj?.name || ''}`
      ],
      [
        `Group: ${groupName}`,
        `Tahun Akademik: ${academicYearObj?.name || ''}`
      ],
      [
        `Guru: ${teacherName}`,
        ''
      ]
    ];
    autoTable(doc, {
      startY: y,
      head: [],
      body: infoRows,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 2 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Ziyadah Table ---
    const ziyadahData = Object.entries(ziyadah).map(([aspect, val]) => [
      aspect,
      val.predicate,
      val.description
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Aspek', 'Predikat', 'Deskripsi']],
      body: ziyadahData,
      styles: { fontSize: 11 },
      margin: { left: 25, right: 25 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Scores Table ---
    const scoresData = scores.map(score => [
      score.name,
      score.value,
      score.predicate
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Mata Pelajaran', 'Nilai', 'Predikat']],
      body: scoresData,
      styles: { fontSize: 11 },
      margin: { left: 25, right: 25 },
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Attendance and Notes as side-by-side tables ---
    // Attendance Table
    const attendanceTable = [
      ['Hadir', attendance.present],
      ['Izin', attendance.permit],
      ['Alpa', attendance.absence],
    ];
    // Notes Table
    const notesTable = [
      ['Catatan', tahfidzNotes || '-']
    ];
    autoTable(doc, {
      startY: y,
      head: [['Kehadiran', 'Jumlah']],
      body: attendanceTable,
      styles: { fontSize: 11 },
      margin: { left: 25, right: 120 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    autoTable(doc, {
      startY: y,
      head: [['Catatan', '']],
      body: notesTable,
      styles: { fontSize: 11 },
      margin: { left: 120, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = Math.max((doc as any).lastAutoTable.finalY, y + 25) + 10;

    // --- Signatures ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const sigY = y + 10;
    doc.text('Orang Tua', 35, sigY);
    doc.text('Direktur PPTQ', 95, sigY);
    doc.text('Muhafidz', 155, sigY);
    doc.text(`( ${signatures.parent || '.............'} )`, 30, sigY + 25);
    doc.text(`( ${signatures.principal || '.............'} )`, 90, sigY + 25);
    doc.text(`( ${signatures.teacher || '.............'} )`, 150, sigY + 25);
    // Place and Date
    doc.text(`Tempat: ${signatures.place || ''}`, 25, sigY + 40);
    doc.text(`Tanggal: ${signatures.date || ''}`, 80, sigY + 40);

    doc.save('student-report.pdf');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-8">
      {/* Print and screen header, always visible */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            margin-bottom: 24px;
          }
          .print-header .header-title-arabic {
            font-family: serif;
            font-size: 1.1rem;
            text-align: center;
            margin-top: 8px;
          }
          .print-header .header-title-id {
            font-weight: bold;
            font-size: 1.1rem;
            text-align: center;
            margin-top: 4px;
          }
          .print-header .header-lines {
            border-top: 3px solid #222;
            border-bottom: 1.5px solid #222;
            margin: 12px 0 16px 0;
          }
        }
      `}</style>
      <div className="print-header" style={{ display: 'block', marginBottom: 24 }}>
        <div className="flex items-center justify-between">
          {/* Logo placeholder, replace src with your logo if available */}
          <img src="/logo.png" alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
          <div className="flex-1 text-center">
            <div className="font-bold text-lg md:text-xl" style={{ color: '#50606e' }}>Yayasan Miftahul Khoir Al Islamy</div>
            <div className="font-bold text-2xl md:text-3xl" style={{ color: '#50606e' }}>PPTQ MIFTAHUL KHOIR</div>
            <div className="text-base md:text-lg" style={{ color: '#50606e' }}>Kp Pasirjaya, Sukajaya, Purbatu, Tasikmalaya</div>
          </div>
          <div style={{ width: 70 }} />
        </div>
        <div className="header-lines" style={{ borderTop: '3px solid #222', borderBottom: '1.5px solid #222', margin: '12px 0 16px 0' }} />
        <div className="header-title-arabic" style={{ fontFamily: 'serif', fontSize: '1.1rem', textAlign: 'center', marginTop: 8 }}>
          تقرير نتائج الامتحان النهائي في تحسين القرآن وتحفيظه
        </div>
        <div className="header-title-id" style={{ fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', marginTop: 4 }}>
          LAPORAN PENILAIAN UJIAN AKHIR SEMESTER TAHSIN DAN TAHFIDZ AL-QUR'AN
        </div>
      </div>

      {/* Add print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          input, select, textarea {
            border: none !important;
            background: none !important;
            -webkit-appearance: none;
            appearance: none;
          }
          .bg-white {
            background: white !important;
          }
          .shadow {
            box-shadow: none !important;
          }
        }
      `}</style>

      <h1 className="text-2xl md:text-3xl font-bold mb-4 no-print">Student Report</h1>
      
      {/* Section 1: Selectors */}
      <div className="bg-white rounded shadow p-4 flex flex-col md:flex-row gap-4 items-start md:items-center flex-wrap no-print">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Academic Year</label>
          <select 
            value={academicYear} 
            onChange={e => setAcademicYear(e.target.value)} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
            disabled
          >
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>
                {y.name} {y.status ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Session</label>
          <select 
            value={sessionId} 
            onChange={e => setSessionId(Number(e.target.value))} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
            disabled
          >
            {SESSIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Class</label>
          <select 
            value={classId} 
            onChange={e => setClassId(e.target.value)} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
          >
            <option value="">Select</option>
            {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium">Student</label>
          <select 
            value={studentId} 
            onChange={e => setStudentId(e.target.value)} 
            className="mt-1 block w-full md:w-auto border rounded px-2 py-1"
          >
            <option value="">Select</option>
            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button 
          onClick={handleSave} 
          className="w-full md:w-auto ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!academicYear || !studentId}
        >
          {currentReport ? 'Update' : 'Save'}
        </button>
      </div>

      {/* Section 2: Student Info */}
      <div ref={reportRef} className="bg-white rounded shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><span className="font-semibold">Name:</span> {student?.name}</div>
          <div><span className="font-semibold">Class:</span> {classObj?.name}</div>
          <div><span className="font-semibold">Level:</span> {levelName}</div>
          <div><span className="font-semibold">Group:</span> {groupName}</div>
          <div><span className="font-semibold">Teacher:</span> {teacherName}</div>
          <div><span className="font-semibold">Session:</span> {sessionObj?.name}</div>
          <div><span className="font-semibold">Academic Year:</span> {academicYearObj?.name}</div>
        </div>
      </div>

      {/* Section 3 & 4: Ziyadah & Catatan Tahfidz */}
      <div className="flex gap-8">
        {/* Ziyadah Table */}
        <div className="flex-1 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Evaluasi Ziyadah</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Aspek</th>
                <th className="border px-2 py-1">Predikat</th>
                <th className="border px-2 py-1">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ziyadah).map(([aspect, val]) => (
                <tr key={aspect}>
                  <td className="border px-2 py-1 capitalize">{aspect}</td>
                  <td className="border px-2 py-1 no-print">
                    <select value={val.predicate} onChange={e => handleZiyadahChange(aspect, "predicate", e.target.value)} className="border rounded px-1">
                      <option value="">-</option>
                      {PREDICATES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="border px-2 py-1 no-print">
                    <input value={val.description} onChange={e => handleZiyadahChange(aspect, "description", e.target.value)} className="border rounded px-1 w-full" />
                  </td>
                  <td className="border px-2 py-1 print-only">{val.predicate}</td>
                  <td className="border px-2 py-1 print-only">{val.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Catatan Tahfidz */}
        <div className="flex-1 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Catatan Tahfidz</h2>
          <textarea value={tahfidzNotes} onChange={e => setTahfidzNotes(e.target.value)} className="w-full border rounded min-h-[120px]" />
        </div>
      </div>

      {/* Section 5 & 6: Score & Attendance */}
      <div className="flex gap-8">
        {/* Score Repeater */}
        <div className="flex-1 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Score</h2>
          {scores.map((score, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <input value={score.name} onChange={e => handleScoreChange(idx, "name", e.target.value)} placeholder="Name" className="border rounded px-1" />
              <input value={score.value} onChange={e => handleScoreChange(idx, "value", e.target.value)} placeholder="Value" className="border rounded px-1 w-16" />
              <select value={score.predicate} onChange={e => handleScoreChange(idx, "predicate", e.target.value)} className="border rounded px-1">
                <option value="">-</option>
                {PREDICATES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => removeScore(idx)} className="text-red-500">Remove</button>
            </div>
          ))}
          <button onClick={addScore} className="mt-2 bg-green-500 text-white px-2 py-1 rounded">Add Score</button>
        </div>
        {/* Attendance Table */}
        <div className="flex-1 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Attendance</h2>
          <table className="w-full border">
            <tbody>
              <tr>
                <td className="border px-2 py-1">Present</td>
                <td className="border px-2 py-1"><input type="number" value={attendance.present} onChange={e => setAttendance(a => ({ ...a, present: +e.target.value }))} className="border rounded px-1 w-16" /></td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Permit</td>
                <td className="border px-2 py-1"><input type="number" value={attendance.permit} onChange={e => setAttendance(a => ({ ...a, permit: +e.target.value }))} className="border rounded px-1 w-16" /></td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Absence</td>
                <td className="border px-2 py-1"><input type="number" value={attendance.absence} onChange={e => setAttendance(a => ({ ...a, absence: +e.target.value }))} className="border rounded px-1 w-16" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 7: Signatures */}
      <div className="bg-white rounded shadow p-4 grid grid-cols-3 gap-8 items-end">
        {/* Left: Parent */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Orang Tua</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.parent || '.............'} )</div>
        </div>
        {/* Center: Principal */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Direktur PPTQ</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.principal || '.............'} )</div>
        </div>
        {/* Right: Teacher */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Muhafidz</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.teacher || '.............'} )</div>
        </div>
      </div>

      {/* Place and Date */}
      <div className="bg-white rounded shadow p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="font-medium">Place:</label>
          <input
            type="text"
            value={signatures.place}
            onChange={(e) => setSignatures(prev => ({ ...prev, place: e.target.value }))}
            className="border rounded px-2 py-1"
            placeholder="Enter place"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="font-medium">Date:</label>
          <input
            type="date"
            value={signatures.date}
            onChange={(e) => setSignatures(prev => ({ ...prev, date: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* View | Download | Print */}
      <div className="flex justify-end gap-4 mt-4 no-print">
        <button onClick={handleDownload} className="text-blue-600 hover:underline">Download</button>
        <button onClick={handlePrint} className="text-blue-600 hover:underline">Print</button>
      </div>
    </div>
  );
} 