const LS_KEY = 'hs_profile';
const SESSION_KEY = 'hs_session';
const LOCAL_USERS_KEY = 'hs_local_users';
const ADMIN_UIDS_KEY = 'mr_admin_uids';
const DEFAULT_ADMIN_UIDS = ['NObJXNuQ0qXPCJJOUrzCd6r3BLl2'];

const Auth = {
  currentUser: null,
  userProfile: null,
  _initPromise: null,

  getLocalUsers() {
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalUsers(users) {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to persist local users:', e.message);
    }
  },

  getLocalSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setLocalSession(profile) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: profile.uid, email: profile.email, role: profile.role }));
    } catch (e) {
      console.warn('Failed to persist local session:', e.message);
    }
  },

  clearLocalSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  },

  ensureDefaultAdminUids() {
    const existing = this.getAdminUidAllowlist();
    const merged = [...new Set([...DEFAULT_ADMIN_UIDS, ...existing])];
    if (merged.length !== existing.length) {
      this.saveAdminUidAllowlist(merged);
    }
  },

  getAdminUidAllowlist() {
    try {
      const raw = localStorage.getItem(ADMIN_UIDS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(uid => String(uid).trim()) : [];
    } catch {
      return [];
    }
  },

  saveAdminUidAllowlist(uids) {
    try {
      localStorage.setItem(ADMIN_UIDS_KEY, JSON.stringify(uids));
    } catch (e) {
      console.warn('Failed to save admin UID allowlist:', e.message);
    }
  },

  isAdminUidAllowed(uid) {
    if (!uid) return false;
    return this.getAdminUidAllowlist().includes(String(uid).trim());
  },

  applyAdminOverride(profile) {
    if (!profile) return null;
    if (this.isAdminUidAllowed(profile.uid)) {
      profile.role = 'admin';
      profile.status = 'approved';
      this.saveLocal(profile);
    }
    return profile;
  },

  isRemoteAuthAvailable() {
    return typeof window !== 'undefined' && typeof auth !== 'undefined' && typeof auth.signInWithEmailAndPassword === 'function';
  },

  init() {
    if (this._initPromise) return this._initPromise;
    this.ensureDefaultAdminUids();
    this._initPromise = new Promise((resolve) => {
      let attempts = 0;
      const finishWithLocalSession = () => {
        const session = this.getLocalSession();
        if (session && session.uid) {
          this.currentUser = { uid: session.uid, email: session.email, displayName: session.name || session.email };
          this.userProfile = this.loadLocal() || this.getProfileFromSession(session.uid);
          resolve(this.currentUser);
        } else {
          this.currentUser = null;
          this.userProfile = null;
          resolve(null);
        }
      };

      const check = () => {
        if (typeof auth === 'undefined') {
          attempts += 1;
          if (attempts > 40) {
            finishWithLocalSession();
            return;
          }
          setTimeout(check, 150);
          return;
        }

        auth.onAuthStateChanged(async (user) => {
          this.currentUser = user;
          if (user) {
            this.userProfile = await this.getProfile(user.uid) || this.loadLocal();
            this.userProfile = this.applyAdminOverride(this.userProfile || { uid: user.uid, email: user.email, role: 'patient' });
            if (this.userProfile && this.userProfile.role === 'patient' && this.userProfile.patientId) {
              this.ensurePatientRecord(this.userProfile);
            }
            this.setLocalSession(this.userProfile || { uid: user.uid, email: user.email, role: 'patient' });
          } else {
            this.userProfile = null;
            this.clearLocalSession();
          }
          resolve(user);
        });
      };

      check();
    });
    return this._initPromise;
  },

  ensurePatientRecord(profile) {
    if (!profile || profile.role !== 'patient') return;
    const pId = profile.patientId || ('P-' + profile.uid.slice(0, 6).toUpperCase());
    profile.patientId = pId;
    const patientObj = {
      id: pId,
      name: profile.name || 'Patient',
      email: profile.email || '',
      phone: profile.phone || '',
      bloodGroup: profile.bloodGroup || '',
      userId: profile.uid
    };
    if (typeof DB !== 'undefined') {
      const idx = DB.patients.findIndex(p => p.id === pId || p.userId === profile.uid);
      if (idx >= 0) {
        DB.patients[idx] = { ...DB.patients[idx], ...patientObj };
      } else {
        DB.patients.push(patientObj);
      }
      DB.saveCache();
    }
    if (typeof FirestoreService !== 'undefined' && typeof db !== 'undefined') {
      FirestoreService.save('patients', patientObj).catch(() => {});
    }
  },

  async signup(email, password, name, role) {
    const localUsers = this.getLocalUsers();
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = localUsers.find(user => user.email.toLowerCase() === normalizedEmail);

    const createLocalProfile = () => {
      const profile = {
        uid: 'local_' + Date.now().toString(36),
        name,
        email: normalizedEmail,
        role,
        createdAt: new Date().toISOString(),
        password
      };

      if (role === 'patient') {
        profile.patientId = 'P-' + Date.now().toString(36).toUpperCase();
        this.ensurePatientRecord(profile);
      }
      if (role === 'manager') {
        profile.status = 'pending';
      }

      localUsers.push({ email: normalizedEmail, password, profile });
      this.saveLocalUsers(localUsers);
      this.saveLocal(profile);
      this.currentUser = { uid: profile.uid, email: profile.email, displayName: name };
      this.userProfile = profile;
      this.setLocalSession(profile);
      return profile;
    };

    if (!this.isRemoteAuthAvailable()) {
      if (existing) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      return createLocalProfile();
    }

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      await user.updateProfile({ displayName: name });

      const profile = {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      };

      if (role === 'patient') {
        profile.patientId = 'P-' + Date.now().toString(36).toUpperCase();
        this.ensurePatientRecord(profile);
      }
      if (role === 'manager') {
        profile.status = 'pending';
      }

      this.saveLocal(profile);

      try {
        if (typeof db !== 'undefined') {
          await db.collection('users').doc(user.uid).set(profile);
        }
      } catch (e) {
        console.warn('Firestore unavailable, profile saved locally only:', e.message);
      }

      this.currentUser = user;
      this.userProfile = profile;
      this.setLocalSession(profile);
      return profile;
    } catch (e) {
      if (existing) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      if (e && (e.code === 'auth/email-already-in-use' || e.code === 'auth/network-request-failed' || e.code === 'auth/invalid-credential' || e.message && e.message.includes('Missing or insufficient permissions'))) {
        return createLocalProfile();
      }
      if (e && e.message && e.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        return createLocalProfile();
      }
      throw e;
    }
  },

  async login(email, password) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const fallback = !this.isRemoteAuthAvailable();

    if (fallback) {
      const users = this.getLocalUsers();
      const match = users.find(user => user.email.toLowerCase() === normalizedEmail && user.password === password);
      if (!match) {
        throw new Error('Invalid email or password.');
      }
      const profile = this.applyAdminOverride(match.profile || this.loadLocal());
      this.currentUser = { uid: profile.uid, email: profile.email, displayName: profile.name };
      this.userProfile = profile;
      this.setLocalSession(profile);
      if (this.userProfile && this.userProfile.role === 'patient' && this.userProfile.patientId) {
        this.ensurePatientRecord(this.userProfile);
      }
      return this.userProfile;
    }

    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      this.currentUser = cred.user;
      this.userProfile = await this.getProfile(cred.user.uid) || this.loadLocal();
      this.userProfile = this.applyAdminOverride(this.userProfile || { uid: cred.user.uid, email: cred.user.email, role: 'patient' });
      if (this.userProfile && this.userProfile.role === 'patient' && this.userProfile.patientId) {
        this.ensurePatientRecord(this.userProfile);
      }
      this.setLocalSession(this.userProfile || { uid: cred.user.uid, email: cred.user.email, role: 'patient' });
      return this.userProfile;
    } catch (e) {
      const users = this.getLocalUsers();
      const match = users.find(user => user.email.toLowerCase() === normalizedEmail && user.password === password);
      if (match) {
        const profile = this.applyAdminOverride(match.profile);
        this.currentUser = { uid: profile.uid, email: profile.email, displayName: profile.name };
        this.userProfile = profile;
        this.setLocalSession(profile);
        return profile;
      }
      throw e;
    }
  },

  async logout() {
    try { if (this.isRemoteAuthAvailable()) await auth.signOut(); } catch(e) {}
    this.currentUser = null;
    this.userProfile = null;
    this.clearLocalSession();
    Object.keys(localStorage).filter(k => k.startsWith(LS_KEY)).forEach(k => localStorage.removeItem(k));
  },

  async getProfile(uid) {
    try {
      if (typeof db === 'undefined') return null;
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch { return null; }
  },

  getProfileFromSession(uid) {
    try {
      const raw = localStorage.getItem(LS_KEY + '_' + uid);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveLocal(profile) {
    try { localStorage.setItem(LS_KEY + '_' + profile.uid, JSON.stringify(profile)); } catch(e) {}
  },

  loadLocal() {
    try {
      if (!this.currentUser) return null;
      const raw = localStorage.getItem(LS_KEY + '_' + this.currentUser.uid);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  redirectToPanel(profile) {
    if (!profile) { window.location.href = '/login.html'; return; }
    switch (profile.role) {
      case 'patient': window.location.href = '/patient/dashboard.html'; break;
      case 'manager': window.location.href = '/hospital/dashboard.html'; break;
      case 'admin': window.location.href = '/admin/dashboard.html'; break;
      default: window.location.href = '/login.html';
    }
  },

  async requireAuth(redirectTo = '/login.html', maxRetries = 20) {
    await this._initPromise;
    return new Promise((resolve) => {
      let tries = 0;
      const check = () => {
        if (!this.currentUser) {
          window.location.href = redirectTo;
          return;
        }
        if (!this.userProfile) {
          tries++;
          if (tries > maxRetries) {
            window.location.href = redirectTo;
            return;
          }
          setTimeout(check, 300);
          return;
        }
        resolve(this.userProfile);
      };
      check();
    });
  }
};

Auth.init();
