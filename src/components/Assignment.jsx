// src/components/Assignment.jsx
import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Card from "./common/Card";
import Button from "./common/Button";
import Input, { Select } from "./common/Input";
import Badge from "./common/Badge";
import StatsCard from "./common/StatsCard";
import "./Assignment.css";

const normalize = (v) => v?.toLowerCase().trim();

const Assignment = () => {
  const [staffs, setStaffs] = useState([]);
  const [halls, setHalls] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [showAllotment, setShowAllotment] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    date: "",
    subject: "",
    frozen: "",
    block: "",
  });

  const [form, setForm] = useState({
    academicYear: "",
    examType: "",
    examYear: "",
    blocks: [],
  });

  const [examSchedule, setExamSchedule] = useState([
    { date: "", subject: "" },
    { date: "", subject: "" },
    { date: "", subject: "" },
    { date: "", subject: "" },
    { date: "", subject: "" },
  ]);

  const [caps, setCaps] = useState({ associate: "", others: "" });
  const [unassignedList, setUnassignedList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editStaffId, setEditStaffId] = useState("");

  // Stats calculations
  const stats = {
    totalAssignments: assignments.length,
    frozenCount: assignments.filter((a) => a.frozen).length,
    openCount: assignments.filter((a) => !a.frozen).length,
    uniqueStaff: new Set(assignments.map((a) => a.staffId)).size,
  };

  const blockOptions = useMemo(
    () =>
      Array.from(new Set(halls.map((h) => h.block).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [halls]
  );

  const activeBlockOptions = useMemo(
    () => [...form.blocks].sort((a, b) => a.localeCompare(b)),
    [form.blocks]
  );

  const selectedBlocksLabel = form.blocks.length ? form.blocks.join(", ") : "None";

  const handleBlockToggle = (block) => {
    setForm((prev) => {
      const exists = prev.blocks.includes(block);
      const nextBlocks = exists
        ? prev.blocks.filter((b) => b !== block)
        : [...prev.blocks, block];
      return { ...prev, blocks: nextBlocks };
    });
  };

  const handleBlockClear = () => {
    setForm((prev) => ({ ...prev, blocks: [] }));
  };

  // Load Data functions (same as before)
  const loadBaseData = async () => {
    setLoading(true);
    const staffSnap = await getDocs(collection(db, "staffs"));
    const hallSnap = await getDocs(collection(db, "halls"));

    setStaffs(
      staffSnap.docs.map((d) => {
        const s = d.data();
        return {
          id: d.id,
          name: s.name || s["Name "] || "",
          subject1: s.subject1 || s["Subject 1"] || "",
          subject2: s.subject2 || s["Subject 2"] || "",
          designation: s.designation || s.Designation || "",
          email: s.email || s["Mail ID"] || "",
        };
      })
    );

    setHalls(
      hallSnap.docs.map((d) => {
        const h = d.data();
        return {
          examHall: h.examHall || h["Exam Hall"],
          block: h.block || h.Block,
        };
      })
    );
    setLoading(false);
  };

  const loadAssignments = async () => {
    if (!form.blocks.length) {
      setAssignments([]);
      return;
    }

    const assignSnap = await getDocs(collection(db, "assignments"));
    const data = assignSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => {
        if (form.blocks.length && !form.blocks.includes(a.block)) return false;
        if (form.academicYear && a.academicYear !== form.academicYear) return false;
        if (form.examType && a.examType !== form.examType) return false;
        if (form.examYear && a.examYear !== form.examYear) return false;
        return true;
      });
    setAssignments(data);
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (form.blocks.length) {
      loadAssignments();
    } else {
      setAssignments([]);
      setShowAllotment(false);
    }
  }, [form.blocks, form.academicYear, form.examType, form.examYear]);

  const addExamRow = () => {
    setExamSchedule([...examSchedule, { date: "", subject: "" }]);
  };

  const updateExamRow = (i, field, value) => {
    const updated = [...examSchedule];
    updated[i][field] = value;
    setExamSchedule(updated);
  };

  const removeExamRow = (index) => {
    if (examSchedule.length > 1) {
      setExamSchedule(examSchedule.filter((_, i) => i !== index));
    }
  };

  // Assign Duty function (same logic as before)
  const assignDuty = async () => {
    if (!form.blocks.length) {
      alert("Please select at least one block");
      return;
    }

    const validRows = examSchedule.filter((r) => r.date && r.subject);
    if (validRows.length < 5) {
      alert("Please enter at least 5 exam entries");
      return;
    }

    setLoading(true);
    setShowAllotment(false);
    setUnassignedList([]);

    const selectedBlocks = [...form.blocks];
    const blockHallMap = selectedBlocks.reduce((acc, block) => {
      acc[block] = halls.filter((h) => h.block === block);
      return acc;
    }, {});

    const pendingUnassigned = [];
    let staffIndex = 0;

    try {
      const priorSnap = await getDocs(collection(db, "assignments"));
      const prior = priorSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (a) =>
            a.academicYear === form.academicYear &&
            a.examType === form.examType &&
            a.examYear === form.examYear
        );

      const assignedCounts = {};
      const assignedOnDate = {};
      for (const a of prior) {
        assignedCounts[a.staffId] = (assignedCounts[a.staffId] || 0) + 1;
        if (!assignedOnDate[a.staffId]) assignedOnDate[a.staffId] = new Set();
        assignedOnDate[a.staffId].add(a.examDate);
      }

      const assocCap = parseInt(caps.associate);
      const othersCap = parseInt(caps.others);
      const capFor = (s) => {
        const isAssociate = (s.designation || "").toLowerCase().includes("associate");
        const cap = isAssociate ? assocCap : othersCap;
        return isNaN(cap) || cap <= 0 ? Infinity : cap;
      };

      const blockedByDate = {};
      for (const row of validRows) {
        const d = row.date;
        const sub = normalize(row.subject);
        if (!blockedByDate[d]) blockedByDate[d] = new Set();
        for (const s of staffs) {
          if (normalize(s.subject1) === sub || normalize(s.subject2) === sub) {
            blockedByDate[d].add(s.id);
          }
        }
      }

      for (const exam of validRows) {
        const examSub = normalize(exam.subject);

        for (const block of selectedBlocks) {
          const blockHalls = blockHallMap[block] || [];

          if (blockHalls.length === 0) {
            pendingUnassigned.push({
              date: exam.date,
              subject: exam.subject,
              hall: "No hall configured",
              block,
            });
            continue;
          }

          for (const hall of blockHalls) {
            let assigned = false;
            let attempts = 0;
            let idx = staffIndex;

            while (attempts < staffs.length && !assigned) {
              const s = staffs[idx];
              idx = (idx + 1) % staffs.length;
              attempts++;

              if (
                normalize(s.subject1) === examSub ||
                normalize(s.subject2) === examSub
              ) {
                continue;
              }

              if (blockedByDate[exam.date] && blockedByDate[exam.date].has(s.id)) {
                continue;
              }

              const count = assignedCounts[s.id] || 0;
              if (count >= capFor(s)) continue;

              if (assignedOnDate[s.id] && assignedOnDate[s.id].has(exam.date)) {
                continue;
              }

              await addDoc(collection(db, "assignments"), {
                academicYear: form.academicYear,
                examType: form.examType,
                examYear: form.examYear,
                examDate: exam.date,
                subject: exam.subject,
                block,
                hall: hall.examHall,
                staffId: s.id,
                staffName: s.name,
                staffEmail: s.email,
                designation: s.designation,
                frozen: false,
              });

              assignedCounts[s.id] = (assignedCounts[s.id] || 0) + 1;
              if (!assignedOnDate[s.id]) assignedOnDate[s.id] = new Set();
              assignedOnDate[s.id].add(exam.date);

              assigned = true;
              staffIndex = idx;
            }

            if (!assigned) {
              pendingUnassigned.push({
                date: exam.date,
                subject: exam.subject,
                hall: hall.examHall,
                block,
              });
            }
          }
        }
      }

      await loadAssignments();
      setUnassignedList(pendingUnassigned);
      setShowAllotment(true);

      if (pendingUnassigned.length > 0) {
        const summary = selectedBlocks.join(", ");
        alert(
          `${pendingUnassigned.length} halls are unassigned${summary ? ` across ${summary}` : ""}`
        );
      }
    } catch (error) {
      console.error("Error assigning duties:", error);
      alert("Failed to generate assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Other handlers (freeze, notify, export - same logic as before)
  const freezeOne = async (a) => {
    setLoading(true);
    const staffRef = doc(db, "staffs", a.staffId);
    const assignRef = doc(db, "assignments", a.id);

    const staffSnap = await getDoc(staffRef);
    const counts = staffSnap.data().invigilationCount || {};
    const yearKey = a.academicYear || "Unknown";
    const yearCounts = typeof counts[yearKey] === "object" && counts[yearKey] ? counts[yearKey] : {};
    yearCounts[a.examType] = (yearCounts[a.examType] || 0) + 1;
    counts[yearKey] = yearCounts;
    counts[a.examType] = (counts[a.examType] || 0) + 1;

    await updateDoc(assignRef, { frozen: true });
    await updateDoc(staffRef, { invigilationCount: counts });

    await loadAssignments();
    setLoading(false);
  };

  const freezeAll = async () => {
    setLoading(true);
    const list = filteredAssignments.filter((a) => !a.frozen);
    for (const a of list) {
      await freezeOne(a);
    }
    setLoading(false);
  };

  const notifyOne = (a) => {
    const subject = encodeURIComponent("Exam Duty Allotment");
    const body = encodeURIComponent(
      `Dear ${a.staffName},\n\nYou are allotted exam duty.\nDate: ${a.examDate}\nSubject: ${a.subject}\nHall: ${a.hall}\nBlock: ${a.block}\nType: ${a.examType}\nYear: ${a.examYear}\n\nRegards,\nExam Cell`
    );
    window.open(`mailto:${a.staffEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const notifyAll = () => {
    const recipients = Array.from(new Set(filteredAssignments.map((a) => a.staffEmail))).join(",");
    const subject = encodeURIComponent("Exam Duty Allotment");
    const body = encodeURIComponent("Please check your exam duty allotment.");
    window.open(`mailto:?bcc=${recipients}&subject=${subject}&body=${body}`, "_blank");
  };

  const filteredAssignments = assignments.filter((a) => {
    return (
      (!filters.date || a.examDate === filters.date) &&
      (!filters.subject || normalize(a.subject).includes(normalize(filters.subject))) &&
      (!filters.block || a.block === filters.block) &&
      (filters.frozen === "" ? true : String(a.frozen) === filters.frozen)
    );
  });

  const groupedByDate = filteredAssignments.reduce((acc, a) => {
    acc[a.examDate] = acc[a.examDate] || [];
    acc[a.examDate].push(a);
    return acc;
  }, {});

  const exportCSV = () => {
    const rows = [
      ["Academic Year", "Exam Type", "Exam For", "Date", "Subject", "Block", "Hall", "Staff", "Email", "Status"],
      ...filteredAssignments.map((a) => [
        a.academicYear || "", a.examType || "", a.examYear || "", a.examDate || "",
        a.subject || "", a.block || "", a.hall || "", a.staffName || "", a.staffEmail || "",
        a.frozen ? "Frozen" : "Open",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam_assignments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="assignment-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <h1>📋 Exam Duty Assignment</h1>
            <p>Allocate invigilation duties to staff members efficiently</p>
            <div className="breadcrumb">
              <a href="/">Home</a>
              <span>/</span>
              <span>Assignment</span>
            </div>
          </div>
          <div className="header-actions">
            <Button variant="outline" icon="📊">
              View Reports
            </Button>
            <Button variant="primary" icon="➕">
              Quick Assign
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {showAllotment && (
        <div className="stats-grid animate-fade-in">
          <StatsCard
            icon="📋"
            title="Total Assignments"
            value={stats.totalAssignments}
            gradient="primary"
            delay={0.1}
          />
          <StatsCard
            icon="❄️"
            title="Frozen"
            value={stats.frozenCount}
            change={`${Math.round((stats.frozenCount / stats.totalAssignments) * 100) || 0}%`}
            changeType="positive"
            gradient="info"
            delay={0.2}
          />
          <StatsCard
            icon="📝"
            title="Open"
            value={stats.openCount}
            gradient="warning"
            delay={0.3}
          />
          <StatsCard
            icon="👥"
            title="Staff Assigned"
            value={stats.uniqueStaff}
            gradient="success"
            delay={0.4}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Processing assignments...</p>
          </div>
        </div>
      )}

      {/* Configuration Card */}
      <Card
        title="Exam Configuration"
        subtitle="Set up the examination parameters"
        icon="⚙️"
        className="config-card"
      >
        <div className="config-grid">
          <Input
            label="Academic Year"
            placeholder="e.g., 2024-25"
            icon="📅"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          />
          <Select
            label="Exam Type"
            icon="📝"
            value={form.examType}
            onChange={(e) => setForm({ ...form, examType: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="IA1">IA1</option>
            <option value="IA2">IA2</option>
            <option value="Model">Model</option>
            <option value="Semester">Semester</option>
          </Select>
          <Select
            label="Exam For"
            icon="🎓"
            value={form.examYear}
            onChange={(e) => setForm({ ...form, examYear: e.target.value })}
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="Higher Semester">Higher Semester</option>
          </Select>
          <div className="block-selector">
            <div className="block-selector-header">
              <span className="block-selector-title">Blocks</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBlockClear}
                disabled={!form.blocks.length}
              >
                Clear
              </Button>
            </div>
            <div className="block-selector-chips">
              {blockOptions.length === 0 ? (
                <span className="block-selector-empty">No halls configured yet</span>
              ) : (
                blockOptions.map((block) => (
                  <button
                    key={block}
                    type="button"
                    className={`block-chip ${form.blocks.includes(block) ? "active" : ""}`}
                    onClick={() => handleBlockToggle(block)}
                  >
                    {block}
                  </button>
                ))
              )}
            </div>
            <div className="block-selector-summary">
              Selected: <strong>{selectedBlocksLabel}</strong>
            </div>
          </div>
          <Input
            label="Max Duties (Associate Prof)"
            type="number"
            placeholder="e.g., 5"
            icon="👔"
            value={caps.associate}
            onChange={(e) => setCaps({ ...caps, associate: e.target.value })}
          />
          <Input
            label="Max Duties (Others)"
            type="number"
            placeholder="e.g., 8"
            icon="👥"
            value={caps.others}
            onChange={(e) => setCaps({ ...caps, others: e.target.value })}
          />
        </div>
      </Card>

      {/* Exam Schedule Card */}
      <Card
        title="Exam Schedule"
        subtitle="Add exam dates and subjects"
        icon="📆"
        className="schedule-card"
        actions={
          <Button variant="secondary" size="sm" icon="➕" onClick={addExamRow}>
            Add Row
          </Button>
        }
      >
        <div className="schedule-list">
          {examSchedule.map((r, i) => (
            <div key={i} className="schedule-row animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="row-number">{i + 1}</div>
              <Input
                type="date"
                value={r.date}
                onChange={(e) => updateExamRow(i, "date", e.target.value)}
              />
              <Input
                placeholder="Subject Name"
                value={r.subject}
                onChange={(e) => updateExamRow(i, "subject", e.target.value)}
              />
              <button
                className="remove-row-btn"
                onClick={() => removeExamRow(i)}
                disabled={examSchedule.length <= 1}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="schedule-actions">
          <Button
            variant="primary"
            size="lg"
            icon="🚀"
            loading={loading}
            onClick={assignDuty}
            fullWidth
          >
            Generate Duty Assignments
          </Button>
        </div>
      </Card>

      {/* Allotment Section */}
      {showAllotment && (
        <div className="allotment-section animate-fade-in-up">
          <Card
            title="Duty Allotment Overview"
            subtitle={`${form.examType || "Exam Type"} • ${form.academicYear || "Academic Year"} • Blocks: ${selectedBlocksLabel}`}
            icon="📊"
            actions={
              <div className="allotment-actions">
                <Button variant="ghost" size="sm" icon="🔔" onClick={notifyAll}>
                  Notify All
                </Button>
                <Button variant="ghost" size="sm" icon="❄️" onClick={freezeAll}>
                  Freeze All
                </Button>
                <Button variant="secondary" size="sm" icon="📥" onClick={exportCSV}>
                  CSV
                </Button>
              </div>
            }
          >
            {/* Filters */}
            <div className="filters-bar">
              <Input
                type="date"
                placeholder="Filter by date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
              <Input
                placeholder="Filter by subject"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              />
              <Select
                value={filters.block}
                onChange={(e) => setFilters({ ...filters, block: e.target.value })}
                disabled={!activeBlockOptions.length}
              >
                <option value="">All Blocks</option>
                {activeBlockOptions.map((block) => (
                  <option key={block} value={block}>
                    {block}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.frozen}
                onChange={(e) => setFilters({ ...filters, frozen: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="true">Frozen</option>
                <option value="false">Open</option>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ date: "", subject: "", frozen: "", block: "" })}
              >
                Clear
              </Button>
            </div>

            {/* Grouped Tables */}
            <div className="date-groups">
              {Object.keys(groupedByDate).sort().map((date) => (
                <div key={date} className="date-group animate-fade-in-up">
                  <div className="date-header">
                    <span className="date-badge">📅 {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="date-count">{groupedByDate[date].length} assignments</span>
                  </div>
                  <div className="assignments-table-wrapper">
                    <table className="assignments-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Hall</th>
                          <th>Staff</th>
                          <th>Designation</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedByDate[date].map((a) => {
                          const busyIds = new Set(
                            groupedByDate[date]
                              .filter((x) => x.id !== a.id)
                              .map((x) => x.staffId)
                          );
                          const daySubjects = new Set(
                            groupedByDate[date].map((x) => normalize(x.subject))
                          );

                          return (
                            <tr key={a.id} className={a.frozen ? 'frozen-row' : ''}>
                              <td>
                                <div className="subject-cell">
                                  <span className="subject-icon">📚</span>
                                  {a.subject}
                                </div>
                              </td>
                              <td>
                                <Badge variant="info" size="sm">
                                  {a.hall}
                                </Badge>
                              </td>
                              <td>
                                <div className="staff-cell">
                                  <div className="staff-avatar">
                                    {a.staffName?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div className="staff-info">
                                    <span className="staff-name">{a.staffName}</span>
                                    <span className="staff-email">{a.staffEmail}</span>
                                  </div>
                                </div>
                              </td>
                              <td>{a.designation}</td>
                              <td>
                                <Badge
                                  variant={a.frozen ? 'info' : 'warning'}
                                  dot
                                  pulse={!a.frozen}
                                >
                                  {a.frozen ? 'Frozen' : 'Open'}
                                </Badge>
                              </td>
                              <td>
                                {!a.frozen && (
                                  <div className="action-buttons">
                                    {editId === a.id ? (
                                      <>
                                        <select
                                          className="edit-select"
                                          value={editStaffId}
                                          onChange={(e) => setEditStaffId(e.target.value)}
                                        >
                                          <option value="">Select Staff</option>
                                          {staffs
                                            .filter(
                                              (s) =>
                                                (!busyIds.has(s.id) || s.id === a.staffId) &&
                                                !daySubjects.has(normalize(s.subject1)) &&
                                                !daySubjects.has(normalize(s.subject2))
                                            )
                                            .map((s) => (
                                              <option key={s.id} value={s.id}>
                                                {s.name} ({s.designation})
                                              </option>
                                            ))}
                                        </select>
                                        <Button
                                          variant="success"
                                          size="sm"
                                          onClick={async () => {
                                            if (!editStaffId) return;
                                            const s = staffs.find((ss) => ss.id === editStaffId);
                                            if (!s) return;
                                            await updateDoc(doc(db, "assignments", a.id), {
                                              staffId: s.id,
                                              staffName: s.name,
                                              staffEmail: s.email,
                                              designation: s.designation,
                                            });
                                            setEditId(null);
                                            setEditStaffId("");
                                            await loadAssignments();
                                          }}
                                        >
                                          ✓
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditId(null);
                                            setEditStaffId("");
                                          }}
                                        >
                                          ✕
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => notifyOne(a)}
                                        >
                                          📧
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditId(a.id);
                                            setEditStaffId(a.staffId);
                                          }}
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => freezeOne(a)}
                                        >
                                          ❄️
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Unassigned Halls */}
          {unassignedList.length > 0 && (
            <Card
              title="⚠️ Unfilled Halls"
              subtitle="These halls couldn't be assigned"
              icon="🚨"
              className="unfilled-card"
            >
              <div className="unfilled-grid">
                {unassignedList.map((u, i) => (
                  <div key={i} className="unfilled-item">
                    <span className="unfilled-date">{u.date}</span>
                    <span className="unfilled-subject">{u.subject}</span>
                    <div className="unfilled-meta">
                      <Badge variant="info" size="sm">
                        {u.block || "Block"}
                      </Badge>
                      <Badge variant="danger" size="sm">
                        {u.hall}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {!showAllotment && (
        <div className="empty-state">
          <div className="empty-illustration">📋</div>
          <h3>No Assignments Yet</h3>
          <p>Configure the exam parameters and generate duty assignments to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default Assignment;