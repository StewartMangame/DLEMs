"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useLanguage } from "@/lib/LanguageContext";
import { fetchActiveAnnouncements } from "@/lib/api";
import { 
  ArrowLeft,
  Bell
} from "lucide-react";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    fetchActiveAnnouncements()
      .then((data) => {
        setAnnouncements(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setAnnouncements([]);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, color: "var(--color-text-muted)" }}>
        {t("home.loadingAnnouncements")}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/user/dashboard" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> {t("nav.back")}
        </Link>
        <h1 className="text-h2">{t("home.announcements")}</h1>
      </div>

      {announcements.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: "var(--color-text-muted)" }}>
          <p>{t("home.noAnnouncements")}</p>
        </div>
      ) : (
        <div className={styles.actionsSection}>
          <h2 className="text-h3">{t("home.recentAnnouncements")}</h2>
          <div className={styles.actions}>
            {announcements.map((announcement) => (
              <Link key={announcement.id} href="#" className={`card card-hover ${styles.actionCard}`} style={{ display: 'block', width: '100%' }}>
                <div className={styles.actionIcon} style={{ background: 'rgba(0,200,150,0.15)' }}>
                  <Bell size={20} color="var(--color-text-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {language === "ny"
                      ? announcement.message_chichewa || announcement.message_english
                      : announcement.message_english}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(announcement.createdAt || announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
