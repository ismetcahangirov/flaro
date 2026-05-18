interface AvatarProps {
  name: string
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const initials = name.charAt(0).toUpperCase()
  
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  }

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-100 flex-shrink-0`}
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold uppercase tracking-wider shadow-sm flex-shrink-0`}>
      {initials}
    </div>
  )
}
