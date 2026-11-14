import React from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView, Text, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/tokens';

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
}

export function ModalSheet({ visible, onClose, title, children, maxHeight = 85 }: ModalSheetProps) {
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                maxHeight: height * (maxHeight / 100),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            {title && (
              <View style={styles.header}>
                <View style={styles.titlePlaceholder} />
                <View style={styles.titleWrap}>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                  <X size={22} color={theme.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>
            )}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {children}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 8,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  titlePlaceholder: { width: 36 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
