import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  id: string;
  name: string;
  standard: string;
  section: string;
  avatar_url: string | null;
}

interface StudentAuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  student: StudentData | null;
  schoolId: string | null;
  login: (secretId: string, rollNo: string) => Promise<void>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

const LINKED_STUDENT_KEY = 'linked_student_id';
const LINKED_SCHOOL_KEY = 'linked_school_id';

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore from localStorage
  useEffect(() => {
    const savedStudentId = localStorage.getItem(LINKED_STUDENT_KEY);
    const savedSchoolId = localStorage.getItem(LINKED_SCHOOL_KEY);
    if (savedStudentId && savedSchoolId) {
      setSchoolId(savedSchoolId);
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

  const login = async (secretId: string, rollNo: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, standard, section, avatar_url, school_id')
      .eq('secret_id', secretId)
      .eq('roll_no', rollNo)
      .maybeSingle();

    if (error) throw new Error('Failed to verify credentials');
    if (!data) throw new Error('Invalid secret key or roll number');

    const { school_id, ...studentData } = data;
    setStudent(studentData);
    setSchoolId(school_id);
    localStorage.setItem(LINKED_STUDENT_KEY, data.id);
    localStorage.setItem(LINKED_SCHOOL_KEY, school_id);
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
