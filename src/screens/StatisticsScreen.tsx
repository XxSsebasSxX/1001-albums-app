import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { useAlbums } from '../hooks/useAlbums';

const SCREEN_WIDTH = Dimensions.get('window').width - 32;

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function StatisticsScreen() {
  const { statsData } = useAlbums();

  if (!statsData) return null;

  const { total, avgRating, decadeLabels, decadeData, genreChartData, topGenres3, topArtists5 } = statsData;

  const barChartData = {
    labels: decadeLabels,
    datasets: [{ data: decadeData }],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: '#1A2A3A',
    decimalCount: 0,
    color: (opacity = 1) => `rgba(100, 200, 255, ${opacity})`,
    labelColor: () => '#AAAAAA',
    style: { borderRadius: 12 },
    propsForBackgroundLines: { strokeDasharray: '', stroke: '#333' },
    barPercentage: 0.6,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Mis Estadísticas</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Progreso</Text>
          <Text style={styles.summaryNumber}>{total} / 1001</Text>
          <ProgressBar value={total} max={1001} color={colors.primary} />
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Nota Media</Text>
          <Text style={styles.summaryNumber}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </Text>
          {avgRating > 0 && (
            <Text style={styles.summaryStar}>
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Décadas</Text>
        {decadeLabels.length > 0 ? (
          <BarChart
            data={barChartData}
            width={SCREEN_WIDTH}
            height={220}
            chartConfig={chartConfig}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>Aún no hay datos</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Géneros</Text>
        {genreChartData.length > 0 ? (
          <PieChart
            data={genreChartData}
            width={SCREEN_WIDTH}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.emptyText}>Aún no hay datos</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Favoritos</Text>

        <Text style={styles.subsectionTitle}>Top 5 Artistas</Text>
        {topArtists5.length > 0 ? (
          topArtists5.map(([artist, count], i) => (
            <View key={artist} style={styles.rankRow}>
              <Text style={styles.rankNumber}>#{i + 1}</Text>
              <Text style={styles.rankName} numberOfLines={1}>{artist}</Text>
              <Text style={styles.rankCount}>{count} discos</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aún no hay datos</Text>
        )}

        <Text style={[styles.subsectionTitle, { marginTop: 16 }]}>Top 3 Géneros</Text>
        {topGenres3.length > 0 ? (
          topGenres3.map(([genre, count], i) => (
            <View key={genre} style={styles.rankRow}>
              <Text style={styles.rankNumber}>#{i + 1}</Text>
              <Text style={styles.rankName} numberOfLines={1}>{genre}</Text>
              <Text style={styles.rankCount}>{count} discos</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aún no hay datos</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  summaryStar: {
    fontSize: 14,
    color: colors.primary,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    width: 28,
  },
  rankName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  rankCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
