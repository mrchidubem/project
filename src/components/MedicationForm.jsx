// src/components/MedicationForm.jsx
import React, { useState } from "react";
import { queueAction } from "../utils/offlineQueue";
import { useTranslation } from "react-i18next";
import usageLimiter from "../utils/usageLimiter";
import { useNavigate } from "react-router-dom";

const MedicationForm = ({ onAddMedication }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    time: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.dosage || !formData.time) {
      alert(t("please_fill_all_fields"));
      return;
    }

    // Check usage limits before allowing medication addition
    if (!usageLimiter.canAddMedication()) {
      const stats = usageLimiter.getUsageStats();
      alert(
        `You've reached your free limit of ${stats.medicationLimit} medications. Upgrade to Premium for unlimited access!`
      );
      navigate("/premium");
      return;
    }

    const payload = {
      type: "medication",
      data: formData,
      timestamp: Date.now(),
    };

    try {
      if (!navigator.onLine) {
        await queueAction(payload);
        alert(t("offline_saved"));
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        alert(t("synced_success"));
      }

      if (onAddMedication) {
        onAddMedication(formData);
      }

      // Increment usage counter after successful addition
      usageLimiter.incrementMedicationCount();

      setFormData({ name: "", dosage: "", time: "" });
    } catch (err) {
      console.error("Error submitting:", err);
      alert(t("submit_error"));
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>{t("add_medication")}</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        <input
          type="text"
          name="name"
          placeholder={t("med_name_placeholder")}
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="dosage"
          placeholder={t("dosage_placeholder")}
          value={formData.dosage}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "10px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {t("save_medication")}
        </button>
      </form>
    </div>
  );
};

export default MedicationForm;
