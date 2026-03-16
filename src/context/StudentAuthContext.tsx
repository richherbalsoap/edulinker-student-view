import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    const savedStudentId = localStorage.getItem(LINKED_STUDENT_KEY);
    const savedSchoolId = localStorage.getItem(LINKED_SCHOOL_KEY);
    if (savedStudentId && savedSchoolId) {
      setSchoolId(savedSchoolId);
      supabase
        .from("students")
        .select("id, name, standard, section, avatar_url")
        .eq("id", savedStudentId)
        .eq("school_id", savedSchoolId)
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
    const rollNoInt = parseInt(rollNo, 10);
    if (isNaN(rollNoInt)) throw new Error("Roll number must be a valid number");

    // Secret ID se student dhundo — roll_no aur failed_attempts bhi fetch karo
    const { data, error } = await supabase
      .from("students")
      .select("id, name, standard, section, avatar_url, school_id, roll_no, failed_attempts")
      .eq("secret_id", secretId.trim())
      .maybeSingle();

    if (error) throw new Error("Failed to verify credentials");
    if (!data) throw new Error("Invalid Secret ID or Roll Number");

    const currentAttempts = (data as any).failed_attempts || 0;

    // 5 ya zyada attempts ho chuke — block karo, admin se milne bolo
    if (currentAttempts >= 5) {
      throw new Error("TOO_MANY_ATTEMPTS");
    }

    // Roll number galat hai
    if ((data as any).roll_no !== rollNoInt) {
      const newAttempts = currentAttempts + 1;
      await supabase
        .from("students")
        .update({ failed_attempts: newAttempts } as any)
        .eq("id", data.id);

      if (newAttempts >= 5) {
        throw new Error("TOO_MANY_ATTEMPTS");
      }
      throw new Error(`Invalid Secret ID or Roll Number. ${5 - newAttempts} attempts remaining.`);
    }

    // Login successful — failed_attempts reset karo
    await supabase
      .from("students")
      .update({ failed_attempts: 0 } as any)
      .eq("id", data.id);

    const { school_id, roll_no, failed_attempts, ...studentData } = data as any;
    setStudent(studentData);
    setSchoolId(school_id);
    localStorage.setItem(LINKED_STUDENT_KEY, data.id);
    localStorage.setItem(LINKED_SCHOOL_KEY, school_id);

    // FCM token save karo Supabase mein
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        await supabase.from("fcm_tokens").upsert({
          student_id: data.id,
          token: fcmToken,
        });
      }
    } catch (err) {
      console.error("FCM token save failed:", err);
    }
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
