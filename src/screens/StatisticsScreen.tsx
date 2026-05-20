import { ScrollView, Dimensions, View } from 'react-native';
import { YStack, XStack, Card, SizableText } from 'tamagui';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useAlbums } from '../hooks/useAlbums';

const SCREEN_WIDTH = Dimensions.get('window').width - 32;

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: '#333', overflow: 'hidden' }}>
      <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(pct * 100, 100)}%`, backgroundColor: color }} />
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
    backgroundColor: '#1E1E1E',
    backgroundGradientFrom: '#1E1E1E',
    backgroundGradientTo: '#1E1E1E',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 12 },
    propsForBackgroundLines: { strokeDasharray: '', stroke: '#333' },
    barPercentage: 0.6,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#121212' }} contentContainerStyle={{ paddingBottom: 40 }}>
      <SizableText fontSize={28} fontWeight="bold" color="$color" paddingHorizontal={16} paddingTop={16} paddingBottom={12}>
        Mis Estadísticas
      </SizableText>

      <XStack gap={12} paddingHorizontal={16} marginBottom={16}>
        <Card flex={1} backgroundColor="$brandSurface" borderRadius={12} padding={16} borderWidth={1} borderColor="$brandGray">
          <SizableText fontSize={12} color="$colorHover" marginBottom={4} fontWeight="600">Progreso</SizableText>
          <SizableText fontSize={24} fontWeight="bold" color="$color" marginBottom={4}>{total} / 1001</SizableText>
          <ProgressBar value={total} max={1001} color="#F5A623" />
        </Card>
        <Card flex={1} backgroundColor="$brandSurface" borderRadius={12} padding={16} borderWidth={1} borderColor="$brandGray">
          <SizableText fontSize={12} color="$colorHover" marginBottom={4} fontWeight="600">Nota Media</SizableText>
          <SizableText fontSize={24} fontWeight="bold" color="$color" marginBottom={4}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </SizableText>
          {avgRating > 0 && (
            <SizableText fontSize={14} color="$brandGold">
              {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
            </SizableText>
          )}
        </Card>
      </XStack>

      <Card marginHorizontal={16} marginBottom={20} backgroundColor="$brandSurface" borderRadius={12} padding={16} borderWidth={1} borderColor="$brandGray">
        <SizableText fontSize={18} fontWeight="bold" color="$color" marginBottom={12}>Décadas</SizableText>
        {decadeLabels.length > 0 ? (
          <BarChart
            data={barChartData}
            width={SCREEN_WIDTH}
            height={220}
            chartConfig={chartConfig}
            fromZero
            yAxisLabel=""
            yAxisSuffix=""
            style={{ borderRadius: 12 }}
          />
        ) : (
          <SizableText color="$colorHover" fontSize={14} textAlign="center" paddingVertical={20}>Aún no hay datos</SizableText>
        )}
      </Card>

      <Card marginHorizontal={16} marginBottom={20} backgroundColor="$brandSurface" borderRadius={12} padding={16} borderWidth={1} borderColor="$brandGray">
        <SizableText fontSize={18} fontWeight="bold" color="$color" marginBottom={12}>Géneros</SizableText>
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
          <SizableText color="$colorHover" fontSize={14} textAlign="center" paddingVertical={20}>Aún no hay datos</SizableText>
        )}
      </Card>

      <Card marginHorizontal={16} marginBottom={20} backgroundColor="$brandSurface" borderRadius={12} padding={16} borderWidth={1} borderColor="$brandGray">
        <SizableText fontSize={18} fontWeight="bold" color="$color" marginBottom={12}>Mis Favoritos</SizableText>

        <SizableText fontSize={14} fontWeight="600" color="$colorHover" marginBottom={8}>Top 5 Artistas</SizableText>
        {topArtists5.length > 0 ? (
          topArtists5.map(([artist, count], i) => (
            <XStack key={artist} alignItems="center" paddingVertical={8} borderBottomWidth={1} borderBottomColor="$brandGray">
              <SizableText fontSize={14} fontWeight="bold" color="$brandGold" width={28}>#{i + 1}</SizableText>
              <SizableText flex={1} fontSize={14} color="$color" numberOfLines={1}>{artist}</SizableText>
              <SizableText fontSize={12} color="$colorHover" marginLeft={8}>{count} discos</SizableText>
            </XStack>
          ))
        ) : (
          <SizableText color="$colorHover" fontSize={14} textAlign="center" paddingVertical={20}>Aún no hay datos</SizableText>
        )}

        <SizableText fontSize={14} fontWeight="600" color="$colorHover" marginBottom={8} marginTop={16}>Top 3 Géneros</SizableText>
        {topGenres3.length > 0 ? (
          topGenres3.map(([genre, count], i) => (
            <XStack key={genre} alignItems="center" paddingVertical={8} borderBottomWidth={1} borderBottomColor="$brandGray">
              <SizableText fontSize={14} fontWeight="bold" color="$brandGold" width={28}>#{i + 1}</SizableText>
              <SizableText flex={1} fontSize={14} color="$color" numberOfLines={1}>{genre}</SizableText>
              <SizableText fontSize={12} color="$colorHover" marginLeft={8}>{count} discos</SizableText>
            </XStack>
          ))
        ) : (
          <SizableText color="$colorHover" fontSize={14} textAlign="center" paddingVertical={20}>Aún no hay datos</SizableText>
        )}
      </Card>
    </ScrollView>
  );
}
