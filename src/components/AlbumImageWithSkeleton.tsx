import { useState, useEffect } from 'react';
import { View, Image, type ImageProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AlbumImageWithSkeletonProps extends ImageProps {
  size: number;
}

export default function AlbumImageWithSkeleton({
  size,
  style,
  onLoadStart,
  onLoadEnd,
  ...imageProps
}: AlbumImageWithSkeletonProps) {
  const [loading, setLoading] = useState(true);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      {loading && (
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: 8,
              backgroundColor: '#2A2A2A',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            },
            animatedStyle,
          ]}
        />
      )}
      <Image
        {...imageProps}
        style={[{ width: size, height: size, borderRadius: 8 }, style]}
        onLoadStart={() => { setLoading(true); onLoadStart?.(); }}
        onLoadEnd={() => { setLoading(false); onLoadEnd?.(); }}
      />
    </View>
  );
}
