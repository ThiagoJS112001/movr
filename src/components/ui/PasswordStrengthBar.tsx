interface Props {
  password: string;
}

export default function PasswordStrengthBar({ password }: Props) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const colors = ['', 'bg-red-500', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];

  if (!password) return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-slate-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <span className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</span>
      )}
    </div>
  );
}
