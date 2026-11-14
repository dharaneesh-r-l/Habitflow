import React, { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react-native';

type IconMap = Record<string, ComponentType<any>>;

const iconMap: IconMap = (LucideIcons as any) as IconMap;

export function getIcon(name: string): ComponentType<any> {
  const cleaned = name.replace(/Icon$/, '');
  return iconMap[cleaned] || iconMap['Circle'];
}

export const Icon = ({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) => {
  const Component = getIcon(name);
  return React.createElement(Component, { size, color, strokeWidth });
};
