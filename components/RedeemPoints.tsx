'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Redemption } from '@/types/student';
import { usePointsStore } from '@/store/pointsStore';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

const REWARDS = [
  { id: 1, name: 'Beasiswa SPP 1 Pekan', points: 30, icon: '📚' },
  { id: 2, name: 'Piagam Penghargaan', points: 50, icon: '📜' },
  { id: 3, name: 'Beasiswa SPP 1 Bulan', points: 100, icon: '🎓' },
  { id: 4, name: 'Beasiswa SPP 1 Semester', points: 200, icon: '🏆' },
];

export function RedeemPoints() {
  const students = useStore((state) => state.students);
  const redeemPoints = useStore((state) => state.redeemPoints);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedReward, setSelectedReward] = useState<number | null>(null);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  const loadStudentPoints = async () => {
    const { data } = await supabase
      .from('student_total_points')
      .select('*');
    
    if (data) {
      const points = data.reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.student_id] = curr.total_points;
        return acc;
      }, {});
      setStudentPoints(points);
    }
  };

  const reloadAll = async () => {
    await loadStudentPoints();
    await useStore.getState().loadStudents();
  };

  const deleteRedemption = async (redemptionId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    const { error } = await supabase
      .from('redemptions')
      .delete()
      .eq('id', redemptionId);

    if (!error) {
      // Reload points and student data
      loadStudentPoints();
      const student = students.find(s => s.id === selectedStudent);
      if (student) {
        student.redemptions = student.redemptions.filter(r => r.id !== redemptionId);
      }
    }
  };

  useEffect(() => {
    loadStudentPoints();
  }, []);

  const student = students.find(s => s.id === selectedStudent);
  const studentTotalPoints = studentPoints[selectedStudent] || 0;

  const handleRedeem = async () => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (!selectedStudent || selectedReward === null) return;
    
    const reward = REWARDS.find(r => r.id === selectedReward);
    if (!reward || !student || studentTotalPoints < reward.points) return;

    const redemption: Redemption = {
      id: crypto.randomUUID(),
      studentId: selectedStudent,
      reward_name: reward.name,
      points: reward.points,
      redeemed_at: new Date().toISOString(),
      icon: reward.icon
    };

    await redeemPoints(selectedStudent, redemption);
    setSelectedReward(null);
    await reloadAll(); // Reload points and students after redemption
  };

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.name} - ${studentPoints[student.id] || 0} points`
  }));

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Select Student</h2>
        <Select
          options={studentOptions}
          value={studentOptions.find(option => option.value === selectedStudent)}
          onChange={(selected) => setSelectedStudent(selected?.value || '')}
          className="mb-6"
          placeholder="Search and select student..."
          isClearable
        />

        {student && student.redemptions && student.redemptions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Redemption History</h3>
            <div className="space-y-3">
              {student.redemptions.map((redemption) => (
                <div 
                  key={redemption.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{redemption.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{redemption.reward_name}</h4>
                      <p className="text-sm text-gray-500">
                        Redeemed on: {formatDate(redemption.redeemed_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-indigo-600 font-medium">
                      -{redemption.points} points
                    </span>
                    <button
                      onClick={() => deleteRedemption(redemption.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Available Rewards</h2>
        {student ? (
          <div className="space-y-4">
            {REWARDS.map((reward) => (
              <div
                key={reward.id}
                onClick={() => setSelectedReward(reward.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedReward === reward.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                } ${
                  studentTotalPoints < reward.points ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-sm text-gray-500">{reward.points} points</p>
                    </div>
                  </div>
                  {studentTotalPoints >= reward.points ? (
                    <span className="text-green-500">Available</span>
                  ) : (
                    <span className="text-red-500">
                      Need {reward.points - studentTotalPoints} more points
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={handleRedeem}
              disabled={!selectedReward || !student || studentTotalPoints < (REWARDS.find(r => r.id === selectedReward)?.points || 0)}
              className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Redeem Reward
            </button>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Please select a student first</p>
        )}
      </div>
    </div>
  );
}