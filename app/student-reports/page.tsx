"use client";

import { useState, useEffect, useRef } from "react";
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useStudentReportsStore } from '@/store/studentReportsStore';
import { useAuthStore } from '@/store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const SESSIONS = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
];
const PREDICATES = ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Dhoif", "100%", "75%", "50%", "25%", "0%"];

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

// Ziyadah predicate to description mapping
const ZIYADAH_DESCRIPTIONS: Record<string, string> = {
  'Mumtaz': 'Sempurna! Pertahankan dan semoga Istiqomah',
  'Jayyid Jiddan': 'Baik Sekali! Pertahankan',
  'Jayyid': 'Baik! Tingkatkan dengan lebih baik',
  'Dhoif': 'Kurang Baik! Segera Perbaiki Ya.',
  '100%': 'Target Tercapai!',
  '75%': 'Sudah Baik! Tingkatan lagi',
  '50%': 'Perlu di Tingkatan lagi.',
  '25%': 'Jangan patah semangat!',
  '0%': 'Harus diperbaik!'
};

const SCORE_NAMES = [
  'PILIH MATERI',
  'CUSTOM',
  'IQ-0 HIJAIYAH, TAHSIN DASAR',
  'ITQON 1 ANNAAS - AL A\'LA',
  'ITQON 2 AT THORIQ  - AN-NABA',
  'ITQON 3 AL MURSALAT - AL JINN',
  'ITQON 4 NUH - AL MULK',
  'ITQON 5 AT TAHRIM - AS SHAFF',
  'ITQON 6 AL MUMTAHANAH - AL MUJADALAH',
  'ITQON 7 AL FATIHAH - AL BAQARAH 141',
  'IQ-1.1 ANNAAS  - AL BAYYINAH',
  'IQ-1.2 AL QODR - AL A\'LA',
  'IQ-2.1 AT THORIQ  - AL INFITAAR',
  'IQ-2.2 AT TAKWIR  - AN-NABA',
  'IQ-3.1 AL MURSALAT  - AL QIYAMAH',
  'IQ-3.2 AL MUDATSIR - AL JINN',
  'IQ-4.1 NUH  - AL HAQQOH',
  'IQ-4.2 AL QOLAM - AL MULK',
  'IQ-5.1 AT TAHRIM  - AT TAGOOBUN',
  'IQ-5.2 AL MUNAFIQUN - ASH-SHAFF',
  'IQ-6.1 AL MUMTAHANAH  - AL HASYR AYAT 9',
  'IQ-6.2 AL HASYR 10 - AL MUJADALAH',
  'IQ-7.1 AL FATIHAH  - AL BAQARAH 76',
  'IQ-7.2 AL BAQARAH 77 - AL BAQARAH 141',
];

const PREDICATES_MAIN = ["Mumtaz", "Jayyid Jiddan", "Jayyid", "Dhoif", "Nafis"];

export default function StudentReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Section 1: Selectors
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const groups = useSchoolStore((state) => state.groups);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const { user } = useAuthStore();
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
  const [teacherId, setTeacherId] = useState<string>('');

  const [academicYear, setAcademicYear] = useState<string>('');
  const [sessionId, setSessionId] = useState<number>(2); // Fixed to SM2
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [levelName, setLevelName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

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
    { name: "PILIH MATERI", tahfidz_score: "", tahsin_score: "", customName: "" }
  ]);

  // Section 6: Attendance
  const [attendance, setAttendance] = useState({ present: 90, permit: 0, absence: 0 });

  // Section 7: Signatures
  const [signatures, setSignatures] = useState({
    place: "",
    date: new Date().toISOString().slice(0, 10),
    parent: "",
    principal: "",
    teacher: "",
  });

  // Add ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        calculateCompletionProgress();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch teacher ID when user changes
  useEffect(() => {
    const fetchTeacherId = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.email)
          .single();
        
        if (data && !error) {
          console.log('Found teacher ID:', data.id);
          setTeacherId(data.id);
        } else {
          console.error('Error fetching teacher ID:', error);
        }
      }
    };

    fetchTeacherId();
  }, [user?.email]);

  // Student search filter
  const filteredStudents = students.filter((s) => {
    // If user is a teacher, only show their students
    if (user?.role === 'teacher') {
      // Get all groups for this teacher using the correct teacher ID
      const teacherGroups = groups.filter(g => g.teacherId === teacherId);
      
      // If no groups found for this teacher, show no students
      if (teacherGroups.length === 0) {
        return false;
      }

      // Get all student IDs from the teacher's groups
      const teacherStudentIds = teacherGroups.flatMap(g => g.students || []);
      
      // If class is selected, only show students from that class
      if (classId) {
        return s.class_id === classId && teacherStudentIds.includes(s.id);
      }
      
      // If no class selected, show all students from teacher's groups
      return teacherStudentIds.includes(s.id);
    }
    
    // For non-teachers (admin), just filter by class if selected
    return !classId || s.class_id === classId;
  });

  const studentOptions = filteredStudents.map(student => ({
    value: student.id,
    label: student.name
  }));

  // Section 2: Student Info
  const student = students.find((s) => s.id === studentId);
  const classObj = classes.find((c) => c.id === classId);
  const academicYearObj = academicYears.find((y) => y.id === academicYear);
  const sessionObj = SESSIONS.find((s) => s.id === sessionId);

  // Load initial data
  useEffect(() => {
    loadAcademicYears();
    loadClasses();
    loadStudents();
  }, [loadAcademicYears, loadClasses, loadStudents]);

  // Load groups when academic year changes
  useEffect(() => {
    if (academicYear) {
      loadGroups(academicYear);
    }
  }, [academicYear, loadGroups]);

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
      // Force completion calculation after loading data
      setTimeout(() => {
        setIsEditing(false);
        calculateCompletionProgress();
      }, 0);
    } else {
      // Reset form when no report is found
      setZiyadah({
        adab: { predicate: "", description: "" },
        murajaah: { predicate: "", description: "" },
        tahsin: { predicate: "", description: "" },
        target: { predicate: "", description: "" },
      });
      setTahfidzNotes("");
      setScores([{ name: "PILIH MATERI", tahfidz_score: "", tahsin_score: "", customName: "" }]);
      setAttendance({ present: 90, permit: 0, absence: 0 });
      setSignatures(prev => ({
        ...prev,
        place: "",
        date: new Date().toISOString().slice(0, 10),
      }));
      // Reset completion status
      setIsEditing(false);
      calculateCompletionProgress();
    }
  }, [currentReport]);

  // Filter classes by academic year if needed (if classes have academicYearId)
  const filteredClasses = classes; // adjust if you have academicYearId

  // Add state to track if fields are being edited
  const [isEditing, setIsEditing] = useState(false);

  // Update completion status calculation
  const calculateCompletionProgress = () => {
    // If no student selected or no data entered at all, return empty
    if (!studentId || (!currentReport && !Object.values(ziyadah).some(val => val.predicate || val.description))) {
      return {
        progress: 0,
        sections: [
          { name: 'Ziyadah', complete: false },
          { name: 'Score', complete: false },
          { name: 'Notes', complete: false },
          { name: 'Attendance', complete: false }
        ],
        status: 'empty'
      };
    }

    const sections = [
      {
        name: 'Ziyadah',
        complete: Object.values(ziyadah).every(val => 
          val.predicate && 
          val.description && 
          val.description.trim().split(/\s+/).length <= 10
        )
      },
      {
        name: 'Score',
        complete: scores.length >= 1 && scores.every(score => 
          score.name && 
          score.tahfidz_score && 
          score.tahsin_score
        )
      },
      {
        name: 'Notes',
        complete: (() => {
          const wordCount = tahfidzNotes.trim().split(/\s+/).length;
          return wordCount >= 20 && wordCount <= 40;
        })()
      },
      {
        name: 'Attendance',
        complete: attendance.present >= 0 && attendance.permit >= 0 && attendance.absence >= 0
      }
    ];

    const completedSections = sections.filter(s => s.complete).length;
    const progress = (completedSections / sections.length) * 100;

    return {
      progress,
      sections,
      status: completedSections === sections.length ? 'complete' : 'incomplete'
    };
  };

  // Attendance handlers
  const handleAttendanceChange = (field: 'present' | 'permit' | 'absence', value: number) => {
    if (field === 'permit' || field === 'absence') {
      const newPermit = field === 'permit' ? value : attendance.permit;
      const newAbsence = field === 'absence' ? value : attendance.absence;
      setAttendance({
        present: Math.max(0, 90 - newPermit - newAbsence),
        permit: newPermit,
        absence: newAbsence
      });
    } else {
      setAttendance(a => ({ ...a, present: value }));
    }
  };

  // Ziyadah handler
  const handleZiyadahChange = (aspect: string, field: string, value: string) => {
    setIsEditing(true);
    setZiyadah((prev) => {
      let newVal = value;
      if (field === 'predicate' && ZIYADAH_DESCRIPTIONS[value]) {
        newVal = value;
        return {
          ...prev,
          [aspect]: {
            ...prev[aspect as keyof typeof prev],
            predicate: value,
            description: ZIYADAH_DESCRIPTIONS[value]
          }
        };
      }
      return {
        ...prev,
        [aspect]: {
          ...prev[aspect as keyof typeof prev],
          [field]: value
        }
      };
    });
  };

  // Score handlers
  const handleScoreChange = (idx: number, field: string, value: string) => {
    setIsEditing(true);
    setScores((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'name') {
        return { ...s, name: value, customName: value === 'CUSTOM' ? s.customName || '' : '' };
      }
      return { ...s, [field]: value };
    }));
  };

  const handleCustomScoreNameChange = (idx: number, value: string) => {
    setIsEditing(true);
    setScores((prev) => prev.map((s, i) => i === idx ? { ...s, customName: value } : s));
  };

  const addScore = () => {
    setIsEditing(true);
    setScores((prev) => [...prev, { name: "PILIH MATERI", tahfidz_score: "", tahsin_score: "", customName: "" }]);
  };

  const removeScore = (idx: number) => {
    setIsEditing(true);
    setScores((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add blur handlers for all input fields
  const handleFieldBlur = () => {
    setIsEditing(false);
    calculateCompletionProgress();
  };

  // Add loading state for Save/Update
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update save handler
  const handleSave = async () => {
    setIsEditing(false);
    setIsSaving(true);
    // Calculate completion status before saving
    const completion = calculateCompletionProgress();
    const completion_status = completion.status as 'empty' | 'complete' | 'incomplete';
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
      completion_status,
    };

    let result;
    if (currentReport) {
      result = await updateReport({ ...reportData, id: currentReport.id, status: currentReport.status });
    } else {
      result = await saveReport(reportData);
    }

    setIsSaving(false);
    if (!result.error) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      loadReport(academicYear, sessionId, studentId);
    } else {
      alert("Error saving report. Please try again.");
    }
  };

  const completion = calculateCompletionProgress();

  // Attendance percentage calculation
  const totalDays = 90 + attendance.permit + attendance.absence;
  const attendancePercent = totalDays > 0 ? Math.round((90 / totalDays) * 100) : 100;
  let attendanceColor = 'bg-red-500';
  if (attendancePercent >= 75) attendanceColor = 'bg-green-500';
  else if (attendancePercent >= 50) attendanceColor = 'bg-yellow-400';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;

    // Get logo and arabic title as base64 at runtime
    const logoBase64 = await getBase64FromUrl('/images/pptq-logo.png');
    const arabicBase64 = await getBase64FromUrl('/images/arabicword.png');
    // Get watermark logo as base64
    const watermarkBase64 = await getBase64FromUrl('/images/watermarklogo.png');

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

    // Background Image Watermark
    const pageWidths = doc.internal.pageSize.getWidth();
    const pageHeights = doc.internal.pageSize.getHeight();
    const logoWidth = 120;  // Adjust as needed
    const logoHeight = 120;
    doc.addImage(
      watermarkBase64,
      'PNG',
      (pageWidths - logoWidth) / 2,
      (pageHeights - logoHeight) / 2,
      logoWidth,
      logoHeight
    );

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
      styles: { font: 'helvetica', fontSize: 11, halign: 'center', fillColor: false },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 5;

    const scoresData = scores.map(score => [
      capitalizeFirst(score.name),
      score.tahfidz_score,
      score.tahsin_score
    ]);
    autoTable(doc, {
      startY: y,
      head: [['Materi Ujian', 'Tahfidz', 'Tahsin']],
      body: scoresData,
      styles: { font: 'helvetica', fontSize: 11, halign: 'center', fillColor: false },
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 25, right: 25 },
      tableLineColor: [180, 180, 180],
      tableLineWidth: 0.2,
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Add Overal Score
    const overalScoreText = 'Overal Score: ' + overallPredicate + ' ( ' + overallDescription + ' )';
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(12);
    doc.text(overalScoreText.toUpperCase(), 105, y, { align: 'center' });
    y += 4;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineWidth = 120;
    const startX = (pageWidth - lineWidth) / 2;
    const endX = startX + lineWidth;
    doc.line(startX, y, endX, y);
    y += 10;


    // --- Attendance and Notes as side-by-side tables ---
    // Attendance Table
    const attendanceTable = [
      ['Hadir', 90],
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
    // Add Attendance Percentage
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Kehadiran: ' + attendancePercent + '%', 25, (doc as any).lastAutoTable.finalY + 5);
    // Notes Table (single, not double)
    const notesTable = [
      [tahfidzNotes || '-']
    ];
    autoTable(doc, {
      startY: y,
      head: [['Catatan', '']],
      body: notesTable,
      styles: { font: 'helvetica', fontSize: 11, halign: 'center', textColor: [60, 70, 90] },
      headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      margin: { left: 80, right: 25 },
      tableLineWidth: 0.2,
      theme: 'plain',
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
    doc.text(`( ${signatures.parent || '.......................................'} )`, 25, sigY + 25);
    doc.text(`( ${signatures.principal || '..........................'} )`,105, sigY + 25, { align: 'center' });
    doc.text(`( ${signatures.teacher || '..........................'} )`, 185, sigY + 25, { align: 'right' });

    // Build file name (UPPERCASE)
    const studentNameSnake = toSnakeCase(student?.name || 'student').toUpperCase();
    const sessionName = (sessionObj?.name || 'session').toUpperCase();
    const academicYearName = (academicYearObj?.name || '').replace(/\//g, '').replace(/\s+/g, '').toUpperCase();
    const fileName = `${studentNameSnake}-${sessionName}-${academicYearName}.pdf`;
    doc.save(fileName);
  };

  // Add getOverallPredicate function
  const getOverallPredicate = () => {
    // Numeric mapping
    const predicateToScore: Record<string, number> = {
      'Mumtaz': 92,
      'Jayyid Jiddan': 85,
      'Jayyid': 75,
      'Dhoif': 60,
      'Nafis': 50
    };
    // Collect all tahfidz_score and tahsin_score
    const allScores = scores
      .flatMap(s => [s.tahfidz_score, s.tahsin_score])
      .map(val => predicateToScore[val] || 0)
      .filter(v => v > 0);
    if (allScores.length === 0) return '-';
    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const roundedAvg = Math.round(avg);
    if (avg > 90) return `Mumtaz (${roundedAvg})`;
    if (avg >= 85 && avg <= 90) return `Jayyid Jiddan+`;
    if (avg >= 81 && avg <= 84) return `Jayyid Jiddan`;
    if (avg >= 75 && avg <= 80) return `Jayyid+`;
    if (avg >= 66 && avg <= 74) return `Jayyid`;
    if (avg >= 60 && avg <= 65) return `Dhoif+`;
    if (avg >= 55 && avg <= 59) return `Dhoif`;
    if (avg >= 52 && avg <= 54) return `Nafis+`;
    if (avg < 52) return `Nafis (${roundedAvg})`;
    return '-';
  };

  // Add getOverallDescription function
  const getOverallDescription = (predicate: string) => {
    switch (predicate) {
      case 'Mumtaz': return 'Excellent!, Sempurna';
      case 'Jayyid Jiddan+': return 'Super Brilliant!, Luar Biasa Baik';
      case 'Jayyid Jiddan': return 'Brilliant, Sangat Baik Sekali';
      case 'Jayyid+': return 'Really Good, Sangat Baik';
      case 'Jayyid': return 'Good, Baik';
      case 'Dhoif+': return 'Need Improvement, Cukup Baik';
      case 'Dhoif': return 'Bad, Tidak Terlalu Baik';
      case 'Nafis+': return 'Really Bad, Buruk';
      case 'Nafis': return 'Worst, Sangat Buruk';
      default: return '';
    }
  };

  const overallPredicate = getOverallPredicate();
  const overallDescription = getOverallDescription(overallPredicate);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-8">
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
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === studentId)}
            onChange={(selected) => setStudentId(selected?.value || '')}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
        <button 
          onClick={() => {
            calculateCompletionProgress();
            handleSave();
          }} 
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
                    <select 
                      value={val.predicate} 
                      onChange={e => handleZiyadahChange(aspect, "predicate", e.target.value)}
                      onBlur={handleFieldBlur}
                      className="border rounded px-3 py-2 w-full sm:w-48"
                    >
                      <option value="">-</option>
                      {PREDICATES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input 
                      value={val.description} 
                      onChange={e => handleZiyadahChange(aspect, "description", e.target.value)}
                      onBlur={handleFieldBlur}
                      className="border rounded px-3 py-2 w-full min-h-[40px]" 
                    />
                    <span className="ml-2 text-xs text-gray-500">Word count: {val.description.trim().split(/\s+/).filter(Boolean).length} (min: 2, max: 10)</span>
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
          <textarea 
            value={tahfidzNotes} 
            onChange={e => {
              setIsEditing(true);
              setTahfidzNotes(e.target.value);
            }}
            onBlur={handleFieldBlur}
            className="w-full border rounded px-3 py-2 min-h-[300px]"
          />
          <div className="mt-2 text-sm text-gray-500">
            Word count: {tahfidzNotes.trim().split(/\s+/).length} (min: 20, max: 40)
          </div>
        </div>
      </div>

      {/* Section 5 & 6: Score & Attendance */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Score Repeater */}
        <div className="w-full md:w-3/4 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Score</h2>
          {scores.map((score, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2 items-stretch w-full">
              <select
                value={score.name}
                onChange={e => handleScoreChange(idx, "name", e.target.value)}
                onBlur={handleFieldBlur}
                className="border rounded px-3 py-2 w-full sm:w-48"
              >
                {SCORE_NAMES.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              {score.name === 'CUSTOM' && (
                <input
                  value={score.customName || ''}
                  onChange={e => handleCustomScoreNameChange(idx, e.target.value)}
                  onBlur={handleFieldBlur}
                  placeholder="Custom Materi"
                  className="border rounded px-3 py-2 w-full sm:w-48"
                />
              )}
              <select
                value={score.tahfidz_score}
                onChange={e => handleScoreChange(idx, "tahfidz_score", e.target.value)}
                onBlur={handleFieldBlur}
                className="border rounded px-3 py-2 w-full sm:w-32"
              >
                <option value="">Tahfidz Score</option>
                {PREDICATES_MAIN.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={score.tahsin_score}
                onChange={e => handleScoreChange(idx, "tahsin_score", e.target.value)}
                onBlur={handleFieldBlur}
                className="border rounded px-3 py-2 w-full sm:w-32"
              >
                <option value="">Tahsin Score</option>
                {PREDICATES_MAIN.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => removeScore(idx)} className="text-red-500 no-print w-full sm:w-auto">Remove</button>
            </div>
          ))}
          <button onClick={addScore} className="mt-2 bg-green-500 text-white px-2 py-1 rounded no-print w-full sm:w-auto">Add Score</button>
          <div className="mt-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="font-semibold">Overall Predicate:</div>
            <div className="ml-2">{overallPredicate}</div>
            <div className="font-semibold ml-4">Overall Description:</div>
            <div className="ml-2">{overallDescription}</div>
          </div>
        </div>
        {/* Attendance Table */}
        <div className="w-full md:w-1/4 bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-2">Attendance</h2>
          <table className="w-full border">
            <tbody>
              <tr>
                <td className="border px-2 py-1">Present</td>
                <td className="border px-2 py-1">
                  <input 
                    type="number" 
                    value={90} 
                    readOnly
                    className="border rounded px-3 py-2 w-16 bg-gray-100 cursor-not-allowed" 
                  />
                </td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Permit</td>
                <td className="border px-2 py-1">
                  <input 
                    type="number" 
                    value={attendance.permit} 
                    onChange={e => handleAttendanceChange('permit', +e.target.value)}
                    onBlur={handleFieldBlur}
                    className="border rounded px-3 py-2 w-16" 
                  />
                </td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Absence</td>
                <td className="border px-2 py-1">
                  <input 
                    type="number" 
                    value={attendance.absence} 
                    onChange={e => handleAttendanceChange('absence', +e.target.value)}
                    onBlur={handleFieldBlur}
                    className="border rounded px-3 py-2 w-16" 
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className={`mt-2 text-sm font-semibold text-white px-2 py-1 rounded ${attendanceColor}`}>Attendance: {attendancePercent}%</div>
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

      {/* Add completion status indicator */}
      <div className="bg-white rounded shadow p-4 no-print">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Report Completion</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isEditing ? 'bg-blue-100 text-blue-800' :
            completion.status === 'complete' ? 'bg-green-100 text-green-800' :
            completion.status === 'incomplete' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isEditing ? 'Editing...' : completion.status.charAt(0).toUpperCase() + completion.status.slice(1)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className={`h-2.5 rounded-full ${
              isEditing ? 'bg-blue-600' :
              completion.status === 'complete' ? 'bg-green-600' :
              completion.status === 'incomplete' ? 'bg-yellow-500' :
              'bg-gray-400'
            }`}
            style={{ width: `${completion.progress}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {completion.sections.map((section, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                section.complete ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm text-gray-600">{section.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-lg font-semibold mb-2">Report Saved!</div>
          </div>
        </div>
      )}

      {/* View | Download | Print */}
      <div className="flex justify-end gap-4 mt-4 no-print">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Download
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center gap-2"
          disabled={!academicYear || !studentId || isSaving}
        >
          {isSaving && (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          )}
          {currentReport ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  );
} 