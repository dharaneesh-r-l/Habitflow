import React, { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react-native';

type IconMap = Record<string, ComponentType<any>>;

const iconMap: IconMap = (LucideIcons as any) as IconMap;

const FallbackIcon: ComponentType<any> = (props) => {
  const CircleIcon = iconMap['Circle'];
  return CircleIcon ? React.createElement(CircleIcon, props) : null;
};

export function getIcon(name: string): ComponentType<any> {
  if (!name) return FallbackIcon;
  const cleaned = name.replace(/Icon$/, '');
  return iconMap[cleaned] || FallbackIcon;
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
