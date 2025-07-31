import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('id-ID', { month: 'long' });
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}; 

export function generateWeeksFromAcademicYear(startDate: string, endDate: string): Array<{week: number, year: number, label: string, startDate: Date}> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weeks: Array<{week: number, year: number, label: string, startDate: Date}> = [];
  
  // ISO week calculation function
  const getISOWeek = (date: Date): number => {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(d.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  
  let currentDate = new Date(start);
  currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Start from Monday
  
  while (currentDate <= end) {
    const weekNumber = getISOWeek(currentDate);
    const year = currentDate.getFullYear();
    
    weeks.push({
      week: weekNumber,
      year: year,
      label: `${weekNumber}-${year}`,
      startDate: new Date(currentDate)
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks;
}

export function getWeekDates(weekLabel: string, academicYearStartDate: string, academicYearEndDate: string): Array<{day: string, date: string, fullDate: Date}> | null {
  const weeks = generateWeeksFromAcademicYear(academicYearStartDate, academicYearEndDate);
  const selectedWeek = weeks.find(w => w.label === weekLabel);
  
  if (!selectedWeek) return null;
  
  const dates: Array<{day: string, date: string, fullDate: Date}> = [];
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  
  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(selectedWeek.startDate);
    currentDate.setDate(selectedWeek.startDate.getDate() + i);
    
    const day = dayNames[i];
    const date = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`;
    
    dates.push({
      day,
      date,
      fullDate: currentDate
    });
  }
  
  return dates;
} 