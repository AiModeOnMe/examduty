// src/components/HallList.jsx
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Card from "./common/Card";
import Button from "./common/Button";
import Input, { Select } from "./common/Input";
import "./HallList.css";

const HallList = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    examHall: "",
    block: "",
  });

  const [filters, setFilters] = useState({
    examHall: "",
    block: "",
  });

  const hallRef = collection(db, "halls");

  useEffect(() => {
    const unsubscribe = onSnapshot(hallRef, (snapshot) => {
      const data = snapshot.docs.map((d) => {
        const h = d.data();
        return {
          id: d.id,
          examHall: h["Exam Hall"] || h.examHall || "",
          block: h.Block || h.block || "",
        };
      });

      setHalls(data.sort((a, b) => a.examHall.localeCompare(b.examHall)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const blockOptions = useMemo(() => {
    const uniqueBlocks = Array.from(
      new Set(
        halls
          .map((h) => (h.block || "").trim())
          .filter((block) => block.length > 0)
      )
    );
    return uniqueBlocks.sort((a, b) => a.localeCompare(b));
  }, [halls]);

  const stats = useMemo(() => {
    const totalHalls = halls.length;
    const activeBlocks = blockOptions.length;
    const labSpaces = halls.filter((h) => /lab/i.test(h.examHall)).length;

    return [
      { icon: "🏛️", label: "Total Halls", value: totalHalls },
      { icon: "🏢", label: "Active Blocks", value: activeBlocks },
      { icon: "🧪", label: "Lab Spaces", value: labSpaces },
    ];
  }, [halls, blockOptions.length]);

  const filteredHalls = useMemo(() => {
    const examHallQuery = filters.examHall.trim().toLowerCase();
    return halls.filter((h) => {
      const hallMatch = h.examHall.toLowerCase().includes(examHallQuery);
      const blockMatch = filters.block ? h.block === filters.block : true;
      return hallMatch && blockMatch;
    });
  }, [halls, filters]);

  const groupedHalls = useMemo(() => {
    return filteredHalls.reduce((acc, hall) => {
      const key = hall.block?.trim() || "Unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(hall);
      return acc;
    }, {});
  }, [filteredHalls]);

  const hasActiveFilters = Boolean(filters.examHall || filters.block);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.examHall.trim() || !form.block.trim()) {
      return;
    }

    const payload = {
      examHall: form.examHall.trim(),
      block: form.block.trim(),
    };

    try {
      setSaving(true);
      if (editId) {
        await updateDoc(doc(db, "halls", editId), payload);
        setEditId(null);
      } else {
        await addDoc(hallRef, payload);
      }
      setForm({ examHall: "", block: "" });
    } catch (error) {
      console.error("Error saving hall:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hall) => {
    setEditId(hall.id);
    setForm({ examHall: hall.examHall, block: hall.block });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this hall?")) return;

    try {
      await deleteDoc(doc(db, "halls", id));
    } catch (error) {
      console.error("Error deleting hall:", error);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ examHall: "", block: "" });
  };

  const clearFilters = () => {
    setFilters({ examHall: "", block: "" });
  };

  const blockInitial = (blockName) => {
    if (blockName === "Unassigned") return "?";
    return blockName?.trim().charAt(0).toUpperCase() || "?";
  };

  const groupedEntries = Object.entries(groupedHalls).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="hall-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading halls...</p>
          </div>
        </div>
      )}

      <section className="hall-hero animate-fade-in">
        <div className="hall-hero-content">
          <h1>Hall Management</h1>
          <p>
            Keep your examination halls organised by block, manage capacities, and stay
            ahead of scheduling conflicts with a single streamlined view.
          </p>

          <div className="hall-stats-row">
            {stats.map((stat) => (
              <div className="hall-stat-card" key={stat.label}>
                <div className="hall-stat-icon">{stat.icon}</div>
                <div className="hall-stat-info">
                  <div className="hall-stat-value">{stat.value}</div>
                  <div className="hall-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="hall-content">
        <div className="hall-layout">
          <aside className="hall-form-card animate-fade-in-left">
            <Card
              title={editId ? "Edit Exam Hall" : "Add Exam Hall"}
              subtitle={
                editId
                  ? "Update the selected hall's details"
                  : "Create a new hall and assign it to a block"
              }
              icon={editId ? "✏️" : "➕"}
              gradient="warning"
            >
              <form onSubmit={handleSubmit} className="hall-form">
                <Input
                  label="Exam Hall"
                  placeholder="e.g., MB104"
                  icon="🏛️"
                  value={form.examHall}
                  onChange={(e) => setForm({ ...form, examHall: e.target.value })}
                  required
                />

                <Input
                  label="Block"
                  placeholder="e.g., Main Block"
                  icon="🏢"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                  required
                />

                <div className="hall-form-actions">
                  <Button
                    type="submit"
                    variant="warning"
                    icon={editId ? "💾" : "➕"}
                    loading={saving}
                  >
                    {editId ? "Update Hall" : "Add Hall"}
                  </Button>
                  {editId && (
                    <Button type="button" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </aside>

          <section className="halls-grid-container animate-fade-in-up">
            <div className="halls-grid-header">
              <div className="halls-grid-title">
                <h2>Exam Halls</h2>
                <span className="halls-count-badge">
                  {filteredHalls.length} {filteredHalls.length === 1 ? "hall" : "halls"}
                </span>
              </div>

              <div className="halls-filter-inline">
                <Input
                  placeholder="Search exam hall"
                  icon="🔍"
                  size="sm"
                  value={filters.examHall}
                  onChange={(e) => setFilters({ ...filters, examHall: e.target.value })}
                />
                <Select
                  value={filters.block}
                  onChange={(e) => setFilters({ ...filters, block: e.target.value })}
                  size="sm"
                >
                  <option value="">All blocks</option>
                  {blockOptions.map((block) => (
                    <option key={block} value={block}>
                      {block}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear
                </Button>
              </div>
            </div>

            {groupedEntries.length > 0 ? (
              <div className="block-groups">
                {groupedEntries.map(([blockName, hallsInBlock]) => (
                  <div className="block-group" key={blockName}>
                    <div className="block-header">
                      <div className="block-info">
                        <div className="block-icon">{blockInitial(blockName)}</div>
                        <div>
                          <div className="block-name">{blockName}</div>
                          <div className="block-count">
                            {hallsInBlock.length} {hallsInBlock.length === 1 ? "hall" : "halls"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="halls-list">
                      {hallsInBlock.map((hall) => (
                        <div className="hall-item" key={hall.id}>
                          <div className="hall-item-info">
                            <div className="hall-item-icon">🏛️</div>
                            <div>
                              <div className="hall-item-name">{hall.examHall}</div>
                              {hall.block ? (
                                <small className="hall-item-meta">{hall.block}</small>
                              ) : (
                                <small className="hall-item-meta">Unassigned</small>
                              )}
                            </div>
                          </div>
                          <div className="hall-item-actions">
                            <button
                              type="button"
                              className="hall-action-btn"
                              onClick={() => handleEdit(hall)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="hall-action-btn delete"
                              onClick={() => handleDelete(hall.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="halls-empty-state">
                <div className="halls-empty-icon">🏛️</div>
                <h3>No halls found</h3>
                <p>
                  {hasActiveFilters
                    ? "Try adjusting your filters or clearing the search to see all halls."
                    : "Add your first hall using the form on the left to get started."}
                </p>
                {!hasActiveFilters && (
                  <Button variant="warning" onClick={() => document.getElementById("hall-form")?.scrollIntoView({ behavior: "smooth" })}>
                    Add Hall
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default HallList;
