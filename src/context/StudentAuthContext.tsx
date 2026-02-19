import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface StudentData {
  id: string;
  name: string;
  standard: string;
  section: string;
  avatar_url: string | null;
}

interface StudentAuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  student: StudentData | null;
  isStudentLinked: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  linkStudent: (secretId: string) => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

const LINKED_STUDENT_KEY = 'linked_student_id';

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentData | null>(null);

  const fetchStudentById = async (studentId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, standard, section, avatar_url')
      .eq('id', studentId)
      .maybeSingle();
    if (data && !error) {
      setStudent(data);
    } else {
      // Student record no longer exists, clear localStorage
      localStorage.removeItem(LINKED_STUDENT_KEY);
      setStudent(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setStudent(null);
        localStorage.removeItem(LINKED_STUDENT_KEY);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        const savedStudentId = localStorage.getItem(LINKED_STUDENT_KEY);
        if (savedStudentId) {
          fetchStudentById(savedStudentId);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    localStorage.removeItem(LINKED_STUDENT_KEY);
    setStudent(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const linkStudent = async (secretId: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, standard, section, avatar_url')
      .eq('secret_id', secretId)
      .maybeSingle();

    if (error) throw new Error('Failed to verify Secret ID');
    if (!data) throw new Error('Invalid Secret ID. No student found.');

    setStudent(data);
    localStorage.setItem(LINKED_STUDENT_KEY, data.id);
  };

  return (
    <StudentAuthContext.Provider
      value={{
        isLoggedIn: !!session,
        user,
        session,
        loading,
        student,
        isStudentLinked: !!student,
        login,
        logout,
        linkStudent,
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
