'use client';

import { useState, useEffect } from 'react';
import { SchoolSettings, NameValuePair } from '@/types/school';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import { useSchoolSettingsStore } from '@/store/schoolSettingsStore';

export default function SchoolSettingsPage() {
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const {
    schoolSettings,
    loadSchoolSettings,
    saveOrUpdateSchoolSettings,
    deleteSchoolSettings
  } = useSchoolSettingsStore();

  const [facilities, setFacilities] = useState<NameValuePair[]>([{ name: '', value: '' }]);
  const [studentCount, setStudentCount] = useState<NameValuePair[]>([{ name: '', value: '' }]);
  const [staffCount, setStaffCount] = useState<NameValuePair[]>([{ name: '', value: '' }]);
  const [bankAccount, setBankAccount] = useState<NameValuePair[]>([{ name: '', value: '' }]);

  const [formData, setFormData] = useState<Partial<SchoolSettings>>({
    name: '',
    accountNumber: '',
    principalName: '',
    establishedYear: new Date().getFullYear(),
    address: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
    email: '',
    websiteUrl: '',
    schoolCode: '',
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    loadSchoolSettings();
  }, [loadSchoolSettings]);

  useEffect(() => {
    if (schoolSettings) {
      setFormData({
        name: schoolSettings.name,
        accountNumber: schoolSettings.accountNumber,
        principalName: schoolSettings.principalName,
        establishedYear: schoolSettings.establishedYear,
        address: schoolSettings.address,
        city: schoolSettings.city,
        stateProvince: schoolSettings.stateProvince,
        postalCode: schoolSettings.postalCode,
        country: schoolSettings.country,
        phoneNumber: schoolSettings.phoneNumber,
        email: schoolSettings.email,
        websiteUrl: schoolSettings.websiteUrl,
        schoolCode: schoolSettings.schoolCode,
        latitude: schoolSettings.latitude,
        longitude: schoolSettings.longitude
      });
      setFacilities(schoolSettings.facilities || [{ name: '', value: '' }]);
      setStudentCount(schoolSettings.studentCount || [{ name: '', value: '' }]);
      setStaffCount(schoolSettings.staffCount || [{ name: '', value: '' }]);
      setBankAccount(schoolSettings.bankAccount || [{ name: '', value: '' }]);
    }
  }, [schoolSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    const payload = {
      ...formData,
      facilities: facilities.filter(f => f.name && f.value),
      studentCount: studentCount.filter(s => s.name && s.value),
      staffCount: staffCount.filter(s => s.name && s.value),
      bankAccount: bankAccount.filter(b => b.name && b.value)
    } as SchoolSettings;
    
    const { error } = await saveOrUpdateSchoolSettings(payload);
    if (!error) {
      alert('Settings saved successfully!');
      loadSchoolSettings();
    } else {
      alert('Error saving settings. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<NameValuePair[]>>,
    type: 'name' | 'value',
    value: string
  ) => {
    setter(prev => {
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], [type]: value };
      return newArray;
    });
  };

  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<NameValuePair[]>>) => {
    setter(prev => [...prev, { name: '', value: '' }]);
  };

  const removeArrayItem = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<NameValuePair[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (schoolSettings && schoolSettings.id) {
      await deleteSchoolSettings(schoolSettings.id);
      setFormData({
        name: '',
        accountNumber: '',
        principalName: '',
        establishedYear: new Date().getFullYear(),
        address: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        country: '',
        phoneNumber: '',
        email: '',
        websiteUrl: '',
        schoolCode: '',
        latitude: 0,
        longitude: 0
      });
      setFacilities([{ name: '', value: '' }]);
      setStudentCount([{ name: '', value: '' }]);
      setStaffCount([{ name: '', value: '' }]);
      setBankAccount([{ name: '', value: '' }]);
      alert('Settings deleted successfully!');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">School Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Principal Name</label>
              <input
                type="text"
                name="principalName"
                value={formData.principalName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Established Year</label>
              <input
                type="number"
                name="establishedYear"
                value={formData.establishedYear}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">School Code</label>
              <input
                type="text"
                name="schoolCode"
                value={formData.schoolCode}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State/Province</label>
              <input
                type="text"
                name="stateProvince"
                value={formData.stateProvince}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Facilities</label>
              <button
                type="button"
                onClick={() => addArrayItem(setFacilities)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Add Facility
              </button>
            </div>
            {facilities.map((facility, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={facility.name}
                    onChange={(e) => handleArrayChange(index, setFacilities, 'name', e.target.value)}
                    placeholder="Facility Name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={facility.value}
                    onChange={(e) => handleArrayChange(index, setFacilities, 'value', e.target.value)}
                    placeholder="Value"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, setFacilities)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Student Count */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Student Count</label>
              <button
                type="button"
                onClick={() => addArrayItem(setStudentCount)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Add Count
              </button>
            </div>
            {studentCount.map((count, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={count.name}
                    onChange={(e) => handleArrayChange(index, setStudentCount, 'name', e.target.value)}
                    placeholder="Category"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={count.value}
                    onChange={(e) => handleArrayChange(index, setStudentCount, 'value', e.target.value)}
                    placeholder="Count"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, setStudentCount)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Staff Count */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Staff Count</label>
              <button
                type="button"
                onClick={() => addArrayItem(setStaffCount)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Add Count
              </button>
            </div>
            {staffCount.map((count, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={count.name}
                    onChange={(e) => handleArrayChange(index, setStaffCount, 'name', e.target.value)}
                    placeholder="Category"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={count.value}
                    onChange={(e) => handleArrayChange(index, setStaffCount, 'value', e.target.value)}
                    placeholder="Count"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, setStaffCount)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Bank Account */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Bank Account</label>
              <button
                type="button"
                onClick={() => addArrayItem(setBankAccount)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Add Account
              </button>
            </div>
            {bankAccount.map((account, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={account.name}
                    onChange={(e) => handleArrayChange(index, setBankAccount, 'name', e.target.value)}
                    placeholder="Bank Name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={account.value}
                    onChange={(e) => handleArrayChange(index, setBankAccount, 'value', e.target.value)}
                    placeholder="Account Number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, setBankAccount)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
            {schoolSettings && schoolSettings.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Settings
              </button>
            )}
          </div>
        </form>
      </div>

      {schoolSettings && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">School Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <dl className="space-y-2">
                <dt className="font-medium">School Name</dt>
                <dd className="text-gray-600">{schoolSettings.name}</dd>
                <dt className="font-medium">Principal</dt>
                <dd className="text-gray-600">{schoolSettings.principalName}</dd>
                <dt className="font-medium">Established</dt>
                <dd className="text-gray-600">{schoolSettings.establishedYear}</dd>
                <dt className="font-medium">School Code</dt>
                <dd className="text-gray-600">{schoolSettings.schoolCode}</dd>
                <dt className="font-medium">Account Number</dt>
                <dd className="text-gray-600">{schoolSettings.accountNumber}</dd>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Contact Information</h3>
              <dl className="space-y-2">
                <dt className="font-medium">Address</dt>
                <dd className="text-gray-600">{schoolSettings.address}</dd>
                <dt className="font-medium">City</dt>
                <dd className="text-gray-600">{schoolSettings.city}</dd>
                <dt className="font-medium">Phone</dt>
                <dd className="text-gray-600">{schoolSettings.phoneNumber}</dd>
                <dt className="font-medium">Email</dt>
                <dd className="text-gray-600">{schoolSettings.email}</dd>
                <dt className="font-medium">Website</dt>
                <dd className="text-gray-600">{schoolSettings.websiteUrl}</dd>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Facilities</h3>
              <dl className="space-y-2">
                {schoolSettings.facilities?.map((facility, index) => (
                  <div key={index}>
                    <dt className="font-medium">{facility.name}</dt>
                    <dd className="text-gray-600">{facility.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Student Count</h3>
              <dl className="space-y-2">
                {schoolSettings.studentCount?.map((count, index) => (
                  <div key={index}>
                    <dt className="font-medium">{count.name}</dt>
                    <dd className="text-gray-600">{count.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Staff Count</h3>
              <dl className="space-y-2">
                {schoolSettings.staffCount?.map((count, index) => (
                  <div key={index}>
                    <dt className="font-medium">{count.name}</dt>
                    <dd className="text-gray-600">{count.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Bank Accounts</h3>
              <dl className="space-y-2">
                {schoolSettings.bankAccount?.map((account, index) => (
                  <div key={index}>
                    <dt className="font-medium">{account.name}</dt>
                    <dd className="text-gray-600">{account.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}