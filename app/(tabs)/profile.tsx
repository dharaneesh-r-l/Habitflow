import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Share,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Bell,
  Vibrate,
  Calendar,
  Download,
  Trash2,
  Flame,
  Zap,
  Target,
  User,
  Trophy,
  ShieldAlert,
  Sparkles,
  Sunrise,
  Clock,
  Edit3,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { useHabitStore } from '@/store/habitStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Icon } from '@/components/IconHelper';
import { getLevelFromXP } from '@/utils/date';
import { spacing, radius } from '@/theme/tokens';
import {
  ClockTimePickerModal,
  format12Hour,
} from '@/components/ui/ClockTimePickerModal';

export default function ProfileScreen() {
  const { theme, mode, toggle } = useAppTheme();
  const preferences = useHabitStore((s) => s.preferences);
  const stats = useHabitStore((s) => s.stats);
  const achievements = useHabitStore((s) => s.achievements);
  const updatePreferences = useHabitStore((s) => s.updatePreferences);
  const resetAllData = useHabitStore((s) => s.resetAllData);
  const seedSampleData = useHabitStore((s) => s.seedSampleData);
  const exportData = useHabitStore((s) => s.exportData);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(preferences.userName);
  const [nicknameInput, setNicknameInput] = useState(preferences.nickname || '');
  const [wakeUpInput, setWakeUpInput] = useState(preferences.wakeUpTime || '07:00');
  const [hasWakeUp, setHasWakeUp] = useState(!!preferences.wakeUpTime);
  const [bedTimeInput, setBedTimeInput] = useState(preferences.bedTime || '23:00');
  const [hasBedTime, setHasBedTime] = useState(!!preferences.bedTime);
  const [clockTarget, setClockTarget] = useState<'wakeup' | 'bedtime' | null>(null);

  const levelInfo = getLevelFromXP(stats.xp);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt);

  const openProfileEditor = () => {
    setNameInput(preferences.userName === 'there' ? '' : preferences.userName);
    setNicknameInput(preferences.nickname || '');
    setWakeUpInput(preferences.wakeUpTime || '07:00');
    setHasWakeUp(!!preferences.wakeUpTime);
    setBedTimeInput(preferences.bedTime || '23:00');
    setHasBedTime(!!preferences.bedTime);
    setEditingProfile(true);
  };

  const handleExport = async () => {
    try {
      const data = exportData();
      await Share.share({
        message: data,
        title: 'HabitFlow Backup Data',
      });
    } catch {
      Alert.alert('Export Failed', 'Could not open share sheet for export.');
    }
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      Alert.alert('First Name Required', 'Please enter your first name.');
      return;
    }
    await updatePreferences({
      userName: nameInput.trim(),
      nickname: nicknameInput.trim() || undefined,
      wakeUpTime: hasWakeUp ? wakeUpInput : undefined,
      bedTime: hasBedTime ? bedTimeInput : undefined,
    });
    setEditingProfile(false);
  };

  const handleClockConfirm = (time24: string) => {
    if (clockTarget === 'wakeup') {
      setWakeUpInput(time24);
      setHasWakeUp(true);
    } else if (clockTarget === 'bedtime') {
      setBedTimeInput(time24);
      setHasBedTime(true);
    }
    setClockTarget(null);
  };

  const handleNotificationPreference = async (enabled: boolean) => {
    try {
      await updatePreferences({ notificationsEnabled: enabled });
    } catch {
      Alert.alert(
        'Notifications Unavailable',
        'Please grant notification permission in your Android device settings.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 110 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Settings & Profile</Text>

        {/* Profile Card */}
        <Card
          highlight
          style={{
            marginVertical: spacing.md,
            paddingVertical: spacing.lg,
            alignItems: 'center',
            backgroundColor: theme.surface,
          }}
        >
          {/* Avatar Ring */}
          <View
            style={[
              styles.avatarWrap,
              { backgroundColor: theme.primaryDim, borderColor: theme.primary },
            ]}
          >
            <User size={36} color={theme.primaryLight} strokeWidth={2.2} />
          </View>

          {/* User Name */}
          <Pressable
            onPress={openProfileEditor}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}
          >
            <Text style={[styles.userNameText, { color: theme.text }]}>
              {preferences.userName === 'there' ? 'HabitFlow Athlete' : preferences.userName}
            </Text>
            {preferences.nickname && (
              <View style={[styles.nicknameBadge, { backgroundColor: theme.primaryDim }]}>
                <Text style={[styles.nicknameBadgeText, { color: theme.primaryLight }]}>
                  @{preferences.nickname}
                </Text>
              </View>
            )}
            <Edit3 size={15} color={theme.textMuted} />
          </Pressable>

          {/* Daily Routine Summary (Wake-up & Bedtime) */}
          {(preferences.wakeUpTime || preferences.bedTime) && (
            <View style={styles.routinePillsRow}>
              {preferences.wakeUpTime && (
                <View style={[styles.profileRoutinePill, { backgroundColor: theme.surfaceAlt }]}>
                  <Sunrise size={12} color="#FFA07A" />
                  <Text style={[styles.profileRoutineText, { color: theme.textSecondary }]}>
                    {format12Hour(preferences.wakeUpTime)}
                  </Text>
                </View>
              )}
              {preferences.bedTime && (
                <View style={[styles.profileRoutinePill, { backgroundColor: theme.surfaceAlt }]}>
                  <Moon size={12} color="#8B5CF6" />
                  <Text style={[styles.profileRoutineText, { color: theme.textSecondary }]}>
                    {format12Hour(preferences.bedTime)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Level Pill */}
          <View style={[styles.levelPill, { backgroundColor: theme.xpDim, borderColor: theme.xp + '40' }]}>
            <Zap size={13} color={theme.xp} />
            <Text style={[styles.levelPillText, { color: theme.xp }]}>
              Level {levelInfo.level} · {levelInfo.currentLevelXP}/{levelInfo.nextLevelXP} XP
            </Text>
          </View>

          {/* XP Progress Track */}
          <View style={styles.xpWrap}>
            <View style={[styles.xpTrack, { backgroundColor: theme.surfaceAlt }]}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${Math.round(levelInfo.progress * 100)}%`, backgroundColor: theme.primary },
                ]}
              />
            </View>
          </View>

          {/* Stats Summary Bar */}
          <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
            <View style={styles.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flame size={16} color={theme.streak} />
                <Text style={[styles.statNum, { color: theme.text }]}>{stats.currentStreak}d</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Target size={16} color={theme.accent} />
                <Text style={[styles.statNum, { color: theme.text }]}>{stats.totalCompletions}</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

            <View style={styles.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Trophy size={16} color={theme.xp} />
                <Text style={[styles.statNum, { color: theme.text }]}>{stats.perfectDays}</Text>
              </View>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Perfect Days</Text>
            </View>
          </View>
        </Card>

        {/* Appearance Settings */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Appearance</Text>
        <Card style={{ marginBottom: spacing.md, padding: 0, backgroundColor: theme.surface }}>
          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.primaryDim }]}>
              {mode === 'dark' ? (
                <Moon size={18} color={theme.primaryLight} />
              ) : (
                <Sun size={18} color={theme.warning} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                {mode === 'dark' ? 'Obsidian Navy aesthetic' : 'Porcelain Slate aesthetic'}
              </Text>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggle}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Preferences */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Preferences</Text>
        <Card style={{ marginBottom: spacing.md, padding: 0, backgroundColor: theme.surface }}>
          {/* Personal Profile Row */}
          <Pressable onPress={openProfileEditor} style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.primaryDim }]}>
              <User size={18} color={theme.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Personal Profile</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Name, nickname, wake-up & bedtime
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.accentDim }]}>
              <Bell size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Reminders & Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Daily local notifications on Android
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={handleNotificationPreference}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.primaryDim }]}>
              <Vibrate size={18} color={theme.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Haptic Feedback</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Tactile feedback when logging habits
              </Text>
            </View>
            <Switch
              value={preferences.hapticsEnabled}
              onValueChange={(v) => updatePreferences({ hapticsEnabled: v })}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          <View style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.xpDim }]}>
              <Calendar size={18} color={theme.xp} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>First Day of Week</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                {preferences.weekStart === 1 ? 'Monday' : 'Sunday'}
              </Text>
            </View>
            <Pressable
              onPress={() => updatePreferences({ weekStart: preferences.weekStart === 1 ? 0 : 1 })}
              style={[styles.weekPill, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            >
              <Text style={[styles.weekPillText, { color: theme.primaryLight }]}>
                {preferences.weekStart === 1 ? 'Mon' : 'Sun'}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Achievements Showcase */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.sm }}>
          <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
            Achievements
          </Text>
          <Text style={[styles.achievementRatio, { color: theme.primaryLight }]}>
            {unlockedAchievements.length} / {achievements.length} Unlocked
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {achievements.map((ach) => {
              const isUnlocked = !!ach.unlockedAt;
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isUnlocked ? theme.primary : theme.cardBorder,
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: isUnlocked ? theme.primary + '25' : theme.surfaceAlt },
                    ]}
                  >
                    <Icon name={ach.icon} size={22} color={isUnlocked ? theme.primaryLight : theme.textMuted} />
                  </View>
                  <Text style={[styles.achTitle, { color: theme.text }]} numberOfLines={1}>
                    {ach.title}
                  </Text>
                  <Text style={[styles.achDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {ach.description}
                  </Text>
                  <View style={[styles.achStatusPill, { backgroundColor: isUnlocked ? theme.successDim : theme.surfaceAlt }]}>
                    <Text style={[styles.achStatusText, { color: isUnlocked ? theme.success : theme.textMuted }]}>
                      {isUnlocked ? 'Unlocked' : 'In Progress'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Data & Backup Management */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Data & Backup</Text>
        <Card style={{ marginBottom: spacing.md, padding: 0, backgroundColor: theme.surface }}>
          <Pressable onPress={handleExport} style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.primaryDim }]}>
              <Download size={18} color={theme.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Export Data</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Share or backup your habits in JSON format
              </Text>
            </View>
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          <Pressable onPress={() => seedSampleData()} style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.accentDim }]}>
              <Sparkles size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Load Sample Habits</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Add sample fitness, health and productivity habits
              </Text>
            </View>
          </Pressable>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          <Pressable onPress={() => setShowResetConfirm(true)} style={styles.settingItem}>
            <View style={[styles.settingIconWrap, { backgroundColor: theme.errorDim }]}>
              <Trash2 size={18} color={theme.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: theme.error }]}>Reset All Data</Text>
              <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                Erase local AsyncStorage habits and completions
              </Text>
            </View>
          </Pressable>
        </Card>

        {/* App Info Footer */}
        <View style={styles.appFooter}>
          <Text style={[styles.appName, { color: theme.textMuted }]}>
            HabitFlow · Production Android Build v1.0.0
          </Text>
          <Text style={[styles.appSub, { color: theme.textMuted }]}>
            Engineered with React Native & Expo Router
          </Text>
        </View>
      </ScrollView>

      {/* Edit Personal Details Modal */}
      <ModalSheet
        visible={editingProfile}
        onClose={() => setEditingProfile(false)}
        title="Personal Details"
        maxHeight={88}
      >
        <View style={{ gap: spacing.md, paddingBottom: 16 }}>
          {/* First Name */}
          <View style={styles.profileEditGroup}>
            <Text style={[styles.profileEditLabel, { color: theme.text }]}>
              First Name *
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Dharaneesh"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.nameInputBox,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>

          {/* Nickname */}
          <View style={styles.profileEditGroup}>
            <Text style={[styles.profileEditLabel, { color: theme.textSecondary }]}>
              Nickname (Optional)
            </Text>
            <TextInput
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder="e.g. Dharan"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.nameInputBox,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
          </View>

          {/* Daily Wake-up Time */}
          <View style={styles.profileEditGroup}>
            <Text style={[styles.profileEditLabel, { color: theme.textSecondary }]}>
              Daily Wake-up Time (Optional)
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable
                onPress={() => setClockTarget('wakeup')}
                style={[
                  styles.profileTimeCard,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: hasWakeUp ? theme.primary : theme.border,
                    flex: 1,
                  },
                ]}
              >
                <Sunrise size={18} color={hasWakeUp ? '#FFA07A' : theme.textMuted} />
                <Text
                  style={[
                    styles.profileTimeText,
                    {
                      color: hasWakeUp ? theme.text : theme.textMuted,
                      fontFamily: hasWakeUp ? 'Inter-Bold' : 'Inter-Regular',
                    },
                  ]}
                >
                  {hasWakeUp ? format12Hour(wakeUpInput) : 'Set wake-up time'}
                </Text>
                <Clock
                  size={15}
                  color={theme.primaryLight}
                  style={{ marginLeft: 'auto' }}
                />
              </Pressable>
              {hasWakeUp && (
                <Pressable
                  onPress={() => setHasWakeUp(false)}
                  style={[styles.clearTimeBtn, { backgroundColor: theme.surfaceAlt }]}
                  hitSlop={8}
                >
                  <X size={16} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Preferred Bedtime */}
          <View style={styles.profileEditGroup}>
            <Text style={[styles.profileEditLabel, { color: theme.textSecondary }]}>
              Preferred Bedtime (Optional)
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable
                onPress={() => setClockTarget('bedtime')}
                style={[
                  styles.profileTimeCard,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: hasBedTime ? theme.primary : theme.border,
                    flex: 1,
                  },
                ]}
              >
                <Moon size={18} color={hasBedTime ? '#8B5CF6' : theme.textMuted} />
                <Text
                  style={[
                    styles.profileTimeText,
                    {
                      color: hasBedTime ? theme.text : theme.textMuted,
                      fontFamily: hasBedTime ? 'Inter-Bold' : 'Inter-Regular',
                    },
                  ]}
                >
                  {hasBedTime ? format12Hour(bedTimeInput) : 'Set bedtime'}
                </Text>
                <Clock
                  size={15}
                  color={theme.primaryLight}
                  style={{ marginLeft: 'auto' }}
                />
              </Pressable>
              {hasBedTime && (
                <Pressable
                  onPress={() => setHasBedTime(false)}
                  style={[styles.clearTimeBtn, { backgroundColor: theme.surfaceAlt }]}
                  hitSlop={8}
                >
                  <X size={16} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <Button
            title="Save Details"
            variant="primary"
            size="lg"
            onPress={handleSaveProfile}
            style={{ marginTop: spacing.xs }}
          />
        </View>
      </ModalSheet>

      {/* Clock Dialer for Profile Times */}
      {clockTarget !== null && (
        <ClockTimePickerModal
          visible={clockTarget !== null}
          initialTime={clockTarget === 'wakeup' ? wakeUpInput : bedTimeInput}
          title={
            clockTarget === 'wakeup'
              ? 'Select Daily Wake-up Time'
              : 'Select Preferred Bedtime'
          }
          onConfirm={handleClockConfirm}
          onClose={() => setClockTarget(null)}
        />
      )}

      {/* Confirm Reset Modal */}
      <ModalSheet visible={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Confirm Reset">
        <View style={{ gap: spacing.md }}>
          <View style={[styles.warningBox, { backgroundColor: theme.errorDim, borderColor: theme.error }]}>
            <ShieldAlert size={22} color={theme.error} />
            <Text style={[styles.warningText, { color: theme.error }]}>
              This will permanently delete all your habit data, completion history, and streak records.
            </Text>
          </View>

          <Button
            title="Yes, Reset Everything"
            variant="danger"
            onPress={async () => {
              await resetAllData();
              setShowResetConfirm(false);
            }}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => setShowResetConfirm(false)}
          />
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
    paddingTop: spacing.md,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userNameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: 6,
  },
  levelPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  xpWrap: {
    width: '80%',
    marginTop: 10,
    marginBottom: 8,
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  sectionHeading: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: spacing.xs,
  },
  achievementRatio: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    marginLeft: 60,
  },
  weekPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  weekPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
  },
  achievementCard: {
    width: 145,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: 6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  achDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  achStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  achStatusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
  },
  nameInputBox: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  nicknameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  nicknameBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
  },
  routinePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  profileRoutinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  profileRoutineText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  profileEditGroup: {
    gap: 6,
  },
  profileEditLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    fontWeight: '600',
  },
  profileTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  profileTimeText: {
    fontSize: 14,
  },
  clearTimeBtn: {
    width: 44,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 2,
  },
  appName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  appSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
});
