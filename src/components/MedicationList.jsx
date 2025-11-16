import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, Input, ProgressBar, Badge, Button } from "./ui";
import MedicationForm from "./MedicationForm";
import { generateICS, downloadICS } from "../utils/ics";
import { queueAction, syncQueuedActions } from "../utils/offlineQueue";
import usageLimiter from "../utils/usageLimiter";
import onboardingManager from "../utils/onboardingManager";
import "./MedicationList.css";

const MedicationList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [adherence, setAdherence] = useState(0);
  const [adherenceHistory, setAdherenceHistory] = useState({});
  const [usageStats, setUsageStats] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, taken, pending
  const [expandedCards, setExpandedCards] = useState(new Set());

  const plan = usageStats?.isPremium ? "premium" : "free";

  const handleStartTutorial = () => {
    onboardingManager.startManualTutorial();
    window.dispatchEvent(new CustomEvent('restartOnboarding'));
  };

  // Load saved data
  useEffect(() => {
    const savedMeds = JSON.parse(localStorage.getItem("medications")) || [];
    const savedHistory = JSON.parse(localStorage.getItem("adherenceHistory")) || {};

    setMedications(savedMeds);
    setAdherenceHistory(savedHistory);
    
    usageLimiter.synchronizeUsageCounts();
    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);
  }, []);

  // Save when medications change
  useEffect(() => {
    localStorage.setItem("medications", JSON.stringify(medications));
    localStorage.setItem("adherenceHistory", JSON.stringify(adherenceHistory));
    calculateAdherence();
  }, [medications]);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      console.log("🔁 Back online — syncing queued medication data...");
      syncQueuedActions();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Smart reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      medications.forEach((med) => {
        if (med.time === currentTime && !med.taken) {
          showReminder(med);

          setTimeout(() => {
            const refreshed = JSON.parse(localStorage.getItem("medications")) || [];
            const stillUntaken = refreshed.find((m) => m.id === med.id && !m.taken);
            if (stillUntaken) {
              showReminder(med, true);
            }
          }, 1800000);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [medications]);

  const showReminder = (med, isRepeat = false) => {
    const msg = isRepeat
      ? t('reminder_still_untaken') + ` ${med.name} (${med.dosage})`
      : t('time_to_take') + ` ${med.name} (${med.dosage})`;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t('medication_reminder'), { body: msg });
    } else {
      alert(msg);
    }
  };

  const addMedication = async (med) => {
    if (plan === "free" && medications.length >= 3) {
      alert(t('free_limit_reached'));
      setShowUpgrade(true);
      return;
    }

    const newMed = { ...med, taken: false, id: Date.now() };
    const updatedList = [...medications, newMed];
    setMedications(updatedList);

    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);

    const payload = { type: "medication", data: newMed, timestamp: Date.now() };

    try {
      if (!navigator.onLine) {
        await queueAction(payload);
        alert(t('offline_saved'));
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log(t('medication_synced'));
      }
    } catch (err) {
      console.error("Error syncing medication:", err);
    }
  };

  const markAsTaken = async (id) => {
    const updated = medications.map((med) =>
      med.id === id ? { ...med, taken: true, takenAt: new Date().toLocaleTimeString() } : med
    );
    setMedications(updated);
    updateDailyAdherence(updated);

    const payload = { type: "markTaken", data: { id }, timestamp: Date.now() };

    try {
      if (!navigator.onLine) {
        await queueAction(payload);
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error("Error syncing markAsTaken:", err);
    }
  };

  const updateDailyAdherence = (updatedMeds) => {
    const today = new Date().toLocaleDateString();
    const allowedMeds = plan === "free" ? updatedMeds.slice(0, 3) : updatedMeds;

    const takenCount = allowedMeds.filter((m) => m.taken).length;
    const total = allowedMeds.length;
    const percent = total === 0 ? 0 : Math.round((takenCount / total) * 100);

    const updatedHistory = { ...adherenceHistory, [today]: percent };
    setAdherenceHistory(updatedHistory);
    setAdherence(percent);

    localStorage.setItem("adherenceHistory", JSON.stringify(updatedHistory));

    if (percent === 100) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t('excellent_all_taken'), {
          body: t('all_meds_today'),
        });
      } else {
        alert(t('all_meds_today'));
      }
    }
  };

  const deleteMedication = async (id) => {
    if (!confirm(t('delete_medication_confirm') || "Delete this medication?")) return;
    
    const filtered = medications.filter((med) => med.id !== id);
    setMedications(filtered);
    updateDailyAdherence(filtered);

    usageLimiter.decrementMedicationCount();
    const stats = usageLimiter.getUsageStats();
    setUsageStats(stats);

    const payload = { type: "deleteMedication", data: { id }, timestamp: Date.now() };

    try {
      if (!navigator.onLine) {
        await queueAction(payload);
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.error("Error syncing delete:", err);
    }
  };

  const calculateAdherence = () => {
    if (medications.length === 0) {
      setAdherence(0);
      return;
    }
    const takenCount = medications.filter((m) => m.taken).length;
    const percent = Math.round((takenCount / medications.length) * 100);
    setAdherence(percent);
  };

  const handleExportICS = () => {
    if (medications.length === 0) return alert(t('no_medications_export'));
    const icsText = generateICS(medications, 30);
    downloadICS(icsText);
  };

  const handlePremiumUpgradeSuccess = () => {
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      usageLimiter.setPremiumStatus(expiryDate);
      console.log("Premium upgrade successful - status updated");
    } catch (err) {
      console.error("Failed to update premium status:", err);
    }
  };

  const handleUpgrade = () => {
    handlePremiumUpgradeSuccess();
    localStorage.setItem("plan", "premium");
    setShowUpgrade(false);
    alert(t('upgrade_successful'));
    navigate("/premium");
  };

  const toggleCardExpansion = (id) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // Filter and search medications
  const filteredMedications = medications.filter((med) => {
    const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" ||
                         (filterStatus === "taken" && med.taken) ||
                         (filterStatus === "pending" && !med.taken);
    return matchesSearch && matchesFilter;
  });

  const chartData = Object.entries(adherenceHistory).map(([date, percent]) => ({
    date,
    percent,
  }));

  if (!usageStats) {
    return <div className="medication-list__loading">{t('loading')}</div>;
  }

  return (
    <div className="medication-list">
      {/* Header */}
      <div className="medication-list__header">
        <div>
          <h1 className="medication-list__title">{t('my_medications')}</h1>
          <p className="medication-list__subtitle">
            {t('adherence_rate')}: <strong>{adherence}%</strong>
          </p>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={handleStartTutorial}
          title={t('tutorial_help')}
        >
          {t('replay_tutorial')} 🎓
        </Button>
      </div>

      {/* Usage Stats */}
      {!usageStats.isPremium && (
        <div className="usage-stats">
          <div className="usage-stats__content">
            <span className="usage-stats__label">{t('free_plan_usage')}</span>
            <span className="usage-stats__value">
              {usageStats.medicationCount}/{usageStats.medicationLimit} {t('medications_used')}
            </span>
          </div>
          <ProgressBar 
            value={usageStats.medicationCount} 
            max={usageStats.medicationLimit}
            variant={usageStats.medicationCount >= usageStats.medicationLimit ? "warning" : "primary"}
          />
        </div>
      )}

      {/* Limit Warning */}
      {!usageStats.isPremium && usageStats.medicationCount >= usageStats.medicationLimit && (
        <div className="limit-warning">
          <div className="limit-warning__content">
            <span className="limit-warning__icon">⚠️</span>
            <div>
              <strong>{t('reached_free_limit')}</strong>
              <p>{t('free_plan_limit_modal')}</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => navigate("/premium")}
          >
            {t('upgrade_now')}
          </Button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="medication-list__actions">
        <Button
          variant="secondary"
          size="small"
          onClick={handleExportICS}
        >
          {t('export_ics')}
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            if (confirm(t('clear_all_confirm'))) {
              setMedications([]);
              localStorage.removeItem("medications");
            }
          }}
        >
          {t('clear_all')}
        </Button>
      </div>

      {/* Add Medication Form */}
      <MedicationForm onAddMedication={addMedication} />

      {/* Adherence Chart */}
      {chartData.length > 0 && (
        <Card className="adherence-chart">
          <div className="adherence-chart__header">
            <h3 className="adherence-chart__title">📊 {t('adherence_trend')}</h3>
          </div>
          <div className="adherence-chart__body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: "var(--neutral-600)" }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fill: "var(--neutral-600)" }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "var(--neutral-0)",
                    border: "1px solid var(--neutral-200)",
                    borderRadius: "var(--radius-md)"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="percent" 
                  stroke="var(--primary-500)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--primary-500)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="medication-list__controls">
        <Input
          type="text"
          placeholder="Search medications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="medication-list__search"
        />
        <div className="medication-list__filters">
          <button
            className={`filter-btn ${filterStatus === "all" ? "filter-btn--active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "filter-btn--active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filterStatus === "taken" ? "filter-btn--active" : ""}`}
            onClick={() => setFilterStatus("taken")}
          >
            Taken
          </button>
        </div>
      </div>

      {/* Medication Cards */}
      <div className="medication-cards">
        {filteredMedications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">💊</div>
            <h3 className="empty-state__title">{t('no_meds')}</h3>
            <p className="empty-state__description">
              {searchQuery || filterStatus !== "all" 
                ? "No medications match your search or filter."
                : "Add your first medication to get started."}
            </p>
          </div>
        ) : (
          filteredMedications.map((med) => {
            const isExpanded = expandedCards.has(med.id);
            const progress = med.taken ? 100 : 0;

            return (
              <Card 
                key={med.id} 
                className={`medication-card ${med.taken ? "medication-card--taken" : ""}`}
              >
                <div className="medication-card__header">
                  <div className="medication-card__info">
                    <h3 className="medication-card__name">{med.name}</h3>
                    <p className="medication-card__dosage">{med.dosage}</p>
                  </div>
                  <Badge variant={med.taken ? "success" : "warning"}>
                    {med.taken ? "Taken" : "Pending"}
                  </Badge>
                </div>

                <div className="medication-card__progress">
                  <ProgressBar value={progress} max={100} />
                </div>

                <div className="medication-card__details">
                  <div className="medication-card__time">
                    <span className="medication-card__label">Time:</span>
                    <span className="medication-card__value">{med.time || "Not set"}</span>
                  </div>
                  {med.taken && med.takenAt && (
                    <div className="medication-card__taken-time">
                      <span className="medication-card__label">{t('taken_at')}:</span>
                      <span className="medication-card__value">{med.takenAt}</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="medication-card__expanded">
                    <div className="medication-card__meta">
                      <p><strong>Added:</strong> {new Date(med.id).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {med.taken ? "Completed" : "Pending"}</p>
                    </div>
                  </div>
                )}

                <div className="medication-card__actions">
                  {!med.taken && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => markAsTaken(med.id)}
                      fullWidth
                    >
                      {t('mark_as_taken')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => toggleCardExpansion(med.id)}
                  >
                    {isExpanded ? "Show Less" : "Show More"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => deleteMedication(med.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="upgrade-modal">
          <div className="upgrade-modal__backdrop" onClick={() => setShowUpgrade(false)} />
          <div className="upgrade-modal__content">
            <h3 className="upgrade-modal__title">{t('upgrade_to_premium_modal')}</h3>
            <p className="upgrade-modal__description">{t('free_plan_limit_modal')}</p>
            <div className="upgrade-modal__actions">
              <Button
                variant="primary"
                onClick={handleUpgrade}
              >
                {t('upgrade_now')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowUpgrade(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationList;
