import { Student } from '@/types/student';

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }
  return value;
}

export function toStudentDbPayload(student: Student) {
  return {
    name: student.name,
    gender: student.gender,
    address: student.address,
    class_id: student.class_id,
    level_id: student.level_id,
    father_name: emptyToNull(student.father_name),
    mother_name: emptyToNull(student.mother_name),
    wali_name: emptyToNull(student.wali_name),
    school_info: emptyToNull(student.school_info),
    profile_image_url: student.profileImageUrl || null,
    profile_picture: student.profilePicture || null,
    status: student.status,
    place_of_birth: emptyToNull(student.placeOfBirth),
    date_of_birth: emptyToNull(student.dateOfBirth),
    phone_number: emptyToNull(student.phoneNumber),
    last_achievement: emptyToNull(student.lastAchievement),
    total_pages: student.totalPages || 0,
    registration_number: emptyToNull(student.registration_number),
    national_id: emptyToNull(student.national_id),
    family_id: emptyToNull(student.family_id),
    joined_date: emptyToNull(student.joined_date),
    notes: emptyToNull(student.notes),
  };
}

const DEFAULT_REGISTRATION_ERROR =
  'The system failed to register the student. Please check your entries and try again, or contact your administrator if the problem continues.';

export function getStudentRegistrationErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return DEFAULT_REGISTRATION_ERROR;
  }

  const err = error as { code?: string; message?: string };

  if (err.code === '22007' || err.message?.includes('invalid input syntax for type date')) {
    return 'One or more date fields are invalid. Please fill in Date of Birth and Joined Date, then try again.';
  }

  if (err.code === '23502') {
    return 'Some required information is missing. Please review the required fields and try again.';
  }

  if (err.code === '23505') {
    return 'A student with this information already exists. Please check NISP or other unique details, then try again.';
  }

  if (err.code === '23503') {
    return 'The selected class or level is no longer valid. Please choose another option and try again.';
  }

  return DEFAULT_REGISTRATION_ERROR;
}
