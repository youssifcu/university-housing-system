import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: null,
  profile: null,
  studentProfile: null,
  isAuthenticated: false,
  applicationStatus: null,
  notifications: [],
  unreadCount: 0,
  bookings: [],
  announcements: [],
  applications: [],

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setProfile: (profile) => set((state) => ({ 
    profile: profile ? { ...state.profile, ...profile } : null 
  })),

  setStudentProfile: (studentProfile) => set({ studentProfile }),

  clearUser: () => set({ 
    user: null, 
    profile: null, 
    studentProfile: null,
    isAuthenticated: false,
    applicationStatus: null 
  }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0,
    }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markNotificationRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  setApplicationStatus: (status) => set({ applicationStatus: status }),

  setBookings: (bookings) => set({ bookings }),

  updateBooking: (updatedBooking) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b
      ),
    })),

  removeBooking: (id) =>
    set((state) => ({
      bookings: state.bookings.filter((b) => b._id !== id),
    })),

  setAnnouncements: (announcements) => set({ announcements }),

  setApplications: (applications) => set({ 
    applications,
    applicationStatus: applications.length > 0 ? applications[0].status : null
  }),

  updateApplication: (updated) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a._id === updated._id ? { ...a, ...updated } : a
      ),
      applicationStatus: updated.status 
    })),
}));