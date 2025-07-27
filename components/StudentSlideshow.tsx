'use client';

import { useState, useEffect } from 'react';
import { Student } from '@/types/student';
import { ItqonExam } from '@/types/exam';
import { useSchoolStore } from '@/store/schoolStore';
import { formatDate } from '@/lib/utils';

interface StudentSlideshowProps {
  students: Student[];
  getLatestExam: (studentId: string) => ItqonExam | undefined;
}

export function StudentSlideshow({ students, getLatestExam }: StudentSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [genderFilter, setGenderFilter] = useState('');
  const [examFilter, setExamFilter] = useState<'all' | 'with_exam' | 'without_exam'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);

  // Filter students based on all criteria
  const filteredStudents = students.filter(student => {
    // Apply gender filter
    if (genderFilter && student.gender !== genderFilter) return false;
    
    // Apply level filter
    if (selectedLevel && student.level_id !== selectedLevel) return false;
    
    // Apply status filter
    if (statusFilter === 'active' && !student.status) return false;
    if (statusFilter === 'inactive' && student.status) return false;
    
    // Apply class filter
    if (selectedClass && student.class_id !== selectedClass) return false;
    
    // Apply search filter
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Apply exam filter
    const hasExam = getLatestExam(student.id);
    if (examFilter === 'with_exam' && !hasExam) return false;
    if (examFilter === 'without_exam' && hasExam) return false;
    
    return true;
  });

  // Reset current index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedLevel, selectedClass, statusFilter, examFilter, searchQuery]);

  const currentStudent = filteredStudents[currentIndex];

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        nextSlide();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousSlide();
      } else if (event.key === 'Escape') {
        setIsFullscreen(false);
      } else if (event.key === 'f' || event.key === 'F') {
        toggleFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isFullscreen, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredStudents.length);
  };

  const previousSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredStudents.length) % filteredStudents.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-600 text-white';
      case 'Scheduled':
        return 'bg-yellow-500 text-black';
      case 'Failed':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const getStudentClass = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'Unknown Class';
  };

  const getStudentLevel = (levelId: string) => {
    return levels.find(l => l.id === levelId)?.name || 'Unknown Level';
  };

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order);

  if (filteredStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500 text-xl mb-4">No students found with current filters</p>
          <button
            onClick={() => {
              setSelectedLevel('');
              setSelectedClass('');
              setStatusFilter('all');
              setExamFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  if (!currentStudent) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500 text-xl">No students to display</p>
      </div>
    );
  }

  const latestExam = getLatestExam(currentStudent.id);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      {/* Filters - Only show when not in fullscreen */}
      {!isFullscreen && (
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="Search students by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Semua Gender</option>
              <option value="Ikhwan">Ikhwan</option>
              <option value="Akhwat">Akhwat</option>
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              {activeLevels.map(level => (
                <option key={level.id} value={level.id}>
                  Level {level.name}
                </option>
              ))}
            </select>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Classes</option>
              {classes.map(class_ => (
                <option key={class_.id} value={class_.id}>
                  {class_.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Students</option>
              <option value="active">Active Students</option>
              <option value="inactive">Non-Active Students</option>
            </select>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value as 'all' | 'with_exam' | 'without_exam')}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="with_exam">Sudah Itqon</option>
              <option value="without_exam">Belum Itqon</option>
            </select>
            <div className="flex items-center">
              <span className="bg-white rounded-lg px-4 py-2 shadow text-sm font-semibold ml-2">
                {filteredStudents.length} / {students.length}
              </span>
            </div>
          </div>
          {/* Filter Summary */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </div>
            <button
              onClick={() => {
                setSelectedLevel('');
                setSelectedClass('');
                setStatusFilter('active');
                setExamFilter('all');
                setSearchQuery('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={previousSlide}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-colors"
          title="Previous (←)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-colors"
          title="Next (→ or Space)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-lg hover:bg-white transition-colors"
          title="Toggle Fullscreen (F)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
      {/* Slide Counter */}
      <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
        <span className="text-sm font-medium">
          {currentIndex + 1} / {filteredStudents.length}
        </span>
      </div>
      {/* Student Information */}
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left Side - Photo and Basic Info */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center space-y-6">
            {/* Profile Image */}
            <div className="relative flex justify-center items-center w-full">
              {/* Show SVG avatar above name if no profile picture, otherwise show SVG as background only */}
              {(!currentStudent.profile_picture && !currentStudent.profilePicture) && (
                currentStudent.gender === 'Ikhwan' ? (
                  <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl bg-white">
                    <circle cx="96" cy="96" r="96" fill="#E5E7EB"/>
                    <ellipse cx="96" cy="130" rx="56" ry="38" fill="#A3A3A3"/>
                    <circle cx="96" cy="88" r="40" fill="#F3F4F6"/>
                    <rect x="60" y="50" width="72" height="24" rx="12" fill="#1E293B"/>
                  </svg>
                ) : (
                  <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl bg-white">
                    <circle cx="96" cy="96" r="96" fill="#E5E7EB"/>
                    <ellipse cx="96" cy="140" rx="56" ry="38" fill="#A3A3A3"/>
                    <path d="M56 120 Q96 60 136 120 Q116 100 76 120 Z" fill="#F3F4F6"/>
                    <path d="M56 120 Q96 60 136 120 Q116 100 76 120 Z" fill="#F3F4F6"/>
                    <path d="M56 120 Q96 80 136 120 Q116 110 76 120 Z" fill="#64748B"/>
                    <circle cx="96" cy="100" r="32" fill="#F3F4F6"/>
                  </svg>
                )
              )}
            </div>
            {/* Student Name */}
            <div>
              <h1 className="text-6xl font-bold text-gray-900 mb-2">
                {currentStudent.name}
              </h1>
              {/* Show profile picture under name if present */}
              {(currentStudent.profile_picture || currentStudent.profilePicture) && (
                <img
                  src={currentStudent.profile_picture || currentStudent.profilePicture}
                  alt="Profile"
                  className="mx-auto mb-4 w-48 h-48 rounded-full object-cover border-4 border-white shadow-xl"
                />
              )}
              <div className="flex items-center justify-center gap-4 text-lg text-gray-600">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentStudent.gender === 'Ikhwan' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-pink-100 text-pink-800'
                }`}>
                  {currentStudent.gender}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                  {getStudentClass(currentStudent.class_id)}
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                  Level {getStudentLevel(currentStudent.level_id)}
                </span>
              </div>
            </div>

            {/* Itqon Status */}
            {latestExam && (
              <div className="mt-4">
                <span className={`text-lg px-4 py-2 rounded-full font-medium ${getStatusStyle(latestExam.status)}`}>
                  {latestExam.exam?.name}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Right Side - Detailed Information */}
        <div className="flex-1 p-8 bg-white overflow-y-auto flex items-center justify-center">
          <div className="space-y-8 text-center w-full">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-lg font-medium text-gray-500">Tempat Tanggal Lahir</label>
                <p className="text-2xl text-gray-900 mt-2 font-medium">
                  {currentStudent.placeOfBirth || 'Not provided'}
                  {currentStudent.placeOfBirth && currentStudent.dateOfBirth && ', '}
                  {currentStudent.dateOfBirth ? formatDate(currentStudent.dateOfBirth) : ''}
                </p>
              </div>
              <div>
                <label className="text-lg font-medium text-gray-500">Alamat</label>
                <p className="text-2xl text-gray-900 mt-2 font-medium">{currentStudent.address || 'Not provided'}</p>
              </div>
            </div>

            {/* Parent Information */}
            <div className="space-y-6">
              <div>
                <label className="text-xl font-medium text-gray-500">Nama Ayah</label>
                <p className="text-4xl text-gray-900 mt-3 font-bold">
                  {currentStudent.father_name ? `Bp. ${currentStudent.father_name}` : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-xl font-medium text-gray-500">Nama Ibu</label>
                <p className="text-4xl text-gray-900 mt-3 font-bold">
                  {currentStudent.mother_name ? `Ibu ${currentStudent.mother_name}` : 'Not provided'}
                </p>
              </div>
            </div>

            {/* Last Achievement */}
            <div>
              <label className="text-xl font-medium text-gray-500">Pencapaian Terakhir</label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-3">
                <p className="text-2xl text-gray-900 font-medium">
                  {currentStudent.lastAchievement || 'No achievements recorded yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 