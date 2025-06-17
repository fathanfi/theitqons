"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useStudentReportsStore } from '@/store/studentReportsStore';
import { useAuthStore } from '@/store/authStore';
import { jsPDF } from 'jspdf';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import { setFontAlegreyaMedium } from './setFontAlegreyaMedium';

const SESSIONS = [
  { id: 1, name: '1' },
  { id: 2, name: '2' },
];

const CERTIFICATE_THEMES = [
  { id: 1, name: 'Terbaik', image: '/images/certificates/theme1.png', orientation: 'landscape' as const },
  { id: 2, name: 'Itqon', image: '/images/certificates/itqon1.png', orientation: 'portrait' as const },
  { id: 3, name: 'Syahadah', image: '/images/certificates/syahadah1.png', orientation: 'portrait' as const },
];

const CERTIFICATE_TYPES = [
  { id: 1, name: 'SANTRI TERBAIK I' },
  { id: 2, name: 'SANTRI TERBAIK II' },
  { id: 3, name: 'SANTRI TERBAIK III' },
  { id: 4, name: 'SANTRI TERAJIN' },
  { id: 5, name: 'ITQON TERBAIK' },
];

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

// Helper to convert string to snake case
function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formattedBirthDate(str: string): string {
  if (!str) return ''; // allow empty input

  const birthDate = new Date(str);
  if (isNaN(birthDate.getTime())) return ''; // handle invalid date

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(birthDate);
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
  const groups = useSchoolStore((state) => state.groups);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const { user } = useAuthStore();
  const { 
    currentReport, 
    loadReport, 
    getTeacherName,
    getClassName,
    getLevelName,
    getGroupName
  } = useStudentReportsStore();
  const [teacherId, setTeacherId] = useState<string>('');

  const [academicYear, setAcademicYear] = useState<string>('');
  const [sessionId, setSessionId] = useState<number>(2); // Fixed to SM2
  const [classId, setClassId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [levelName, setLevelName] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<number | ''>('');
  const [selectedCertificateType, setSelectedCertificateType] = useState<number | ''>('');
  const [certificateId, setCertificateId] = useState<string>('');

  interface ItqonExam {
    id: string;
    exams: {
      name: string;
    };
    tahfidz_score: number;
    tajwid_score: number;
  }

  interface ProcessedItqonExam {
    id: string;
    name: string;
    tahfidz_score: string;
    tajwid_score: string;
  }

  const [itqonExams, setItqonExams] = useState<ProcessedItqonExam[]>([]);
  const [selectedItqonExam, setSelectedItqonExam] = useState<string>('');

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
        const [className, levelName, groupName, teacherName] = await Promise.all([
          getClassName(student?.class_id || ''),
          getLevelName(student?.level_id || ''),
          getGroupName(studentId),
          getTeacherName(studentId)
        ]);

        setClassName(className);
        setLevelName(levelName);
        setGroupName(groupName);
        setTeacherName(teacherName);
      }
    };

    loadAdditionalData();
  }, [studentId, student?.level_id, getClassName, getLevelName, getGroupName, getTeacherName]);

  // Filter classes by academic year if needed (if classes have academicYearId)
  const filteredClasses = classes; // adjust if you have academicYearId

  // Fetch Itqon exams when student changes
  useEffect(() => {
    const fetchItqonExams = async () => {
      if (studentId) {
        const { data, error } = await supabase
          .from('itqon_exams')
          .select(`
            id,
            exams (
              name
            ),
            tahfidz_score,
            tajwid_score
          `)
          .eq('student_id', studentId);

        if (data && !error) {
          const processedExams: ProcessedItqonExam[] = data.map((exam: any) => ({
            id: exam.id,
            name: exam.exams.name,
            tahfidz_score: exam.tahfidz_score,
            tajwid_score: exam.tajwid_score
          }));
          setItqonExams(processedExams);
        }
      }
    };

    fetchItqonExams();
  }, [studentId]);

  // Remove all useEffect hooks that might trigger preview
  useEffect(() => {
    if (studentId && academicYear && sessionId && student) {
      // Do nothing - preview will only be generated on button click
    }
  }, [studentId, academicYear, sessionId, student]);

  // Remove any other useEffect hooks that might trigger preview
  useEffect(() => {
    if (studentId) {
      // Do nothing - preview will only be generated on button click
    }
  }, [studentId]);

  // Update the generatePreview function
  const generatePreview = async () => {
    console.log('Starting preview generation...');
    console.log('Current state:', {
      student,
      selectedTheme,
      selectedCertificateType,
      selectedItqonExam,
      certificateId
    });

    if (!student) {
      console.log('No student selected');
      setPreviewError('Please select a student first');
      return;
    }

    // Validate required selections
    if (!selectedTheme) {
      console.log('No theme selected');
      setPreviewError('Please select a theme');
      return;
    }

    if (selectedTheme === 1 && !selectedCertificateType) {
      console.log('No certificate type selected for theme 1');
      setPreviewError('Please select a certificate type');
      return;
    }

    if (selectedTheme === 2 && !selectedItqonExam) {
      console.log('No exam selected for theme 2');
      setPreviewError('Please select an exam');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewBlob(null);
    setPreviewUrl('');

    try {
      // Get selected theme and certificate type
      const selectedThemeObj = CERTIFICATE_THEMES.find(t => t.id === selectedTheme);
      const selectedCertificateTypeObj = selectedTheme === 1 
        ? CERTIFICATE_TYPES.find(t => t.id === selectedCertificateType)
        : undefined;

      console.log('Selected objects:', {
        selectedThemeObj,
        selectedCertificateTypeObj
      });

      if (!selectedThemeObj) {
        throw new Error('Theme not found');
      }

      if (selectedTheme === 1 && !selectedCertificateTypeObj) {
        throw new Error('Certificate type not found');
      }

      if (selectedThemeObj.orientation === 'portrait') {
        console.log('Generating portrait preview...');
        await generatePreviewPortrait(selectedThemeObj, selectedCertificateTypeObj!);
      } else {
        console.log('Generating landscape preview...');
        await generatePreviewLandscape(selectedThemeObj, selectedCertificateTypeObj!);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewError('Failed to generate preview. Please try again.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Portrait orientation preview
  const generatePreviewPortrait = async (theme: typeof CERTIFICATE_THEMES[0], certificateType: typeof CERTIFICATE_TYPES[0]) => {
    console.log('Starting portrait preview generation...');
    if (!student) {
      console.log('No student found');
      return;
    }

    try {
      const themeBase64 = await getBase64FromUrl(theme.image);
      const studentName = student.name;
      const address = student.address;
      const dateOfBirth = student.dateOfBirth;
      const placeOfBirth = student.placeOfBirth;
      const lastAchievement = student.lastAchievement;

      const birth = placeOfBirth + ', ' + formattedBirthDate(student.dateOfBirth || '');

      // A4 portrait size
      const doc = new jsPDF({ 
        orientation: 'portrait', 
        format: 'a4', 
        unit: 'mm' 
      });

      // Register the custom font
      setFontAlegreyaMedium(jsPDF.API);

      // Add theme background
      doc.addImage(themeBase64, 'PNG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);

      // Calculate center points
      const centerX = doc.internal.pageSize.width / 2;
      let y = 0; // Starting y position for portrait
      
      if (selectedTheme === 3) {
        y = 90; // Starting y position for portrait

        // Certificate ID
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(certificateId || 'NO.0001/SYH-PPTQ/VI/2025', centerX, y, { align: 'center' });
        y += 40;

        // Student name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(studentName.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 9;

        // Address
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(address.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 9;

        // Birth
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(birth.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 8;
        
        // Class name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(15);
        doc.text(className.toUpperCase() || '', centerX + -58, y, { align: 'left' });
        y += 20;

        // Last Achivement name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(20);
        doc.text(lastAchievement?.toUpperCase() || '', centerX, y, { align: 'center' });
        y +=48;
      } else if (selectedTheme === 2) {
        y = 83; // Starting y position for portrait
        // Certificate ID
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(certificateId || 'IT00001/ITQ-PPTQ/VI/2025', centerX, y, { align: 'center' });
        y += 50;

        // Student name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(30);
        doc.text(studentName.toUpperCase(), centerX, y, { align: 'center' });
        y += 15;

        // Class name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(className.toUpperCase(), centerX + 20, y, { align: 'center' });
        y += 23;
      }
      
      if (selectedTheme === 3) {
      } else if (selectedTheme === 2 && selectedItqonExam) {
        const selectedExam = itqonExams.find(exam => exam.id === selectedItqonExam);
        if (selectedExam) {
          // Itqon Exam name
          doc.setFont('AlegreyaMedium', 'bold');
          doc.setFontSize(20);
          doc.text(selectedExam.name.toUpperCase(), centerX, y, { align: 'center' });
          y += 10;

          // Itqon Exam Score
          doc.setFont('AlegreyaMedium', 'bold');
          doc.setFontSize(16);
          const scoreText = getScorePredicate(selectedExam.tahfidz_score, selectedExam.tajwid_score);
          doc.text(scoreText, centerX + 10, y, { align: 'center' });
          y += 45;
        }
      } else {
        // Certificate type for Terbaik theme
        doc.setFont('AlegreyaMedium', 'bold');
        doc.setFontSize(20);
        doc.text(certificateType.name, centerX, y, { align: 'center' });
        y += 45;
      }

      if (selectedTheme === 3) {
        // Place and Date
        doc.setFont('AlegreyaMedium', 'normal');
        doc.setFontSize(14);
        const place = 'Kota Tasikmalaya';
        const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
        doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      } else if (selectedTheme === 2) {
        // Place and Date
        doc.setFont('AlegreyaMedium', 'normal');
        doc.setFontSize(14);
        const place = 'Kota Tasikmalaya';
        const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
        doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      }
      
      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      console.log('Generated PDF blob:', pdfBlob);
      setPreviewBlob(pdfBlob);
      
      // Also set the data URL as fallback
      const pdfDataUrl = doc.output('dataurlstring');
      console.log('Generated PDF data URL');
      setPreviewUrl(pdfDataUrl);
    } catch (error) {
      console.error('Error in portrait preview generation:', error);
      throw error;
    }
  };

  // Landscape orientation preview
  const generatePreviewLandscape = async (theme: typeof CERTIFICATE_THEMES[0], certificateType: typeof CERTIFICATE_TYPES[0]) => {
    console.log('Starting landscape preview generation...');
    if (!student) {
      console.log('No student found');
      return;
    }

    try {
      const themeBase64 = await getBase64FromUrl(theme.image);
      const studentName = student.name;

      // A4 landscape size
      const doc = new jsPDF({ 
        orientation: 'landscape', 
        format: 'a4', 
        unit: 'mm' 
      });

      // Register the custom font
      setFontAlegreyaMedium(jsPDF.API);

      // Add theme background
      doc.addImage(themeBase64, 'PNG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);

      // Calculate center points
      const centerX = doc.internal.pageSize.width / 2;
      let y = 97; // Starting y position for landscape

      // Student name
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(30);
      doc.text(studentName.toUpperCase(), centerX, y, { align: 'center' });
      y += 21;

      // Certificate type
      doc.setFont('AlegreyaMedium', 'bold');
      doc.setFontSize(20);
      doc.text(certificateType.name, centerX, y, { align: 'center' });
      y += 12;

      // Session and Academic Year
      doc.setFont('AlegreyaMedium', 'bold');
      doc.setFontSize(16);
      doc.text(sessionObj?.name || '1', 145, y, { align: 'center' });
      doc.text(academicYearObj?.name || '2024/2025', 205, y, { align: 'center' });
      y += 28;

      // Place and Date
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(14);
      doc.setTextColor(60, 70, 90);
      const place = 'Kota Tasikmalaya';
      const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
      doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      y += 10;

      // Director
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(13);
      doc.setTextColor(60, 70, 90);
      doc.text('Direktur PPTQ', centerX, y, { align: 'center' });
      y += 25;

      // Certificate ID
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(12);
      doc.text(certificateId || 'IT00001/ITQ-PPTQ/VI/2025', 251, y, { align: 'center' });

      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      console.log('Generated PDF blob:', pdfBlob);
      setPreviewBlob(pdfBlob);
      
      // Also set the data URL as fallback
      const pdfDataUrl = doc.output('dataurlstring');
      console.log('Generated PDF data URL');
      setPreviewUrl(pdfDataUrl);
    } catch (error) {
      console.error('Error in landscape preview generation:', error);
      throw error;
    }
  };

  const handleDownload = async () => {
    console.log('Starting download...');
    console.log('Current state:', {
      student,
      selectedTheme,
      selectedCertificateType,
      selectedItqonExam,
      certificateId
    });

    if (!student) {
      console.log('No student selected');
      return;
    }

    // Validate required selections
    if (!selectedTheme) {
      console.log('No theme selected');
      return;
    }

    if (selectedTheme === 1 && !selectedCertificateType) {
      console.log('No certificate type selected for theme 1');
      return;
    }

    if (selectedTheme === 2 && !selectedItqonExam) {
      console.log('No exam selected for theme 2');
      return;
    }

    try {
      // Get selected theme and certificate type
      const selectedThemeObj = CERTIFICATE_THEMES.find(t => t.id === selectedTheme);
      const selectedCertificateTypeObj = selectedTheme === 1 
        ? CERTIFICATE_TYPES.find(t => t.id === selectedCertificateType)
        : undefined;

      console.log('Selected objects:', {
        selectedThemeObj,
        selectedCertificateTypeObj
      });

      if (!selectedThemeObj) {
        throw new Error('Theme not found');
      }

      if (selectedTheme === 1 && !selectedCertificateTypeObj) {
        throw new Error('Certificate type not found');
      }

      if (selectedThemeObj.orientation === 'portrait') {
        console.log('Generating portrait download...');
        await handleDownloadPortrait(selectedThemeObj, selectedCertificateTypeObj!);
      } else {
        console.log('Generating landscape download...');
        await handleDownloadLandscape(selectedThemeObj, selectedCertificateTypeObj!);
      }
    } catch (error) {
      console.error('Error generating download:', error);
    }
  };

  // Portrait orientation download
  const handleDownloadPortrait = async (theme: typeof CERTIFICATE_THEMES[0], certificateType: typeof CERTIFICATE_TYPES[0]) => {
    if (!student) return;

    try {
      const themeBase64 = await getBase64FromUrl(theme.image);
      const studentName = student.name;
      const address = student.address;
      const dateOfBirth = student.dateOfBirth;
      const placeOfBirth = student.placeOfBirth;
      const lastAchievement = student.lastAchievement;

      const birth = placeOfBirth + ', ' + formattedBirthDate(student.dateOfBirth || '');

      // A4 portrait size
      const doc = new jsPDF({ 
        orientation: 'portrait', 
        format: 'a4', 
        unit: 'mm' 
      });

      // Register the custom font
      setFontAlegreyaMedium(jsPDF.API);

      // Add theme background
      doc.addImage(themeBase64, 'PNG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);

      // Calculate center points
      const centerX = doc.internal.pageSize.width / 2;
      let y = 0; // Starting y position for portrait
      
      if (selectedTheme === 3) {
        y = 90; // Starting y position for portrait

        // Certificate ID
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(certificateId || 'NO.0001/SYH-PPTQ/VI/2025', centerX, y, { align: 'center' });
        y += 40;

        // Student name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(studentName.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 9;

        // Address
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(address.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 9;

        // Birth
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(16);
        doc.text(birth.toUpperCase(), centerX + -27, y, { align: 'left' });
        y += 8;
        
        // Class name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(15);
        doc.text(className.toUpperCase() || '', centerX + -58, y, { align: 'left' });
        y += 20;

        // Last Achivement name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(20);
        doc.text(lastAchievement?.toUpperCase() || '', centerX, y, { align: 'center' });
        y +=48;
      } else if (selectedTheme === 2) {
        y = 83; // Starting y position for portrait
        // Certificate ID
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(certificateId || 'IT00001/ITQ-PPTQ/VI/2025', centerX, y, { align: 'center' });
        y += 50;

        // Student name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(30);
        doc.text(studentName.toUpperCase(), centerX, y, { align: 'center' });
        y += 15;

        // Class name
        doc.setFont('AlegreyaMedium');
        doc.setFontSize(17);
        doc.text(className.toUpperCase(), centerX + 20, y, { align: 'center' });
        y += 23;
      }
      
      if (selectedTheme === 3) {
      } else if (selectedTheme === 2 && selectedItqonExam) {
        const selectedExam = itqonExams.find(exam => exam.id === selectedItqonExam);
        if (selectedExam) {
          // Itqon Exam name
          doc.setFont('AlegreyaMedium', 'bold');
          doc.setFontSize(20);
          doc.text(selectedExam.name.toUpperCase(), centerX, y, { align: 'center' });
          y += 10;

          // Itqon Exam Score
          doc.setFont('AlegreyaMedium', 'bold');
          doc.setFontSize(16);
          const scoreText = getScorePredicate(selectedExam.tahfidz_score, selectedExam.tajwid_score);
          doc.text(scoreText, centerX + 10, y, { align: 'center' });
          y += 45;
        }
      } else {
        // Certificate type for Terbaik theme
        doc.setFont('AlegreyaMedium', 'bold');
        doc.setFontSize(20);
        doc.text(certificateType.name, centerX, y, { align: 'center' });
        y += 45;
      }

      if (selectedTheme === 3) {
        // Place and Date
        doc.setFont('AlegreyaMedium', 'normal');
        doc.setFontSize(14);
        const place = 'Kota Tasikmalaya';
        const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
        doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      } else if (selectedTheme === 2) {
        // Place and Date
        doc.setFont('AlegreyaMedium', 'normal');
        doc.setFontSize(14);
        const place = 'Kota Tasikmalaya';
        const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
        doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      }

      // Build file name (UPPERCASE)
      const studentNameSnake = toSnakeCase(studentName).toUpperCase();
      const sessionName = (sessionObj?.name || 'session').toUpperCase();
      const academicYearName = (academicYearObj?.name || '').replace(/\//g, '').replace(/\s+/g, '').toUpperCase();
      const fileName = `${studentNameSnake}-${sessionName}-${academicYearName}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error in portrait download generation:', error);
      throw error;
    }
  };

  // Landscape orientation download
  const handleDownloadLandscape = async (theme: typeof CERTIFICATE_THEMES[0], certificateType: typeof CERTIFICATE_TYPES[0]) => {
    if (!student) return;

    try {
      const themeBase64 = await getBase64FromUrl(theme.image);
      const studentName = student.name;

      // A4 landscape size
      const doc = new jsPDF({ 
        orientation: 'landscape', 
        format: 'a4', 
        unit: 'mm' 
      });

      // Register the custom font
      setFontAlegreyaMedium(jsPDF.API);

      // Add theme background
      doc.addImage(themeBase64, 'PNG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);

      // Calculate center points
      const centerX = doc.internal.pageSize.width / 2;
      let y = 97; // Starting y position for landscape

      // Student name
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(30);
      doc.text(studentName.toUpperCase(), centerX, y, { align: 'center' });
      y += 21;

      // Certificate type
      doc.setFont('AlegreyaMedium', 'bold');
      doc.setFontSize(20);
      doc.text(certificateType.name, centerX, y, { align: 'center' });
      y += 12;

      // Session and Academic Year
      doc.setFont('AlegreyaMedium', 'bold');
      doc.setFontSize(16);
      doc.text(sessionObj?.name || '1', 145, y, { align: 'center' });
      doc.text(academicYearObj?.name || '2024/2025', 205, y, { align: 'center' });
      y += 28;

      // Place and Date
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(14);
      doc.setTextColor(60, 70, 90);
      const place = 'Kota Tasikmalaya';
      const fixedDate = '23 Juni 2025 / 27 Dzulhijjah 1446 H';
      doc.text(`${place}, ${fixedDate}`, centerX, y, { align: 'center' });
      y += 10;

      // Director
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(13);
      doc.setTextColor(60, 70, 90);
      doc.text('Direktur PPTQ', centerX, y, { align: 'center' });
      y += 25;

      // Certificate ID
      doc.setFont('AlegreyaMedium');
      doc.setFontSize(12);
      doc.text(certificateId || 'IT00001/ITQ-PPTQ/VI/2025', 251, y, { align: 'center' });

      // Build file name (UPPERCASE)
      const studentNameSnake = toSnakeCase(studentName).toUpperCase();
      const sessionName = (sessionObj?.name || 'session').toUpperCase();
      const academicYearName = (academicYearObj?.name || '').replace(/\//g, '').replace(/\s+/g, '').toUpperCase();
      const fileName = `${studentNameSnake}-${sessionName}-${academicYearName}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error in landscape download generation:', error);
      throw error;
    }
  };

  // Helper function to get score predicate
  const getScorePredicate = (tahfidzScore: string, tajwidScore: string): string => {
    const tahfidz = tahfidzScore.toUpperCase();
    const tajwid = tajwidScore.toUpperCase();

    console.log(tahfidz, tajwid);

    if (tahfidz === 'OUTSTANDING' && tajwid === 'OUTSTANDING') return 'MUMTAZ ( SEMPURNA )';
    if ((tahfidz === 'OUTSTANDING' && tajwid === 'VERY GOOD') || (tahfidz === 'VERY GOOD' && tajwid === 'OUTSTANDING')) return 'JAYYID JIDDAN ( BAIK SEKALI + )';
    if (tahfidz === 'VERY GOOD' && tajwid === 'VERY GOOD') return 'JAYYID JIDDAN ( BAIK SEKALI )';
    if ((tahfidz === 'VERY GOOD' && tajwid === 'GOOD') || (tahfidz === 'GOOD' && tajwid === 'VERY GOOD')) return 'JAYYID ( BAIK + )';
    if (tahfidz === 'GOOD' && tajwid === 'GOOD') return 'JAYYID ( BAIK )';
    if ((tahfidz === 'GOOD' && tajwid === 'NEED IMPROVEMENT') || (tahfidz === 'NEED IMPROVEMENT' && tajwid === 'GOOD')) return 'DHOIF ( CUKUP + )';
    if (tahfidz === 'NEED IMPROVEMENT' && tajwid === 'NEED IMPROVEMENT') return 'DHOIF ( CUKUP )';
    if ((tahfidz === 'BAD' && tajwid === 'NEED IMPROVEMENT') || (tahfidz === 'NEED IMPROVEMENT' && tajwid === 'BAD')) return 'NAQIS ( BURUK + )';
    if (tahfidz === 'BAD' && tajwid === 'BAD') return 'NAQIS ( BURUK )';
    if ((tahfidz === 'VERY BAD' && tajwid === 'BAD') || (tahfidz === 'BAD' && tajwid === 'VERY BAD')) return 'MAQBUL ( BURUK SEKALI + )';
    if (tahfidz === 'VERY BAD' && tajwid === 'VERY BAD') return 'MAQBUL ( BURUK SEKALI )';
    return 'JAYYID ( BAIK )';
  };

  // Generate certificate ID
  const generateCertificateId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newId = `IT${randomNum}/ITQ-PPTQ/${month}/${year}`;
    setCertificateId(newId);
  };

  // Update the handlers to only set state without triggering preview
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(Number(e.target.value));
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  const handleCertificateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCertificateType(Number(e.target.value));
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  const handleItqonExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedItqonExam(e.target.value);
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  const handleCertificateIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateId(e.target.value);
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  // Update handlers for class and student selection
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassId(e.target.value);
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  const handleStudentChange = (selected: any) => {
    setStudentId(selected?.value || '');
    setPreviewUrl('');
    setPreviewBlob(null);
  };

  return (
    <>
      <style>{`
        label,
        select,
        input,
        textarea,
        option {
          color: #222 !important;
        }
      `}</style>
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 no-print">Certificates</h1>
      
      {/* Section 1: Selectors and Student Info */}
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
            onChange={handleClassChange}
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
            onChange={handleStudentChange}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
        {student && (
          <div className="w-full md:w-auto text-sm">
            Student Information: {student.name}, {student.address}, {student.placeOfBirth}, {formattedBirthDate(student.dateOfBirth || '')}, {className}{levelName ? ` / ${levelName}` : ''}, {groupName}, {teacherName} | SM: {sessionObj?.name} | TA: {academicYearObj?.name} | Achivement: {student.lastAchievement}
          </div>
        )}
      </div>

      {/* Section 3: Certificate Template Editor */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full">
          <div className="bg-white rounded shadow p-4">
            
            {/* Theme, Type, and Certificate ID in one line */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Theme</label>
                <select
                  value={selectedTheme}
                  onChange={handleThemeChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                >
                  <option value="">Select Theme</option>
                  {CERTIFICATE_THEMES.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Type</label>
                {selectedTheme === 1 ? (
                  <select
                    value={selectedCertificateType}
                    onChange={handleCertificateTypeChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="">Select Type</option>
                    {CERTIFICATE_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedItqonExam}
                    onChange={handleItqonExamChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  >
                    <option value="">Select Exam</option>
                    {itqonExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Certificate ID Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificate ID</label>
                <input
                  type="text"
                  value={certificateId}
                  onChange={handleCertificateIdChange}
                  placeholder="Enter certificate ID"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <button
                  onClick={generatePreview}
                  disabled={isPreviewLoading}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isPreviewLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPreviewLoading ? 'Generating...' : 'Generate Preview'}
                </button>
              </div>
              <div className="relative w-full" style={{ height: '500px' }}>
                {isPreviewLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-gray-600">Generating preview...</p>
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-red-500 text-center">
                      <p>{previewError}</p>
                      <button 
                        onClick={generatePreview}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : previewBlob ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <object
                      data={URL.createObjectURL(previewBlob)}
                      type="application/pdf"
                      className="w-full h-full hidden md:block"
                    >
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                        <p className="text-gray-500">Unable to display PDF preview. Please download to view.</p>
                      </div>
                    </object>
                    <a 
                      href={URL.createObjectURL(previewBlob)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="md:hidden px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Open PDF Preview
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Select a student and click Generate Preview to see the certificate</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View | Download | Print */}
      <div className="flex justify-center gap-4 mt-4 no-print">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Download
        </button>        
      </div>
    </div>
    </>
  );
} 