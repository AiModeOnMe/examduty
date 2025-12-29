// src/components/StaffList.jsx
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import Card from "./common/Card";
import Button from "./common/Button";
import Input, { Select } from "./common/Input";
import Badge from "./common/Badge";
import "./StaffList.css";

const StaffList = () => {
  const [staffs, setStaffs] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    subject1: "",
    subject2: "",
    email: "",
  });

  const [filters, setFilters] = useState({
    name: "",
    designation: "",
    subject: "",
    email: "",
  });

  const staffRef = collection(db, "staffs");

  // Stats calculations
  const stats = {
    total: staffs.length,
    associates: staffs.filter(s => s.designation?.toLowerCase().includes('associate')).length,
    assistants: staffs.filter(s => s.designation?.toLowerCase().includes('assistant')).length,
  };

  useEffect(() => {
    const unsub = onSnapshot(staffRef, (snapshot) => {
      const data = snapshot.docs.map((d) => {
        const s = d.data();
        const counts = s.invigilationCount || {};

        return {
          id: d.id,
          name: s.name || s["Name "] || "",
          designation: s.designation || s.Designation || "",
          subject1: s.subject1 || s["Subject 1"] || "",
          subject2: s.subject2 || s["Subject 2"] || "",
          email: s.email || s["Mail ID"] || "",
          ia1: counts.IA1 || 0,
          ia2: counts.IA2 || 0,
          model: counts.Model || 0,
          semester: counts.Semester || 0,
        };
      });
      setStaffs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: form.name,
      designation: form.designation,
      subject1: form.subject1,
      subject2: form.subject2,
      email: form.email,
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "staffs", editId), payload);
        setEditId(null);
      } else {
        await addDoc(staffRef, payload);
      }

      setForm({
        name: "",
        designation: "",
        subject1: "",
        subject2: "",
        email: "",
      });
    } catch (error) {
      console.error("Error saving staff:", error);
    }
    setLoading(false);
  };

  const handleEdit = (s) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      designation: s.designation,
      subject1: s.subject1,
      subject2: s.subject2,
      email: s.email,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    await deleteDoc(doc(db, "staffs", id));
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({
      name: "",
      designation: "",
      subject1: "",
      subject2: "",
      email: "",
    });
  };

  const clearFilters = () => {
    setFilters({ name: "", designation: "", subject: "", email: "" });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const filteredStaffs = staffs.filter((s) => {
    return (
      s.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (!filters.designation || s.designation === filters.designation) &&
      (!filters.subject ||
        s.subject1.toLowerCase().includes(filters.subject.toLowerCase()) ||
        s.subject2.toLowerCase().includes(filters.subject.toLowerCase())) &&
      s.email.toLowerCase().includes(filters.email.toLowerCase())
    );
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <div className="staff-page">
      {/* Hero Section */}
      <section className="staff-hero">
        <div className="hero-content animate-fade-in">
          <div className="hero-text">
            <h1>Staff Directory</h1>
            <p className="hero-subtitle">
              Manage your institution's faculty members, track invigilation duties, 
              and maintain comprehensive staff records with ease.
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat animate-fade-in-up stagger-1">
              <span className="hero-stat-value">{stats.total}</span>
              <span className="hero-stat-label">Total Staff</span>
            </div>
            <div className="hero-stat animate-fade-in-up stagger-2">
              <span className="hero-stat-value">{stats.associates}</span>
              <span className="hero-stat-label">Associate Professors</span>
            </div>
            <div className="hero-stat animate-fade-in-up stagger-3">
              <span className="hero-stat-value">{stats.assistants}</span>
              <span className="hero-stat-label">Assistant Professors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="staff-content">
        {/* Sidebar */}
        <aside className="staff-sidebar">
          {/* Add/Edit Form */}
          <Card
            title={editId ? "Edit Staff Member" : "Add New Staff"}
            subtitle={editId ? "Update staff information" : "Enter staff details below"}
            icon={editId ? "✏️" : "➕"}
            className="staff-form-card animate-fade-in-left"
            gradient="primary"
          >
            <form onSubmit={handleSubmit} className="form-grid">
              <Input
                label="Full Name"
                placeholder="Enter full name"
                icon="👤"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              
              <Select
                label="Designation"
                icon="💼"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                required
              >
                <option value="">Select Designation</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="HOD">HOD</option>
              </Select>

              <div className="form-row">
                <Input
                  label="Subject 1"
                  placeholder="Primary subject"
                  icon="📚"
                  value={form.subject1}
                  onChange={(e) => setForm({ ...form, subject1: e.target.value })}
                />
                <Input
                  label="Subject 2"
                  placeholder="Secondary subject"
                  icon="📖"
                  value={form.subject2}
                  onChange={(e) => setForm({ ...form, subject2: e.target.value })}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="email@example.com"
                icon="📧"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <div className="form-actions">
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={loading}
                  icon={editId ? "💾" : "➕"}
                >
                  {editId ? "Update Staff" : "Add Staff"}
                </Button>
                {editId && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>

          {/* Filters */}
          <Card
            title="Filters"
            subtitle="Search and filter staff"
            icon="🔍"
            className="animate-fade-in-left stagger-2"
            actions={
              hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )
            }
          >
            <div className="filter-section">
              <Input
                placeholder="Search by name..."
                icon="👤"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              
              <Select
                icon="💼"
                value={filters.designation}
                onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
              >
                <option value="">All Designations</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="HOD">HOD</option>
              </Select>

              <Input
                placeholder="Search by subject..."
                icon="📚"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />

              <Input
                placeholder="Search by email..."
                icon="📧"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              />

              {hasActiveFilters && (
                <div className="filter-chips">
                  {filters.name && (
                    <span className="filter-chip">
                      Name: {filters.name}
                      <button onClick={() => setFilters({ ...filters, name: "" })}>×</button>
                    </span>
                  )}
                  {filters.designation && (
                    <span className="filter-chip">
                      {filters.designation}
                      <button onClick={() => setFilters({ ...filters, designation: "" })}>×</button>
                    </span>
                  )}
                  {filters.subject && (
                    <span className="filter-chip">
                      Subject: {filters.subject}
                      <button onClick={() => setFilters({ ...filters, subject: "" })}>×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        </aside>

        {/* Staff Grid */}
        <main className="staff-grid-section">
          <div className="grid-header">
            <div className="grid-title">
              <h2>Faculty Members</h2>
              <span className="grid-count">{filteredStaffs.length} members</span>
            </div>
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ▦
              </button>
              <button 
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                ☰
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading staff data...</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="staff-cards-grid">
              {filteredStaffs.length > 0 ? (
                filteredStaffs.map((staff, index) => (
                  <div 
                    key={staff.id} 
                    className="staff-card animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="staff-card-header">
                      <div className="staff-avatar-large">
                        {getInitials(staff.name)}
                      </div>
                      <div className="staff-card-info">
                        <h3 className="staff-card-name">{staff.name}</h3>
                        <span className="staff-card-designation">{staff.designation}</span>
                      </div>
                      <div className="staff-card-actions">
                        <button 
                          className="staff-card-action"
                          onClick={() => handleEdit(staff)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="staff-card-action delete"
                          onClick={() => handleDelete(staff.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="staff-card-details">
                      {staff.email && (
                        <div className="staff-detail-row">
                          <span className="staff-detail-icon">📧</span>
                          <span className="staff-detail-value">
                            <a href={`mailto:${staff.email}`}>{staff.email}</a>
                          </span>
                        </div>
                      )}
                      {staff.subject1 && (
                        <div className="staff-detail-row">
                          <span className="staff-detail-icon">📚</span>
                          <span className="staff-detail-value">{staff.subject1}</span>
                        </div>
                      )}
                      {staff.subject2 && (
                        <div className="staff-detail-row">
                          <span className="staff-detail-icon">📖</span>
                          <span className="staff-detail-value">{staff.subject2}</span>
                        </div>
                      )}
                    </div>

                    <div className="staff-stats-row">
                      <div className="staff-stat-item">
                        <span className="staff-stat-value">{staff.ia1}</span>
                        <span className="staff-stat-label">IA1</span>
                      </div>
                      <div className="staff-stat-item">
                        <span className="staff-stat-value">{staff.ia2}</span>
                        <span className="staff-stat-label">IA2</span>
                      </div>
                      <div className="staff-stat-item">
                        <span className="staff-stat-value">{staff.model}</span>
                        <span className="staff-stat-label">Model</span>
                      </div>
                      <div className="staff-stat-item">
                        <span className="staff-stat-value">{staff.semester}</span>
                        <span className="staff-stat-label">Sem</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-grid-state">
                  <span className="empty-grid-icon">👥</span>
                  <h3>No Staff Found</h3>
                  <p>No staff members match your current filters. Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="staff-table-wrapper">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th className="sortable">Staff Member</th>
                    <th className="sortable">Designation</th>
                    <th>Subjects</th>
                    <th className="sortable">IA1</th>
                    <th className="sortable">IA2</th>
                    <th className="sortable">Model</th>
                    <th className="sortable">Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaffs.map((staff, index) => (
                    <tr 
                      key={staff.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td>
                        <div className="table-staff-cell">
                          <div className="table-avatar">{getInitials(staff.name)}</div>
                          <div className="table-staff-info">
                            <span className="table-staff-name">{staff.name}</span>
                            <span className="table-staff-email">{staff.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={staff.designation?.includes('Associate') ? 'primary' : 'default'}>
                          {staff.designation}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {staff.subject1 && <span>{staff.subject1}</span>}
                          {staff.subject2 && <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{staff.subject2}</span>}
                        </div>
                      </td>
                      <td className="count-cell">
                        <span className={`count-badge ${staff.ia1 > 0 ? 'has-count' : ''}`}>
                          {staff.ia1}
                        </span>
                      </td>
                      <td className="count-cell">
                        <span className={`count-badge ${staff.ia2 > 0 ? 'has-count' : ''}`}>
                          {staff.ia2}
                        </span>
                      </td>
                      <td className="count-cell">
                        <span className={`count-badge ${staff.model > 0 ? 'has-count' : ''}`}>
                          {staff.model}
                        </span>
                      </td>
                      <td className="count-cell">
                        <span className={`count-badge ${staff.semester > 0 ? 'has-count' : ''}`}>
                          {staff.semester}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button 
                            className="table-action-btn"
                            onClick={() => handleEdit(staff)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="table-action-btn delete"
                            onClick={() => handleDelete(staff.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffList;