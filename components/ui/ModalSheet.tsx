import React from 'react';
import { Modal, View, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '@/theme/ThemeContext';

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
}

export function ModalSheet({ visible, onClose, title, children, maxHeight = 85 }: ModalSheetProps) {
  const { theme } = useAppTheme();
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              maxHeight: screenHeight * (maxHeight / 100),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          {title && (
            <View style={styles.header}>
              <View style={styles.titlePlaceholder} />
              <View style={styles.titleWrap}>
                <ModalText theme={theme}>{title}</ModalText>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <X size={22} color={theme.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ModalText({ theme, children }: { theme: any; children: React.ReactNode }) {
  return (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>{children}</Text>
    </View>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
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
  titlePlaceholder: { width: 28 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    alignItems: 'center',
  },
});
