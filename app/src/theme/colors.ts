export const colors = {
  primary: "#7C3AED", // violeta
  accent: "#FF6B6B", // coral
  background: "#FFFBF5", // crema cálido
  surface: "#FFFFFF",
  textPrimary: "#292524",
  textSecondary: "#78716C",
  completed: "#A8A29E",
  success: "#22C55E",
  error: "#EF4444",
} as const;

export const typography = {
  taskTitle: {
    fontWeight: "700" as const,
    fontSize: 17,
  },
  body: {
    fontWeight: "400" as const,
    fontSize: 14,
  },
  label: {
    fontWeight: "400" as const,
    fontSize: 12,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const shadow = {
  card: {
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
};
