import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Clock, Check, X } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, spacing } from '@/theme/tokens';

export interface ClockTimePickerModalProps {
  visible: boolean;
  initialTime?: string; // 24-hour format "HH:mm"
  title?: string;
  onConfirm: (time24: string) => void;
  onClose: () => void;
}

export function format12Hour(time24?: string): string {
  if (!time24 || !time24.includes(':')) return '08:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '08:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const padH = String(h).padStart(2, '0');
  const padM = String(m).padStart(2, '0');
  return `${padH}:${padM} ${period}`;
}

export function parse24HourTo12(time24?: string): {
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
} {
  if (!time24 || !time24.includes(':')) {
    return { hour12: 8, minute: 0, period: 'AM' };
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h) || h < 0 || h > 23) h = 8;
  if (isNaN(m) || m < 0 || m > 59) m = 0;
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, period };
}

export function to24HourString(
  hour12: number,
  minute: number,
  period: 'AM' | 'PM'
): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  const hh = String(h24).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

const DIAL_SIZE = 256;
const DIAL_RADIUS = DIAL_SIZE / 2; // 128
const TRACK_RADIUS = 96; // Distance from center to numbers
const SELECTOR_RADIUS = 18;

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_5 = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function ClockTimePickerModal(props: ClockTimePickerModalProps) {
  if (!props.visible) return null;
  return <ClockTimePickerContent {...props} />;
}

function ClockTimePickerContent({
  visible,
  initialTime = '08:00',
  title = 'Select Reminder Time',
  onConfirm,
  onClose,
}: ClockTimePickerModalProps) {
  const { theme } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  const parsed = parse24HourTo12(initialTime);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(parsed.period);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleTouch = (x: number, y: number, isRelease: boolean) => {
    const dx = x - DIAL_RADIUS;
    const dy = y - DIAL_RADIUS;
    const rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI;
    let clockDeg = deg + 90;
    if (clockDeg < 0) clockDeg += 360;

    if (mode === 'hours') {
      let h = Math.round(clockDeg / 30);
      if (h === 0) h = 12;
      if (h > 12) h = 12;
      if (h !== selectedHour) {
        setSelectedHour(h);
        triggerHaptic();
      }
      if (isRelease) {
        setTimeout(() => {
          setMode('minutes');
        }, 150);
      }
    } else {
      let m = Math.round(clockDeg / 6) % 60;
      if (m !== selectedMinute) {
        setSelectedMinute(m);
        triggerHaptic();
      }
    }
  };

  const handAngle = useMemo(() => {
    if (mode === 'hours') {
      const h = selectedHour % 12;
      return (h * 30 - 90) * (Math.PI / 180);
    } else {
      return (selectedMinute * 6 - 90) * (Math.PI / 180);
    }
  }, [mode, selectedHour, selectedMinute]);

  const handX = DIAL_RADIUS + TRACK_RADIUS * Math.cos(handAngle);
  const handY = DIAL_RADIUS + TRACK_RADIUS * Math.sin(handAngle);

  const handleConfirm = () => {
    const time24 = to24HourString(selectedHour, selectedMinute, selectedPeriod);
    onConfirm(time24);
  };

  const formattedHour = String(selectedHour).padStart(2, '0');
  const formattedMinute = String(selectedMinute).padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.surface,
              borderColor: theme.cardBorderHighlight,
              maxWidth: Math.min(windowWidth - 32, 380),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Clock size={18} color={theme.primaryLight} />
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {mode === 'hours'
                ? 'Select hour by tapping or dragging'
                : 'Select minute by tapping or dragging'}
            </Text>
          </View>

          {/* Large Digital Time Header with AM/PM toggle */}
          <View
            style={[
              styles.timeDisplayCard,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.digitsRow}>
              {/* Hour Digit Box */}
              <Pressable
                onPress={() => setMode('hours')}
                style={[
                  styles.digitBox,
                  mode === 'hours' && {
                    backgroundColor: theme.primaryDim,
                    borderColor: theme.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set hour"
              >
                <Text
                  style={[
                    styles.digitText,
                    {
                      color: mode === 'hours' ? theme.primaryLight : theme.textSecondary,
                    },
                  ]}
                >
                  {formattedHour}
                </Text>
              </Pressable>

              <Text style={[styles.colonText, { color: theme.textSecondary }]}>:</Text>

              {/* Minute Digit Box */}
              <Pressable
                onPress={() => setMode('minutes')}
                style={[
                  styles.digitBox,
                  mode === 'minutes' && {
                    backgroundColor: theme.primaryDim,
                    borderColor: theme.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set minute"
              >
                <Text
                  style={[
                    styles.digitText,
                    {
                      color: mode === 'minutes' ? theme.primaryLight : theme.textSecondary,
                    },
                  ]}
                >
                  {formattedMinute}
                </Text>
              </Pressable>
            </View>

            {/* AM / PM Toggle Column */}
            <View style={[styles.periodCol, { borderColor: theme.border }]}>
              <Pressable
                onPress={() => {
                  setSelectedPeriod('AM');
                  triggerHaptic();
                }}
                style={[
                  styles.periodBtn,
                  selectedPeriod === 'AM' && {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: selectedPeriod === 'AM' ? '#FFFFFF' : theme.textSecondary,
                      fontFamily:
                        selectedPeriod === 'AM' ? 'Inter-Bold' : 'Inter-Medium',
                    },
                  ]}
                >
                  AM
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setSelectedPeriod('PM');
                  triggerHaptic();
                }}
                style={[
                  styles.periodBtn,
                  selectedPeriod === 'PM' && {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    {
                      color: selectedPeriod === 'PM' ? '#FFFFFF' : theme.textSecondary,
                      fontFamily:
                        selectedPeriod === 'PM' ? 'Inter-Bold' : 'Inter-Medium',
                    },
                  ]}
                >
                  PM
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Mode switch tabs */}
          <View style={[styles.modeTabsRow, { backgroundColor: theme.surfaceAlt }]}>
            <Pressable
              onPress={() => setMode('hours')}
              style={[
                styles.modeTab,
                mode === 'hours' && {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'hours' ? '#FFFFFF' : theme.textSecondary,
                  },
                ]}
              >
                Hour ({selectedHour})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('minutes')}
              style={[
                styles.modeTab,
                mode === 'minutes' && {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'minutes' ? '#FFFFFF' : theme.textSecondary,
                  },
                ]}
              >
                Minute ({formattedMinute})
              </Text>
            </Pressable>
          </View>

          {/* Circular Analogue Clock Dial */}
          <View style={styles.dialWrapper}>
            <View
              style={[
                styles.dialFace,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.cardBorder,
                },
              ]}
              onTouchStart={(e) => {
                handleTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, false);
              }}
              onTouchMove={(e) => {
                handleTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, false);
              }}
              onTouchEnd={(e) => {
                handleTouch(e.nativeEvent.locationX, e.nativeEvent.locationY, true);
              }}
            >
              {/* SVG Clock Hand & Indicator */}
              <Svg
                width={DIAL_SIZE}
                height={DIAL_SIZE}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {/* Center Pivot */}
                <Circle cx={DIAL_RADIUS} cy={DIAL_RADIUS} r={5} fill={theme.primary} />

                {/* Hand Line */}
                <Line
                  x1={DIAL_RADIUS}
                  y1={DIAL_RADIUS}
                  x2={handX}
                  y2={handY}
                  stroke={theme.primary}
                  strokeWidth={2.5}
                />

                {/* Selected Indicator Circle */}
                <Circle
                  cx={handX}
                  cy={handY}
                  r={SELECTOR_RADIUS}
                  fill={theme.primary}
                />

                {/* Small Center Dot inside Selector */}
                <Circle cx={handX} cy={handY} r={3} fill="#FFFFFF" />
              </Svg>

              {/* Clock Face Numbers */}
              {mode === 'hours'
                ? HOURS_12.map((h) => {
                    const angle = (h * 30 - 90) * (Math.PI / 180);
                    const nx = DIAL_RADIUS + TRACK_RADIUS * Math.cos(angle);
                    const ny = DIAL_RADIUS + TRACK_RADIUS * Math.sin(angle);
                    const isSelected = selectedHour === h;

                    return (
                      <View
                        key={`hour-${h}`}
                        style={[
                          styles.numberPositioner,
                          {
                            left: nx - 16,
                            top: ny - 16,
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <Text
                          style={[
                            styles.clockNumberText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontFamily: isSelected ? 'Inter-Bold' : 'Inter-Medium',
                            },
                          ]}
                        >
                          {h}
                        </Text>
                      </View>
                    );
                  })
                : MINUTES_5.map((m) => {
                    const angle = (m * 6 - 90) * (Math.PI / 180);
                    const nx = DIAL_RADIUS + TRACK_RADIUS * Math.cos(angle);
                    const ny = DIAL_RADIUS + TRACK_RADIUS * Math.sin(angle);
                    const isSelected = selectedMinute === m;

                    return (
                      <View
                        key={`minute-${m}`}
                        style={[
                          styles.numberPositioner,
                          {
                            left: nx - 16,
                            top: ny - 16,
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <Text
                          style={[
                            styles.clockNumberText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.text,
                              fontFamily: isSelected ? 'Inter-Bold' : 'Inter-Medium',
                              fontSize: 13,
                            },
                          ]}
                        >
                          {String(m).padStart(2, '0')}
                        </Text>
                      </View>
                    );
                  })}
            </View>
          </View>

          {/* Quick Minute Shortcut Pills */}
          <View style={styles.quickMinuteRow}>
            {[0, 15, 30, 45].map((mVal) => (
              <Pressable
                key={`quick-${mVal}`}
                onPress={() => {
                  setSelectedMinute(mVal);
                  setMode('minutes');
                  triggerHaptic();
                }}
                style={[
                  styles.quickPill,
                  {
                    backgroundColor:
                      selectedMinute === mVal ? theme.primaryDim : theme.surfaceAlt,
                    borderColor:
                      selectedMinute === mVal ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickPillText,
                    {
                      color:
                        selectedMinute === mVal ? theme.primaryLight : theme.textSecondary,
                    },
                  ]}
                >
                  :{String(mVal).padStart(2, '0')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Actions: Cancel & Confirm */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                styles.cancelBtn,
                { borderColor: theme.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <X size={16} color={theme.textSecondary} />
              <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={[
                styles.actionBtn,
                styles.confirmBtn,
                { backgroundColor: theme.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Confirm time"
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    width: '100%',
    borderRadius: radius.sheet,
    borderWidth: 1.5,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  timeDisplayCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  digitBox: {
    minWidth: 64,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  colonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 30,
    fontWeight: '700',
  },
  periodCol: {
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  periodBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modeTabsRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialFace: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  numberPositioner: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumberText: {
    fontSize: 14,
    textAlign: 'center',
  },
  quickMinuteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  quickPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  quickPillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.sm,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    elevation: 4,
  },
  actionBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
});
