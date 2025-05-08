export interface BillingRecord {
  id: string;
  academicYearId: string;
  studentId: string;
  month: string;
  status: 'paid' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

export interface BillingSettings {
  id: string;
  academicYearId: string;
  monthlyPrice: number;
  billingTarget: number;
  targetPercentage: number;
  startYear: number;
  endYear: number;
  createdAt: string;
  updatedAt: string;
} 