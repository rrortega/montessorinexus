import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  loginUser, 
  updateAdminPassword, 
  updateUserProfile,
  SchoolMembership, 
  Role,
  getActiveSchoolId 
} from '@/lib/sqlite';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  userEmail: string | null;
  role: Role;
  memberships: SchoolMembership[];
  activeMembership: SchoolMembership | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchSchool: (schoolId: string) => void;
  changePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (fullName: string, phone?: string, extra?: Record<string, any>) => Promise<{ success: boolean; user?: any; membership?: any; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = 'ceiba_user_session';
const MEMBERSHIPS_KEY = 'ceiba_user_memberships';
const ACTIVE_MEMBERSHIP_KEY = 'ceiba_active_membership';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [memberships, setMemberships] = useState<SchoolMembership[]>(() => {
    const saved = localStorage.getItem(MEMBERSHIPS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeMembership, setActiveMembership] = useState<SchoolMembership | null>(() => {
    const saved = localStorage.getItem(ACTIVE_MEMBERSHIP_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;
  const userEmail = user?.email || null;
  const role: Role = activeMembership?.role || 'STAFF';

  // Keep localStorage in sync with active school headers and synchronize superadmin schools
  useEffect(() => {
    if (activeMembership) {
      localStorage.setItem('ceiba_active_school_id', activeMembership.schoolId);
      localStorage.setItem('ceiba_active_school_slug', activeMembership.school.slug);
    }

    // If logged in as global SaaS superadmin, keep all schools synchronized in memberships list
    async function syncSuperadminSchools() {
      const superAdminEmail = (import.meta.env.VITE_SUPERADMIN_EMAIL || 'admin@montessorinexus.com').trim().toLowerCase();
      if (user && user.email?.toLowerCase() === superAdminEmail) {
        try {
          const res = await fetch('/api/schools');
          if (res.ok) {
            const allSchools: any[] = await res.json();
            setMemberships(prev => {
              const map = new Map<string, SchoolMembership>();
              prev.forEach(m => map.set(m.schoolId, m));
              allSchools.forEach(s => {
                if (!map.has(s.id)) {
                  map.set(s.id, {
                    id: `mem_${s.id}`,
                    userId: user.id,
                    schoolId: s.id,
                    role: 'OWNER',
                    hasActiveEnrollment: true,
                    school: s
                  });
                } else {
                  const existing = map.get(s.id)!;
                  map.set(s.id, { ...existing, school: s });
                }
              });
              const updated = Array.from(map.values());
              localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(updated));
              return updated;
            });
          }
        } catch (err) {
          console.error('Error syncing schools:', err);
        }
      }
    }

    syncSuperadminSchools();
  }, [user, role, activeMembership]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await loginUser(email.trim().toLowerCase(), pass);
      if (res.success && res.user && res.memberships) {
        setUser(res.user as any);
        setMemberships(res.memberships);
        
        const savedSchoolId = localStorage.getItem('ceiba_active_school_id');
        const active = (savedSchoolId && res.memberships.find((m: any) => m.schoolId === savedSchoolId)) 
          || res.activeMembership 
          || res.memberships[0] 
          || null;
        setActiveMembership(active);

        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(res.user));
        localStorage.setItem('ceiba_user_email', res.user.email);
        localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(res.memberships));
        if (active) {
          localStorage.setItem(ACTIVE_MEMBERSHIP_KEY, JSON.stringify(active));
          localStorage.setItem('ceiba_active_school_id', active.schoolId);
          localStorage.setItem('ceiba_active_school_slug', active.school.slug);
        }

        return { success: true };
      } else {
        return { success: false, error: res.error || 'Credenciales inválidas.' };
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error al verificar credenciales en base de datos.' };
    }
  };

  const switchSchool = async (schoolId: string) => {
    let target = memberships.find(m => m.schoolId === schoolId);
    
    if (!target) {
      try {
        const res = await fetch('/api/schools');
        if (res.ok) {
          const schools = await res.json();
          const s = schools.find((sc: any) => sc.id === schoolId);
          if (s) {
            target = {
              id: `mem_${s.id}`,
              userId: user?.id || '',
              schoolId: s.id,
              role: (role === 'OWNER' || role === 'ADMIN') ? role : 'OWNER',
              hasActiveEnrollment: true,
              school: s
            };
          }
        }
      } catch (err) {
        console.error('Error finding school for switch:', err);
      }
    }

    if (target) {
      setActiveMembership(target);
      localStorage.setItem(ACTIVE_MEMBERSHIP_KEY, JSON.stringify(target));
      localStorage.setItem('ceiba_active_school_id', target.schoolId);
      localStorage.setItem('ceiba_active_school_slug', target.school.slug);
      window.location.reload();
    }
  };

  const logout = () => {
    setUser(null);
    setMemberships([]);
    setActiveMembership(null);
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem('ceiba_user_email');
    localStorage.removeItem(MEMBERSHIPS_KEY);
    localStorage.removeItem(ACTIVE_MEMBERSHIP_KEY);
  };

  const changePassword = async (newPass: string) => {
    if (!userEmail) return { success: false, error: 'No hay sesión activa.' };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    try {
      await updateAdminPassword(userEmail, newPass);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error actualizando contraseña.' };
    }
  };

  const updateProfile = async (fullName: string, phone?: string, extra?: Record<string, any>) => {
    if (!userEmail) return { success: false, error: 'No hay sesión activa.' };
    try {
      const updated = await updateUserProfile(userEmail, fullName, phone, extra);
      const resUser = updated.user || updated;
      setUser(prev => prev ? { 
        ...prev, 
        fullName: resUser.fullName || fullName, 
        phone: resUser.phone || phone,
        avatarUrl: resUser.avatarUrl !== undefined ? resUser.avatarUrl : prev.avatarUrl
      } : null);
      if (user) {
        const newUser = { 
          ...user, 
          fullName: resUser.fullName || fullName, 
          phone: resUser.phone || phone,
          avatarUrl: resUser.avatarUrl !== undefined ? resUser.avatarUrl : user.avatarUrl
        };
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
      }
      return { success: true, user: resUser, membership: updated.membership };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Error actualizando perfil.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      userEmail, 
      role,
      memberships, 
      activeMembership, 
      login, 
      logout, 
      switchSchool,
      changePassword,
      updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth: Context is undefined. Returning default fallback auth.');
    return {
      isAuthenticated: false,
      user: null,
      userEmail: '',
      role: 'STAFF' as Role,
      memberships: [],
      activeMembership: null,
      login: async () => ({ success: false }),
      logout: () => {},
      switchSchool: () => {},
      changePassword: async () => ({ success: false, error: 'Auth not initialized' }),
      updateProfile: async () => ({ success: false, error: 'Auth not initialized' }),
    };
  }
  return context;
};
