const DB_CACHE_KEY = 'mr_db_cache';
const DB_CACHE_VERSION = 3;

const DB = {
  hospitals: [],
  doctors: [],
  patients: [],
  appointments: [],
  medicines: [],
  bills: [],
  reports: [],
  beds: [],
  prescriptions: [],
  ready: false,
  _readyResolvers: [],
  _listeners: [],

  onReady(cb) {
    if (this.ready) { cb(); return; }
    this._readyResolvers.push(cb);
  },

  subscribe(cb) {
    this._listeners.push(cb);
  },

  notifyChange() {
    this.saveCache();
    this._listeners.forEach(cb => {
      try { cb(); } catch(e) { console.error('Listener error:', e); }
    });
  },

  saveCache() {
    try {
      const data = { _v: DB_CACHE_VERSION };
      ['hospitals','doctors','patients','appointments','medicines','bills','reports','beds','prescriptions'].forEach(k => { data[k] = this[k]; });
      localStorage.setItem(DB_CACHE_KEY, JSON.stringify(data));
    } catch(e) { console.warn('Cache save failed:', e.message); }
  },

  loadCache() {
    try {
      const raw = localStorage.getItem(DB_CACHE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data._v !== DB_CACHE_VERSION) {
        localStorage.removeItem(DB_CACHE_KEY);
        return false;
      }
      ['hospitals','doctors','patients','appointments','medicines','bills','reports','beds','prescriptions'].forEach(k => {
        if (data[k]) this[k] = data[k];
      });
      return true;
    } catch(e) { return false; }
  },

  seedDefaultData() {
    if (this.hospitals.length === 0) {
      this.hospitals = [
        {
          id: 'h_city_care',
          name: 'City Care Multi-Specialty Hospital',
          address: '12 Health Avenue, Metro City, 400001',
          phone: '+91 98765 11111',
          email: 'contact@citycarehospital.org',
          type: 'Multi-Specialty',
          beds: 150,
          approved: true,
          rating: 4.8,
          image: '🏥'
        },
        {
          id: 'h_apollo_rescue',
          name: 'Apollo Rescue Super Specialty',
          address: '45 Emergency Blvd, Central Hub, 400002',
          phone: '+91 98765 22222',
          email: 'info@apollorescue.org',
          type: 'Super Specialty',
          beds: 300,
          approved: true,
          rating: 4.9,
          image: '🏥'
        }
      ];
    }

    if (this.doctors.length === 0) {
      this.doctors = [
        {
          id: 'doc_sarah',
          name: 'Dr. Sarah Jenkins',
          specialty: 'Cardiology',
          qualification: 'MBBS, MD (Cardio)',
          hospitalId: 'h_city_care',
          fee: 800,
          days: 'Mon-Fri',
          timing: '9:00 AM - 4:00 PM',
          maxPatients: 10,
          status: 'Active'
        },
        {
          id: 'doc_rajesh',
          name: 'Dr. Rajesh Sharma',
          specialty: 'Neurology',
          qualification: 'MBBS, DM (Neuro)',
          hospitalId: 'h_city_care',
          fee: 1000,
          days: 'Mon-Sat',
          timing: '10:00 AM - 5:00 PM',
          maxPatients: 8,
          status: 'Active'
        },
        {
          id: 'doc_priya',
          name: 'Dr. Priya Patel',
          specialty: 'Orthopedics',
          qualification: 'MBBS, MS (Ortho)',
          hospitalId: 'h_apollo_rescue',
          fee: 900,
          days: 'Tue-Sat',
          timing: '9:30 AM - 3:30 PM',
          maxPatients: 12,
          status: 'Active'
        }
      ];
    }

    if (this.beds.length === 0) {
      this.beds = [
        { id: 'b_c1', number: 'ICU-01', ward: 'ICU', status: 'available', hospitalId: 'h_city_care', pricePerDay: 5000 },
        { id: 'b_c2', number: 'ICU-02', ward: 'ICU', status: 'occupied', hospitalId: 'h_city_care', pricePerDay: 5000, patientId: 'P-DEMO' },
        { id: 'b_c3', number: 'GEN-101', ward: 'General', status: 'available', hospitalId: 'h_city_care', pricePerDay: 1500 },
        { id: 'b_a1', number: 'ICU-A1', ward: 'ICU', status: 'available', hospitalId: 'h_apollo_rescue', pricePerDay: 6000 },
        { id: 'b_a2', number: 'EMG-01', ward: 'Emergency', status: 'available', hospitalId: 'h_apollo_rescue', pricePerDay: 4000 }
      ];
    }

    if (this.medicines.length === 0) {
      this.medicines = [
        { id: 'm_1', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 250, unitPrice: 15, minStock: 50, expiry: '2027-12', supplier: 'PharmaCare Ltd', hospitalId: 'h_city_care' },
        { id: 'm_2', name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 15, unitPrice: 85, minStock: 40, expiry: '2026-11', supplier: 'BioMed Supply', hospitalId: 'h_city_care' },
        { id: 'm_3', name: 'Atorvastatin 10mg', category: 'BP Medicine', stock: 120, unitPrice: 45, minStock: 30, expiry: '2027-08', supplier: 'CardioLife', hospitalId: 'h_city_care' },
        { id: 'm_4', name: 'Metformin 500mg', category: 'Diabetes', stock: 8, unitPrice: 25, minStock: 30, expiry: '2026-10', supplier: 'HealthMed Inc', hospitalId: 'h_apollo_rescue' }
      ];
    }

    this.saveCache();
  }
};

DB.getHospital = (id) => DB.hospitals.find(h => h.id === id);
DB.getDoctor = (id) => DB.doctors.find(d => d.id === id);
DB.getPatient = (id) => DB.patients.find(p => p.id === id || p.userId === id);
DB.getMedicine = (id) => DB.medicines.find(m => m.id === id);
DB.getBill = (id) => DB.bills.find(b => b.id === id);

DB.getDoctorsByHospital = (hospitalId) => DB.doctors.filter(d => d.hospitalId === hospitalId);
DB.getPatientsByHospital = (hospitalId) => {
  const appts = DB.appointments.filter(a => a.hospitalId === hospitalId);
  const bills = DB.bills.filter(b => b.hospitalId === hospitalId);
  const reports = DB.reports.filter(r => r.hospitalId === hospitalId);
  const ids = [...new Set([...appts.map(a => a.patientId), ...bills.map(b => b.patientId), ...reports.map(r => r.patientId)])];
  return DB.patients.filter(p => ids.includes(p.id) || ids.includes(p.userId));
};
DB.getMedicinesByHospital = (hospitalId) => DB.medicines.filter(m => m.hospitalId === hospitalId);
DB.getAppointmentsByHospital = (hospitalId) => DB.appointments.filter(a => a.hospitalId === hospitalId);
DB.getBillsByHospital = (hospitalId) => DB.bills.filter(b => b.hospitalId === hospitalId);
DB.getAppointmentsByPatient = (patientId) => DB.appointments.filter(a => a.patientId === patientId);
DB.getBillsByPatient = (patientId) => DB.bills.filter(b => b.patientId === patientId);
DB.getReportsByPatient = (patientId) => DB.reports.filter(r => r.patientId === patientId);
DB.getPrescriptionsByPatient = (patientId) => DB.prescriptions.filter(p => p.patientId === patientId);
DB.getBedsByHospital = (hospitalId) => DB.beds.filter(b => b.hospitalId === hospitalId);

DB.getStatusColor = (status) => {
  const map = { paid: 'badge-success', unpaid: 'badge-danger', pending: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', active: 'badge-success', uploaded: 'badge-success', cancelled: 'badge-danger' };
  return map[status] || 'badge-warning';
};

DB.getPriorityLabel = (p) => {
  if (p === 'high') return '<span class="badge badge-danger">HIGH PRIORITY</span>';
  if (p === 'medium') return '<span class="badge badge-warning">MEDIUM</span>';
  return '<span class="badge badge-success">LOW</span>';
};

DB.assessPriority = (symptoms = '') => {
  const text = symptoms.toLowerCase();
  const highKeywords = ['chest pain', 'heart', 'cardiac', 'stroke', 'unconscious', 'breathing', 'breathlessness', 'severe bleeding', 'trauma', 'accident', 'head injury', 'seizure', 'collapsed'];
  const mediumKeywords = ['fever', 'fracture', 'burn', 'vomiting', 'abdominal pain', 'migraine', 'infection', 'asthma', 'sprain', 'dizziness'];
  
  if (highKeywords.some(k => text.includes(k))) return 'high';
  if (mediumKeywords.some(k => text.includes(k))) return 'medium';
  return 'low';
};

DB.medStatus = (stock, min) => {
  if (stock <= min * 0.3) return '<span class="badge badge-danger">Critical</span>';
  if (stock <= min) return '<span class="badge badge-warning">Low</span>';
  return '<span class="badge badge-success">In Stock</span>';
};

DB.formatDate = (d) => {
  if (!d) return '-';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

DB.generateId = (prefix) => {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000);
};

async function loadFromFirestore() {
  // 1. Load cache first
  const cacheLoaded = DB.loadCache();
  if (!cacheLoaded) {
    DB.seedDefaultData();
  }
  DB.ready = true;
  DB._readyResolvers.forEach(cb => cb());
  DB._readyResolvers = [];

  // 2. Load Firestore background
  for (let i = 0; i < 8; i++) {
    if (typeof FirestoreService !== 'undefined' && typeof db !== 'undefined') break;
    await new Promise(r => setTimeout(r, 400));
  }
  if (typeof FirestoreService === 'undefined' || typeof db === 'undefined') {
    console.log('Firestore unavailable — running on local DB engine');
    return;
  }
  try {
    await FirestoreService.loadAll();
    DB.seedDefaultData();
    DB.notifyChange();
    console.log('Data synced with Firestore');
  } catch (e) {
    console.log('Firestore sync fallback:', e.message);
  }
}

loadFromFirestore();
