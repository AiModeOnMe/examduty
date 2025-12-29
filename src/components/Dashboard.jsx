import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalHalls: 0,
    totalAssignments: 0,
    frozenAssignments: 0,
    pendingAssignments: 0,
    blocks: [],
  });

  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const [staffSnap, hallSnap, assignSnap] = await Promise.all([
      getDocs(collection(db, "staffs")),
      getDocs(collection(db, "halls")),
      getDocs(collection(db, "assignments")),
    ]);

    const assignments = assignSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const halls = hallSnap.docs.map((d) => d.data());
    const blocks = [...new Set(halls.map((h) => h.block || h.Block).filter(Boolean))];

    setStats({
      totalStaff: staffSnap.docs.length,
      totalHalls: hallSnap.docs.length,
      totalAssignments: assignments.length,
      frozenAssignments: assignments.filter((a) => a.frozen).length,
      pendingAssignments: assignments.filter((a) => !a.frozen).length,
      blocks,
    });

    setRecentAssignments(assignments.slice(-5).reverse());
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          Loading Dashboard
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1>Dashboard</h1>
            <p>Welcome back! Here's what's happening with your exam system.</p>
            <div className="breadcrumb">
              <span className="breadcrumb-item">🏠 Home</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item">Dashboard</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <span>📅</span> This Week
            </button>
            <button className="btn btn-primary">
              <span>➕</span> Quick Assign
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary hover-lift">
          <div className="stat-icon">👥</div>
          <div className="stat-number">{stats.totalStaff}</div>
          <div className="stat-label">Total Staff Members</div>
          <div className="stat-trend up">
            <span>↑</span> 12% from last month
          </div>
        </div>

        <div className="stat-card success hover-lift">
          <div className="stat-icon">🏛️</div>
          <div className="stat-number">{stats.totalHalls}</div>
          <div className="stat-label">Exam Halls</div>
          <div className="stat-trend up">
            <span>↑</span> {stats.blocks.length} Blocks
          </div>
        </div>

        <div className="stat-card warning hover-lift">
          <div className="stat-icon">📋</div>
          <div className="stat-number">{stats.totalAssignments}</div>
          <div className="stat-label">Total Assignments</div>
          <div className="stat-trend">
            <span>📊</span> Active Allocations
          </div>
        </div>

        <div className="stat-card purple hover-lift">
          <div className="stat-icon">❄️</div>
          <div className="stat-number">{stats.frozenAssignments}</div>
          <div className="stat-label">Frozen Duties</div>
          <div className="stat-trend up">
            <span>✓</span> Confirmed
          </div>
        </div>

        <div className="stat-card cyan hover-lift">
          <div className="stat-icon">⏳</div>
          <div className="stat-number">{stats.pendingAssignments}</div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-trend">
            <span>🔔</span> Needs Attention
          </div>
        </div>

        <div className="stat-card danger hover-lift">
          <div className="stat-icon">📧</div>
          <div className="stat-number">{stats.pendingAssignments}</div>
          <div className="stat-label">Pending Notifications</div>
          <div className="stat-trend">
            <span>📤</span> Ready to Send
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
        {/* Quick Actions */}
        <div className="card slide-up">
          <div className="card-header">
            <h2>
              <span className="card-header-icon" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                ⚡
              </span>
              Quick Actions
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "flex-start" }}>
                <span>📋</span> New Assignment
              </button>
              <button className="btn btn-success" style={{ width: "100%", justifyContent: "flex-start" }}>
                <span>👤</span> Add Staff
              </button>
              <button className="btn btn-warning" style={{ width: "100%", justifyContent: "flex-start" }}>
                <span>🏛️</span> Add Hall
              </button>
              <button className="btn btn-info" style={{ width: "100%", justifyContent: "flex-start" }}>
                <span>📊</span> Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Block Overview */}
        <div className="card slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="card-header">
            <h2>
              <span className="card-header-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}>
                🏢
              </span>
              Block Overview
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.blocks.map((block, i) => (
                <div
                  key={block}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px 20px",
                    background: "var(--slate-50)",
                    borderRadius: "12px",
                    transition: "all 0.3s",
                  }}
                  className="hover-lift"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: `linear-gradient(135deg, ${["#667eea", "#f093fb", "#11998e", "#F2994A"][i % 4]} 0%, ${["#764ba2", "#f5576c", "#38ef7d", "#F2C94C"][i % 4]} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "600",
                      }}
                    >
                      {block.charAt(0)}
                    </div>
                    <span style={{ fontWeight: "600" }}>{block}</span>
                  </div>
                  <span className="badge badge-primary">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="card slide-up" style={{ marginTop: "25px", animationDelay: "0.2s" }}>
        <div className="card-header">
          <h2>
            <span className="card-header-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              📝
            </span>
            Recent Assignments
          </h2>
          <button className="btn btn-sm btn-outline">View All</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {recentAssignments.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Subject</th>
                    <th>Hall</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="cell-staff">
                          <div className="staff-avatar">
                            {a.staffName?.charAt(0) || "?"}
                          </div>
                          <div className="staff-info">
                            <h4>{a.staffName}</h4>
                            <span>{a.designation}</span>
                          </div>
                        </div>
                      </td>
                      <td>{a.subject}</td>
                      <td>
                        <span className="badge badge-purple">{a.hall}</span>
                      </td>
                      <td>{a.examDate}</td>
                      <td>
                        <span className={`badge ${a.frozen ? "badge-frozen" : "badge-open"}`}>
                          {a.frozen ? "❄️ Frozen" : "🔓 Open"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No Recent Assignments</h3>
              <p>Create your first duty assignment to get started.</p>
              <button className="btn btn-primary">Create Assignment</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;