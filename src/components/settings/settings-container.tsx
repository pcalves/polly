interface SettingsContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsContainer({
  children,
  className = "",
}: SettingsContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-6 py-8 w-full flex-1 ${className}`}>
      {children}
    </div>
  );
}
