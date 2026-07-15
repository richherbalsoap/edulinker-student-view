import React, { createContext, useState, useContext, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { requestNotificationPermission } from "@/firebase";

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

const LINKED_STUDENT_KEY = "linked_student_id";
const LINKED_SCHOOL_KEY = "linked_school_id";

export const StudentAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on refresh
  useEffect(() => {
    const savedStudentId = localStorage.getItem(LINKED_STUDENT_KEY);
    const savedSchoolId = localStorage.getItem(LINKED_SCHOOL_KEY);
    if (savedStudentId && savedSchoolId) {
      // Fetch student data from apiClient to restore session
      apiClient
        .from("students")
        .select("id, name, standard, section, avatar_url")
        .eq("id", savedStudentId)
        .single()
        .then(({ data, error }) => {
          if (data && !error) {
            setStudent(data);
            setSchoolId(savedSchoolId);
          } else {
            localStorage.removeItem(LINKED_STUDENT_KEY);
            localStorage.removeItem(LINKED_SCHOOL_KEY);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Clear session only when app/tab is fully closed (not on refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Use sessionStorage flag to detect actual close vs refresh
        sessionStorage.setItem('edulinker_active', 'true');
      }
    };

    const handleBeforeUnload = () => {
      // Mark that we're unloading - sessionStorage persists on refresh but clears on tab close
      sessionStorage.setItem('edulinker_active', 'true');
    };

    // On mount: if sessionStorage flag is missing, it means app was closed & reopened
    if (!sessionStorage.getItem('edulinker_active')) {
      localStorage.removeItem(LINKED_STUDENT_KEY);
      localStorage.removeItem(LINKED_SCHOOL_KEY);
    }
    sessionStorage.setItem('edulinker_active', 'true');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = async (secretId: string, rollNo: string) => {
    const rollNoInt = parseInt(rollNo, 10);
    if (isNaN(rollNoInt)) throw new Error("Roll number must be a valid number");

    // Saare students fetch karo same secret_id se (multiple schools ho sakti hain)
    const { data: rows, error } = await apiClient
      .from("students")
      .select("id, name, standard, section, avatar_url, school_id, roll_no, failed_attempts")
      .eq("secret_id", secretId.trim());

    if (error) throw new Error("Invalid Secret ID or Roll Number");
    if (!rows || rows.length === 0) throw new Error("Invalid Secret ID or Roll Number");

    // Roll no se exact match dhundo — yeh school identify karega automatically
    const data = (rows as any[]).find((r) => r.roll_no === rollNoInt) ?? null;

    if (!data) {
      // Secret ID sahi hai but roll_no match nahi — pehli row pe attempts track karo
      const firstRow = rows[0] as any;
      const currentAttempts = firstRow.failed_attempts || 0;
      const newAttempts = currentAttempts + 1;

      await apiClient
        .from("students")
        .update({ failed_attempts: newAttempts } as any)
        .eq("id", firstRow.id);

      if (newAttempts >= 5) throw new Error("TOO_MANY_ATTEMPTS");
      throw new Error(`Invalid Secret ID or Roll Number. ${5 - newAttempts} attempts remaining.`);
    }

    const currentAttempts = (data as any).failed_attempts || 0;

    if (currentAttempts >= 5) {
      throw new Error("TOO_MANY_ATTEMPTS");
    }

    // Login successful — failed_attempts reset karo
    await apiClient
      .from("students")
      .update({ failed_attempts: 0 } as any)
      .eq("id", data.id);

    const { school_id, roll_no, failed_attempts, ...studentData } = data as any;
    setStudent(studentData);
    setSchoolId(school_id);
    localStorage.setItem(LINKED_STUDENT_KEY, data.id);
    localStorage.setItem(LINKED_SCHOOL_KEY, school_id);

    // FCM token — login se bilkul alag, agar fail ho toh login block nahi hoga
    requestNotificationPermission()
      .then(async (fcmToken) => {
        if (fcmToken) {
          await apiClient.from("fcm_tokens").upsert({
            student_id: data.id,
            token: fcmToken,
          });
        }
      })
      .catch((err) => {
        console.error("FCM token save failed:", err);
      });
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
  if (!context) throw new Error("useStudentAuth must be used within StudentAuthProvider");
  return context;
};
