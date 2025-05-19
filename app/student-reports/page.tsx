"use client";

import { useState, useEffect, useRef } from "react";
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useStudentReportsStore } from '@/store/studentReportsStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SESSIONS = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
];
const PREDICATES = ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Dhoif", "100%"];

// Helper to load image as base64 at runtime
function getBase64FromUrl(url: string): Promise<string> {
  return fetch(url)
    .then(response => response.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

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

  // Student search filter
  const [studentSearch, setStudentSearch] = useState('');
  const filteredStudents = students.filter((s) =>
    (!classId || s.class_id === classId) &&
    (!studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase()))
  );

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

  // --- Overall Score Calculation for UI/Print ---
  const numericScores = scores
    .map(s => parseFloat(s.value))
    .filter(v => !isNaN(v));
  let overallScore = 0;
  let overallPredicate = '-';
  if (numericScores.length > 0) {
    overallScore = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
    if (overallScore > 90) overallPredicate = 'Mumtaz';
    else if (overallScore >= 85 && overallScore <= 90) overallPredicate = 'Jayyid Jiddan';
    else if (overallScore >= 66 && overallScore < 85) overallPredicate = 'Jayyid';
    else if (overallScore >= 50 && overallScore < 66) overallPredicate = 'Dhoif';
    else if (overallScore < 50) overallPredicate = 'Nafis';
  }

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
      setScores([{ name: "Materi Ujian", value: "", predicate: "" }]);
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

  const handleDownload = async () => {
    if (!reportRef.current) return;

    // Get logo and arabic title as base64 at runtime
    const logoBase64 = await getBase64FromUrl('/images/pptq-logo.png');
    const arabicBase64 = await getBase64FromUrl('/images/arabicword.png');

    // --- Capitalize First Letter ---
    const capitalizeFirst = (text: string) => {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1);
    };

    // --- Snake Case Helper ---
    const toSnakeCase = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    // A4 size
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    let y = 15;

    // --- Custom Header ---
    doc.addImage(logoBase64, 'PNG', 20, y, 22, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(60, 70, 90);
    doc.text('Yayasan Miftahul Khoir Al Islamy', 55, y + 7);
    doc.setFontSize(16);
    doc.text('Pondok Pesantren Tahfizh Al Qur\'an Miftahul Khoir', 55, y + 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Jalan KH. Tubagus Abdullah, Kp. Pasirjaya, Sukajaya, Purbaratu, Kota Tasikmalaya, 46196', 55, y + 23);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.line(20, y + 28, 190, y + 28);
    doc.setLineWidth(0.5);
    doc.line(20, y + 30, 190, y + 30);
    y += 31;

    // --- Arabic & Indonesian Title as image ---
    doc.addImage(arabicBase64, 'PNG', 55, y, 100, 10); // adjust width/height as needed
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(60, 70, 90);
    doc.text('RAPOT HASIL BELAJAR TAHFIDZ AL-QUR\'AN', 105, y, { align: 'center' });
    y += 10;

    // --- Student Info Table as 3 rows, 5 columns ---
    const infoRows = [
      ['Nama:', student?.name || '', '', 'Muhafidz:', teacherName],
      ['Kelas:', classObj?.name || '', '', 'Semester:', sessionObj?.name || ''],
      ['Halaqoh:', groupName, '', 'Tahun Akademik:', academicYearObj?.name || '']
    ];
    autoTable(doc, {
      startY: y,
      head: [],
      body: infoRows,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 11, cellPadding: 0, halign: 'left', lineWidth: 0 },
      columnStyles: {
        0: { cellWidth: 20, minCellHeight: 5, fontStyle: 'bold', textColor: [60, 70, 90], halign: 'left' },
        1: { cellWidth: 50, minCellHeight: 5, fontStyle: 'normal', textColor: [60, 70, 90], halign: 'left' },
        2: { cellWidth: 1, minCellHeight: 5 },
        3: { cellWidth: 40, minCellHeight: 5, fontStyle: 'bold', textColor: [60, 70, 90], halign: 'left' },
        4: { cellWidth: 50, minCellHeight: 5, fontStyle: 'normal', textColor: [60, 70, 90], halign: 'left' },
      },
      margin: { left: 25, right: 25 },
      tableLineColor: [255, 255, 255],
      tableLineWidth: 0,
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Ziyadah Table ---
    const ziyadahData = Object.entries(ziyadah).map(([aspect, val]) => [
      capitalizeFirst(aspect),
      val.predicate,
      val.description
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Aspek', 'Predikat', 'Deskripsi']],
      body: ziyadahData,
      styles: { font: 'helvetica', fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    const scoresData = scores.map(score => [
      capitalizeFirst(score.name),
      score.value,
      score.predicate
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Materi Ujian', 'Nilai', 'Predikat']],
      body: scoresData,
      styles: { font: 'helvetica', fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Overall Score Row (UI/Print) ---
    autoTable(doc, {
      startY: y,
      head: [['Nilai Akhir', 'Predikat']],
      body: [[overallScore ? overallScore.toFixed(2) : '-', overallPredicate]],
      styles: { font: 'helvetica', fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    // --- Attendance and Notes as side-by-side tables ---
    // Attendance Table
    const attendanceTable = [
      ['Hadir', attendance.present],
      ['Izin', attendance.permit],
      ['Alpa', attendance.absence],
    ];
    autoTable(doc, {
      startY: y,
      head: [['Kehadiran', 'Jumlah']],
      body: attendanceTable,
      styles: { font: 'helvetica', fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 140 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    // Notes Table (single, not double)
    const notesTable = [
      [tahfidzNotes || '-']
    ];
    autoTable(doc, {
      startY: y,
      head: [['Catatan', '']],
      body: notesTable,
      styles: { font: 'helvetica', fontSize: 11, halign: 'left' },
      headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 80, right: 25 },
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = Math.max((doc as any).lastAutoTable.finalY, y + 25) + 10;

    // --- Place and Date above signatures ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    // Fixed date: 23 June 2025
    const fixedDate = '23 June 2025 / 27 Dzulhijjah 1446 H';
    doc.text(`${signatures.place || ''}, ${fixedDate}`, 105, y, { align: 'center' });
    y += 2;

    // --- Signatures ---
    const sigY = y + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 70, 90);
    doc.text('Orang Tua', 40, sigY);
    doc.text('Direktur PPTQ', 105, sigY, { align: 'center' });
    doc.text('Muhafidz', 170, sigY, { align: 'right' });
    doc.setFontSize(11);
    doc.text(`( ${signatures.parent || '..........................'} )`, 40, sigY + 25);
    doc.text(`( ${signatures.principal || '..........................'} )`, 105, sigY + 25, { align: 'center' });
    doc.text(`( ${signatures.teacher || '..........................'} )`, 190, sigY + 25, { align: 'right' });

    // Build file name (UPPERCASE)
    const studentNameSnake = toSnakeCase(student?.name || 'student').toUpperCase();
    const sessionName = (sessionObj?.name || 'session').toUpperCase();
    const academicYearName = (academicYearObj?.name || '').replace(/\//g, '').replace(/\s+/g, '').toUpperCase();
    const fileName = `${studentNameSnake}-${sessionName}-${academicYearName}.pdf`;
    doc.save(fileName);
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
          <img src="/images/pptq-logo.png" alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} />
          <div className="flex-1 text-center">
            <div className="font-bold text-lg md:text-xl" style={{ color: '#50606e' }}>Yayasan Miftahul Khoir Al Islamy</div>
            <div className="font-bold text-2xl md:text-3xl" style={{ color: '#50606e' }}>PPTQ MIFTAHUL KHOIR</div>
            <div className="text-base md:text-lg" style={{ color: '#50606e' }}>Kp. Pasirjaya, Sukajaya, Purbaratu, Kota Tasikmalaya, 46196</div>
          </div>
          <div style={{ width: 70 }} />
        </div>
        <div className="header-lines" style={{ borderTop: '3px solid #222', borderBottom: '1.5px solid #222', margin: '12px 0 16px 0' }} />
        <div className="header-title-arabic" style={{ fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif', fontSize: '1.1rem', textAlign: 'center', marginTop: 8, direction: 'rtl' }}>
          تقرير نتائج الامتحان النهائي في تحسين القرآن وتحفيظه
        </div>
        <div className="header-title-id" style={{ fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center', marginTop: 4 }}>
          LAPORAN PENILAIAN UJIAN AKHIR SEMESTER TAHFIDZ DAN TAHSIN AL-QUR'AN
        </div>
      </div>

      {/* Add print styles */}
      <style jsx global>{`
        .print-only {
          display: none;
        }

        @media print {
          nav, footer, .no-print {
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
          <input
            type="text"
            placeholder="Search student by name..."
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            className="mb-2 w-full border rounded px-2 py-1"
          />
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
          <div><span className="font-semibold">Nama:</span> {student?.name}</div>
          <div><span className="font-semibold">Marhalah:</span> {classObj?.name}{levelName ? ` / ${levelName}` : ''}</div>
          <div><span className="font-semibold">Halaqoh:</span> {groupName}</div>
          <div><span className="font-semibold">Muhafidz/ah:</span> {teacherName}</div>
          <div><span className="font-semibold">Semester:</span> {sessionObj?.name}</div>
          <div><span className="font-semibold">Tahun Akademik:</span> {academicYearObj?.name}</div>
        </div>
      </div>

      {/* Section 3 & 4: Ziyadah & Catatan Tahfidz */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Ziyadah Table */}
        <div className="flex-1 bg-white rounded shadow p-4 w-full">
          <h2 className="font-semibold mb-2">Evaluasi Tahfidz dan Tahsin</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Aspek</th>
                <th className="border px-2 py-1">Predikat</th>
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
                    <input value={val.description} onChange={e => handleZiyadahChange(aspect, "description", e.target.value)} className="border rounded px-1 w-full min-h-[40px]" />
                  </td>
                  <td className="border px-2 py-1 print-only">{val.predicate}</td>
                  <td className="border px-2 py-1 print-only">{val.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Catatan Tahfidz */}
        <div className="flex-1 bg-white rounded shadow p-4 w-full">
          <h2 className="font-semibold mb-2">Catatan Tahfidz</h2>
          <textarea value={tahfidzNotes} onChange={e => setTahfidzNotes(e.target.value)} className="w-full border rounded min-h-[150px]" />
        </div>
      </div>

      {/* Section 5 & 6: Score & Attendance */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Score Repeater */}
        <div className="flex-1 bg-white rounded shadow p-4 w-full min-w-0">
          <h2 className="font-semibold mb-2">Score</h2>
          {scores.map((score, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2 items-stretch w-full">
              <input value={score.name} onChange={e => handleScoreChange(idx, "name", e.target.value)} placeholder="Name" className="border rounded px-1 w-full sm:w-32" />
              <input value={score.value} onChange={e => handleScoreChange(idx, "value", e.target.value)} placeholder="Value" className="border rounded px-1 w-full sm:w-16" />
              <select value={score.predicate} onChange={e => handleScoreChange(idx, "predicate", e.target.value)} className="border rounded px-1 w-full sm:w-32">
                <option value="">-</option>
                {PREDICATES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => removeScore(idx)} className="text-red-500 no-print w-full sm:w-auto">Remove</button>
            </div>
          ))}
          <button onClick={addScore} className="mt-2 bg-green-500 text-white px-2 py-1 rounded no-print w-full sm:w-auto">Add Score</button>

          {/* Overall Score Row (UI/Print) */}
          <div className="bg-white rounded shadow p-4 flex flex-col md:flex-row gap-4 items-center mb-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="font-semibold">Overall Score:</div>
            <div className="ml-2">{numericScores.length > 0 ? overallScore.toFixed(2) : '-'}</div>
            <div className="ml-4 font-semibold">Predicate:</div>
            <div className="ml-2">{overallPredicate}</div>
          </div>
        </div>
        {/* Attendance Table */}
        <div className="flex-1 bg-white rounded shadow p-4 w-full min-w-0">
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
      {/* Place and Date above signature names (UI/Print) */}
      <div className="bg-white rounded shadow p-4 flex flex-col items-center mb-2">
        <div className="flex items-center gap-4 mb-2">
          <span className="font-medium">{signatures.place}, 23 June 2025 / 27 Dzulhijjah 1446 H</span>
        </div>
      </div>
      <div className="bg-white rounded shadow p-4 grid grid-cols-3 gap-8 items-end">
        {/* Left: Parent */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Orang Tua</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.parent || '..........................'} )</div>
        </div>
        {/* Center: Principal */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Direktur PPTQ</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.principal || '..........................'} )</div>
        </div>
        {/* Right: Teacher */}
        <div className="flex flex-col items-center">
          <div className="font-semibold">Muhafidz</div>
          <div className="h-8" />
          <div className="mt-8 mb-2">( {signatures.teacher || '..........................'} )</div>
        </div>
      </div>

      {/* View | Download | Print */}
      <div className="flex justify-end gap-4 mt-4 no-print">
        <button onClick={handleDownload} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Download</button>
      </div>
    </div>
  );
} 