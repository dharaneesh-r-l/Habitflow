import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Share, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon, Sun, Bell, Vibrate, Calendar, Download, Trash2, Info,
  ChevronRight, Flame, Zap, Target, User,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Icon } from '@/components/IconHelper';
import { getLevelFromXP } from '@/utils/date';
import { spacing, typeScale } from '@/theme/tokens';

export default function ProfileScreen() {
  const { theme, mode, toggle } = useAppTheme();
  const preferences = useHabitStore((s) => s.preferences);
  const stats = useHabitStore((s) => s.stats);
  const achievements = useHabitStore((s) => s.achievements);
  const habits = useHabitStore((s) => s.habits);
  const updatePreferences = useHabitStore((s) => s.updatePreferences);
  const resetAllData = useHabitStore((s) => s.resetAllData);
  const exportData = useHabitStore((s) => s.exportData);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const levelInfo = getLevelFromXP(stats.xp);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);

  const handleExport = async () => {
    try {
      const data = exportData();
      await Share.share({ message: data, title: 'HabitFlow Data Export' });
    } catch {
      Alert.alert('Export failed', 'Could not share data.');
    }
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    resetAllData();
  };

  const handleNotificationPreference = async (enabled: boolean) => {
    try {
      await updatePreferences({ notificationsEnabled: enabled });
    } catch {
      Alert.alert(
        'Notifications unavailable',
        'Allow HabitFlow to send notifications in your device settings to receive habit reminders.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>

        {/* Profile card */}
        <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 24 }}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryDim, borderColor: theme.primary }]}>
            <User size={32} color={theme.primary} />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{preferences.userName === 'there' ? 'HabitFlow User' : preferences.userName}</Text>
          <View style={styles.levelBadge}>
            <Zap size={14} color={theme.accent} />
            <Text style={[styles.levelText, { color: theme.accent }]}>Level {levelInfo.level}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Flame size={18} color={theme.warning} />
              <Text style={[styles.profileStatValue, { color: theme.text }]}>{stats.currentStreak}</Text>
              <Text style={[styles.profileStatLabel, { color: theme.textSecondary }]}>Streak</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.profileStat}>
              <Zap size={18} color={theme.accent} />
              <Text style={[styles.profileStatValue, { color: theme.text }]}>{stats.xp}</Text>
              <Text style={[styles.profileStatLabel, { color: theme.textSecondary }]}>XP</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.profileStat}>
              <Target size={18} color={theme.success} />
              <Text style={[styles.profileStatValue, { color: theme.text }]}>{stats.totalCompletions}</Text>
              <Text style={[styles.profileStatLabel, { color: theme.textSecondary }]}>Done</Text>
            </View>
          </View>
        </Card>

        {/* Name input */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Display Name</Text>
          <ProfileNameInput theme={theme} value={preferences.userName} onSave={(v) => updatePreferences({ userName: v })} />
        </Card>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        <Card style={{ marginBottom: 16, padding: 0 }}>
          <SettingRow
            icon={mode === 'dark' ? <Moon size={20} color={theme.primary} /> : <Sun size={20} color={theme.warning} />}
            label="Dark Theme"
            theme={theme}
            right={<Switch accessibilityLabel="Dark theme" value={mode === 'dark'} onValueChange={toggle} trackColor={{ true: theme.primary, false: theme.border }} />}
          />
        </Card>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
        <Card style={{ marginBottom: 16, padding: 0 }}>
          <SettingRow
            icon={<Bell size={20} color={theme.accent} />}
            label="Notifications"
            theme={theme}
            helper="Schedule reminders for active habits."
            right={<Switch accessibilityLabel="Habit reminders" value={preferences.notificationsEnabled} onValueChange={handleNotificationPreference} trackColor={{ true: theme.primary, false: theme.border }} />}
          />
          <SettingDivider theme={theme} />
          <SettingRow
            icon={<Vibrate size={20} color={theme.primary} />}
            label="Haptic Feedback"
            theme={theme}
            right={<Switch accessibilityLabel="Haptic feedback" value={preferences.hapticsEnabled} onValueChange={(v) => updatePreferences({ hapticsEnabled: v })} trackColor={{ true: theme.primary, false: theme.border }} />}
          />
          <SettingDivider theme={theme} />
          <SettingRow
            icon={<Calendar size={20} color={theme.success} />}
            label="Week Starts On"
            theme={theme}
            right={
              <Pressable
                onPress={() => updatePreferences({ weekStart: preferences.weekStart === 0 ? 1 : 0 })}
                accessibilityRole="button"
                accessibilityLabel={`Week starts on ${preferences.weekStart === 0 ? 'Sunday' : 'Monday'}. Change week start day`}
              >
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{preferences.weekStart === 0 ? 'Sunday' : 'Monday'}</Text>
              </Pressable>
            }
          />
        </Card>

        {/* Achievements */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements ({unlockedAchievements.length}/{achievements.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {achievements.map((ach) => {
              const isUnlocked = !!ach.unlockedAt;
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: isUnlocked ? theme.primaryDim : theme.card,
                      borderColor: isUnlocked ? theme.primary : theme.cardBorder,
                      opacity: isUnlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <View style={[styles.achievementIcon, { backgroundColor: isUnlocked ? theme.primary + '22' : theme.surfaceAlt }]}>
                    <Icon name={ach.icon} size={24} color={isUnlocked ? theme.primary : theme.textMuted} />
                  </View>
                  <Text style={[styles.achievementTitle, { color: theme.text }]} numberOfLines={1}>{ach.title}</Text>
                  <Text style={[styles.achievementDesc, { color: theme.textSecondary }]} numberOfLines={2}>{ach.description}</Text>
                  {isUnlocked ? (
                    <Text style={[styles.achievementStatus, { color: theme.primary }]}>Unlocked</Text>
                  ) : (
                    <Text style={[styles.achievementStatus, { color: theme.textMuted }]}>Locked</Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Data & Backup</Text>
        <Card style={{ marginBottom: 16, padding: 0 }}>
          <PressableRow icon={<Download size={20} color={theme.accent} />} label="Export Data" theme={theme} onPress={handleExport} />
          <SettingDivider theme={theme} />
          <PressableRow icon={<Trash2 size={20} color={theme.error} />} label="Reset All Data" theme={theme} onPress={() => setShowResetConfirm(true)} danger />
        </Card>

        {/* About */}
        <Card style={{ marginBottom: 16, padding: 0 }}>
          <PressableRow icon={<Info size={20} color={theme.textSecondary} />} label="About HabitFlow" theme={theme} onPress={() => setShowAbout(true)} />
        </Card>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>HabitFlow v1.0.0</Text>
      </ScrollView>

      {/* Reset confirm */}
      <ModalSheet visible={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data?">
        <View style={{ gap: 16 }}>
          <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
            This will permanently delete all your habits, completion history, achievements, and settings. This action cannot be undone.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowResetConfirm(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Reset Everything" onPress={handleReset} />
            </View>
          </View>
        </View>
      </ModalSheet>

      {/* About modal */}
      <ModalSheet visible={showAbout} onClose={() => setShowAbout(false)} title="About HabitFlow">
        <View style={{ gap: 16 }}>
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={[styles.aboutIcon, { backgroundColor: theme.primaryDim }]}>
              <Flame size={40} color={theme.primary} />
            </View>
            <Text style={[styles.aboutTitle, { color: theme.text }]}>HabitFlow</Text>
            <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          </View>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            HabitFlow is a premium habit tracking application designed to help you build better routines through tracking, analytics, and gamification. All your data is stored locally on your device for complete privacy.
          </Text>
          <View style={{ gap: 8 }}>
            <AboutRow label="Habits tracked" value={`${habits.length}`} theme={theme} />
            <AboutRow label="Total completions" value={`${stats.totalCompletions}`} theme={theme} />
            <AboutRow label="Longest streak" value={`${stats.longestStreak} days`} theme={theme} />
            <AboutRow label="Perfect days" value={`${stats.perfectDays}`} theme={theme} />
            <AboutRow label="Achievements" value={`${unlockedAchievements.length}/${achievements.length}`} theme={theme} />
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}

function ProfileNameInput({ theme, value, onSave }: { theme: any; value: string; onSave: (v: string) => void }) {
  const [name, setName] = useState(value === 'there' ? '' : value);
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      <TextInput
        style={[styles.nameInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        placeholderTextColor={theme.textMuted}
      />
      <Button title="Save" size="sm" onPress={() => onSave(name.trim() || 'there')} disabled={!name.trim() && value === 'there'} />
    </View>
  );
}

function SettingRow({ icon, label, theme, right, helper }: { icon: React.ReactNode; label: string; theme: any; right?: React.ReactNode; helper?: string }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
          {helper && <Text style={[styles.settingHelper, { color: theme.textMuted }]}>{helper}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

function PressableRow({ icon, label, theme, onPress, danger }: { icon: React.ReactNode; label: string; theme: any; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={(state) => ({ opacity: state.pressed ? 0.7 : 1 })}>
      <View style={styles.settingRow}>
        <View style={styles.settingLeft}>
          {icon}
          <Text style={[styles.settingLabel, { color: danger ? theme.error : theme.text }]}>{label}</Text>
        </View>
        <ChevronRight size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );
}

function SettingDivider({ theme }: { theme: any }) {
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function AboutRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={[styles.aboutRowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.aboutRowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: typeScale.screenTitle,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(34,211,238,0.1)',
  },
  levelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  profileStat: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  profileStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 36,
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  settingHelper: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  settingValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  nameInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  achievementCard: {
    width: 130,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    minHeight: 28,
  },
  achievementStatus: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  confirmText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  aboutIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  aboutVersion: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  aboutText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aboutRowLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  aboutRowValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    fontWeight: '700',
  },
});
