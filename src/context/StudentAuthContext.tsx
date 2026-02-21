import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  id: string;
  name: string;
  standard: string;
  section: string;
  avatar_url: string | null;
}

interface SchoolData {
  id: string;
  school_name: string;
}

interface StudentAuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  student: StudentData | null;
  schoolId: string | null;
  schools: SchoolData[];
  fetchSchools: () => Promise<void>;
  login: (schoolId: string, secretId: string) => Promise<void>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

const LINKED_STUDENT_KEY = 'linked_student_id';
const LINKED_SCHOOL_KEY = 'linked_school_id';

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  // On mount, restore from localStorage
  useEffect(() => {
    const savedStudentId = localStorage.getItem(LINKED_STUDENT_KEY);
    const savedSchoolId = localStorage.getItem(LINKED_SCHOOL_KEY);
    if (savedStudentId && savedSchoolId) {
      setSchoolId(savedSchoolId);
      // Fetch student data to validate it still exists
      supabase
        .from('students')
        .select('id, name, standard, section, avatar_url')
        .eq('id', savedStudentId)
        .eq('school_id', savedSchoolId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setStudent(data);
          } else {
            // Invalid — clear
            localStorage.removeItem(LINKED_STUDENT_KEY);
            localStorage.removeItem(LINKED_SCHOOL_KEY);
            setSchoolId(null);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    const { data } = await supabase
      .from('schools')
      .select('id, school_name')
      .order('school_name', { ascending: true });
    setSchools(data || []);
  }, []);

  const login = async (selectedSchoolId: string, secretId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, standard, section, avatar_url')
      .eq('secret_id', secretId)
      .eq('school_id', selectedSchoolId)
      .maybeSingle();

    if (error) throw new Error('Failed to verify Secret ID');
    if (!data) throw new Error('Invalid Secret ID or School. No student found.');

    setStudent(data);
    setSchoolId(selectedSchoolId);
    localStorage.setItem(LINKED_STUDENT_KEY, data.id);
    localStorage.setItem(LINKED_SCHOOL_KEY, selectedSchoolId);
  };

  const logout = () => {
    localStorage.removeItem(LINKED_STUDENT_KEY);
    localStorage.removeItem(LINKED_SCHOOL_KEY);
    setStudent(null);
    setSchoolId(null);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        isLoggedIn: !!student && !!schoolId,
        loading,
        student,
        schoolId,
        schools,
        fetchSchools,
        login,
        logout,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
};

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error('useStudentAuth must be used within StudentAuthProvider');
  return context;
};
