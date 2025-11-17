import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, ProgressBar, Button } from "./ui";
import usageLimiter from "../utils/usageLimiter.js";
import onboardingManager from "../utils/onboardingManager";
import "./Dashboard.css";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [adherenceHistory, setAdherenceHistory] = useState({});
  const [medications, setMedications] = useState([]);
  const [adrReports, setAdrReports] = useState([]);
  const todayKey = new Date().toLocaleDateString();
  const [todayPercent, setTodayPercent] = useState(0);
  const [userName, setUserName] = useState("");

  const handleStartTutorial = () => {
    onboardingManager.startManualTutorial();
    window.dispatchEvent(new CustomEvent('restartOnboarding'));
  };

  // Load persisted data
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("adherenceHistory")) || {};
    const savedMeds = JSON.parse(localStorage.getItem("medications")) || [];
    const savedADRs = JSON.parse(localStorage.getItem("adrReports")) || [];
    const savedName = localStorage.getItem("userName") || "there";

    setAdherenceHistory(savedHistory);
    setMedications(savedMeds);
    setAdrReports(savedADRs);
    setUserName(savedName);

    // Compute today's adherence
    if (typeof savedHistory[todayKey] !== "undefined") {
      setTodayPercent(savedHistory[todayKey]);
    } else {
      const isPremium = usageLimiter.isPremiumUser();
      const allowed = isPremium ? savedMeds : savedMeds.slice(0, 3);
      const takenCount = allowed.filter((m) => m.taken).length;
      const pct = allowed.length === 0 ? 0 : Math.round((takenCount / allowed.length) * 100);
      setTodayPercent(pct);
    }
  }, [todayKey]);

  const syncAdherenceHistory = (percent) => {
    const newHistory = { ...adherenceHistory, [todayKey]: percent };
    setAdherenceHistory(newHistory);
    localStorage.setItem("adherenceHistory", JSON.stringify(newHistory));
  };

  // Medication quick actions
  const markAsTaken = (id) => {
    const updated = medications.map((m) =>
      m.id === id ? { ...m, taken: true, takenAt: new Date().toLocaleTimeString() } : m
    );
    setMedications(updated);
    localStorage.setItem("medications", JSON.stringify(updated));

    const isPremium = usageLimiter.isPremiumUser();
    const allowed = isPremium ? updated : updated.slice(0, 3);
    const takenCount = allowed.filter((m) => m.taken).length;
    const percent = allowed.length === 0 ? 0 : Math.round((takenCount / allowed.length) * 100);
    setTodayPercent(percent);
    syncAdherenceHistory(percent);

    if (percent === 100) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🎉 Great job!", { body: "You completed today's medications." });
      }
    }
  };

  // Weekly trend data
  const weeklyTrend = Object.keys(adherenceHistory)
    .sort((a, b) => new Date(a) - new Date(b))
    .slice(-7)
    .map((day) => ({ date: day, adherence: adherenceHistory[day] }));

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning') || "Good morning";
    if (hour < 18) return t('good_afternoon') || "Good afternoon";
    return t('good_evening') || "Good evening";
  };

  // Get motivational message
  const getMotivation = (percent) => {
    if (percent === 100) return "🎉 Perfect — all meds taken today!";
    if (percent >= 75) return "💪 Great progress — almost there!";
    if (percent >= 40) return "👍 Keep going — consistency matters.";
    if (percent > 0) return "⏳ Take the rest to stay on track.";
    return "📌 Start your day by taking your medications.";
  };

  // Get today's medications
  const isPremium = usageLimiter.isPremiumUser();
  const todayMeds = isPremium ? medications : medications.slice(0, 3);
  const takenToday = todayMeds.filter(m => m.taken).length;
  const upcomingMeds = todayMeds.filter(m => !m.taken).slice(0, 3);

  // Recent activity
  const recentActivity = [
    ...medications
      .filter(m => m.taken && m.takenAt)
      .map(m => ({
        type: 'medication',
        text: `Took ${m.name}`,
        time: m.takenAt,
        icon: '💊'
      })),
    ...adrReports.slice(0, 3).map(r => ({
      type: 'adr',
      text: `Reported ADR: ${r.medication}`,
      time: r.date,
      icon: '⚠️'
    }))
  ].slice(0, 5);

  return (
    <div className="dashboard page-enter">
      {/* Hero Section */}
      <div className="dashboard__hero">
        <h1 className="dashboard__greeting">{getGreeting()}, {userName}!</h1>
        <p className="dashboard__motivation">{getMotivation(todayPercent)}</p>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard__stats">
        <Card className="stat-card">
          <div className="stat-card__icon">💊</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{medications.length}</div>
            <div className="stat-card__label">Total Medications</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card__icon">📅</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{takenToday}/{todayMeds.length}</div>
            <div className="stat-card__label">Today's Doses</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card__icon">📊</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{todayPercent}%</div>
            <div className="stat-card__label">Adherence Rate</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-card__icon">⚠️</div>
          <div className="stat-card__content">
            <div className="stat-card__value">{adrReports.length}</div>
            <div className="stat-card__label">ADR Reports</div>
          </div>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="dashboard__progress">
        <div className="progress-header">
          <div>
            <h3 className="progress-title">Daily Progress</h3>
            <p className="progress-date">{todayKey}</p>
          </div>
          <div className="progress-percent">{todayPercent}%</div>
        </div>
        <ProgressBar value={todayPercent} max={100} />
      </Card>

      {/* Quick Actions */}
      <div className="dashboard__section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Card className="action-card" clickable onClick={() => navigate('/medications')}>
            <div className="action-card__icon">💊</div>
            <h3 className="action-card__title">My Medications</h3>
            <p className="action-card__description">View and manage</p>
          </Card>

          <Card className="action-card" clickable onClick={() => navigate('/adr')}>
            <div className="action-card__icon">⚠️</div>
            <h3 className="action-card__title">Report ADR</h3>
            <p className="action-card__description">Side effects</p>
          </Card>

          <Card className="action-card" clickable onClick={() => navigate('/pharmacy-finder')}>
            <div className="action-card__icon">🏥</div>
            <h3 className="action-card__title">Find Pharmacy</h3>
            <p className="action-card__description">Nearby locations</p>
          </Card>

          <Card className="action-card" clickable onClick={handleStartTutorial}>
            <div className="action-card__icon">🎓</div>
            <h3 className="action-card__title">Tutorial</h3>
            <p className="action-card__description">Learn features</p>
          </Card>
        </div>
      </div>

      {/* Upcoming Medications */}
      {upcomingMeds.length > 0 && (
        <Card className="dashboard__upcoming">
          <h3 className="card-title">Upcoming Medications</h3>
          <div className="upcoming-list">
            {upcomingMeds.map((med) => (
              <div key={med.id} className="upcoming-item">
                <div className="upcoming-item__time">{med.time || "Not set"}</div>
                <div className="upcoming-item__info">
                  <div className="upcoming-item__name">{med.name}</div>
                  <div className="upcoming-item__dosage">{med.dosage}</div>
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => markAsTaken(med.id)}
                >
                  Take Now
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Adherence Trend */}
      {weeklyTrend.length > 0 && (
        <Card className="dashboard__chart">
          <h3 className="card-title">7-Day Adherence Trend</h3>
          <p className="card-subtitle">Your weekly progress</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrend}>
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
                <Bar 
                  dataKey="adherence" 
                  fill="var(--primary-500)" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card className="dashboard__activity">
          <h3 className="card-title">Recent Activity</h3>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-item__icon">{activity.icon}</div>
                <div className="activity-item__content">
                  <div className="activity-item__text">{activity.text}</div>
                  <div className="activity-item__time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {medications.length === 0 && (
        <Card className="dashboard__empty">
          <div className="empty-state">
            <div className="empty-state__icon">💊</div>
            <h3 className="empty-state__title">No medications yet</h3>
            <p className="empty-state__description">
              Start by adding your first medication to track your adherence
            </p>
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate('/medications')}
            >
              Add Medication
            </Button>
          </div>
        </Card>
      )}

      {/* Premium Upgrade CTA */}
      {!usageLimiter.isPremiumUser() && (
        <Card className="dashboard__premium">
          <div className="premium-cta">
            <div className="premium-cta__content">
              <h3 className="premium-cta__title">🌟 Upgrade to Premium</h3>
              <p className="premium-cta__description">
                Unlimited medications, advanced analytics, and more
              </p>
            </div>
            <Button
              variant="accent"
              onClick={() => navigate('/premium')}
            >
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
