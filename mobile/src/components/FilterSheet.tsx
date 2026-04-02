import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import { JobFilters, Emirate, WorkMode, EmploymentType } from '../types';
import { COLORS, EMIRATE_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from '../constants';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: JobFilters;
  onApply: (filters: JobFilters) => void;
}

export function FilterSheet({ visible, onClose, filters, onApply }: FilterSheetProps) {
  const [local, setLocal] = useState<JobFilters>(filters);

  const toggle = <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    setLocal((prev) => ({ ...prev, [key]: prev[key] === value ? undefined : value }));
  };

  const reset = () => setLocal({});

  const apply = () => {
    onApply(local);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Emirate */}
          <FilterSection title="Location (Emirate)">
            {(Object.entries(EMIRATE_LABELS) as [Emirate, string][]).map(([code, label]) => (
              <Chip
                key={code}
                label={label}
                active={local.emirate === code}
                onPress={() => toggle('emirate', code)}
              />
            ))}
          </FilterSection>

          {/* Work Mode */}
          <FilterSection title="Work Mode">
            {(Object.entries(WORK_MODE_LABELS) as [WorkMode, string][]).map(([code, label]) => (
              <Chip
                key={code}
                label={label}
                active={local.workMode === code}
                onPress={() => toggle('workMode', code)}
              />
            ))}
          </FilterSection>

          {/* Employment Type */}
          <FilterSection title="Job Type">
            {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([code, label]) => (
              <Chip
                key={code}
                label={label}
                active={local.employmentType === code}
                onPress={() => toggle('employmentType', code)}
              />
            ))}
          </FilterSection>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={apply} fullWidth>Apply Filters</Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: COLORS.gray[100],
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.gray[900] },
  resetText: { fontSize: 14, color: COLORS.brand[600], fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { paddingVertical: 20, borderBottomWidth: 1, borderColor: COLORS.gray[100] },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray[700], marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: COLORS.gray[200], backgroundColor: COLORS.gray[50],
  },
  chipActive: { borderColor: COLORS.brand[600], backgroundColor: COLORS.brand[50] },
  chipText: { fontSize: 13, color: COLORS.gray[600], fontWeight: '500' },
  chipTextActive: { color: COLORS.brand[600], fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1, borderColor: COLORS.gray[100] },
});
