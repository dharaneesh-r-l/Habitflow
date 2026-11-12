import { ViewStyle } from 'react-native';

export function pressedOpacity(pressed: boolean, base: ViewStyle | ViewStyle[]): ViewStyle {
  return { opacity: pressed ? 0.85 : 1, ...(Array.isArray(base) ? Object.assign({}, ...base) : base) };
}
