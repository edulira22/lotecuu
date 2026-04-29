interface AdminFieldProps {
  label: string
  error?: string
  children: React.ReactNode
}

export function AdminField({ label, error, children }: AdminFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-text-muted uppercase tracking-[0.1em] font-[500]">
        {label}
      </span>
      {children}
      {error && <span className="text-[12px] text-red-500">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full px-3 py-2.5 rounded-[8px] text-[14px] bg-white outline-none font-[inherit] transition-colors'

export const inputStyle = {
  border: '0.5px solid var(--gray-line-strong)',
  color: 'var(--color-text-base)',
}
