import { useState, useEffect } from 'react'
import { 
  User, 
  Lock, 
  Globe, 
  LogOut, 
  Check
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nContext'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Avatar } from '@/components/ui/Avatar'

export default function AdminSettings() {
  const { profile, updateProfile, updatePassword, signOut } = useAuth()
  const { t } = useI18n()

  // Profile details state
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState('')
  const [passError, setPassError] = useState('')

  // Initialize profile values
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl || null,
      })
      setProfileSuccess(t.admin.profileSaved)
    } catch (err: any) {
      setProfileError(err.message || t.common.error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError('')
    setPassSuccess('')

    if (newPassword.length < 12) {
      setPassError(t.admin.newPassword) // password needs min 12 characters
      return
    }

    if (newPassword !== confirmPassword) {
      setPassError(t.admin.passwordMismatch)
      return
    }

    setPassLoading(true)

    try {
      await updatePassword(newPassword)
      setPassSuccess(t.admin.passwordChanged)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPassError(err.message || t.common.error)
    } finally {
      setPassLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/admin/login'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="space-y-8 max-w-[1000px] mx-auto">
      {/* ── PROFILE INFORMATION ────────────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600">
            <User size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {t.admin.profileSection}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Admin profil məlumatlarınızı buradan yeniləyin.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-6">
          {profileError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2">
              <Check size={16} className="text-green-600 stroke-[2.5]" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left big Avatar preview */}
            <div className="flex flex-col items-center gap-2 self-center md:self-start bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex-shrink-0 w-32">
              <Avatar name={fullName || 'Admin'} url={avatarUrl} size="lg" />
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider bg-orange-100 border border-orange-200/50 px-2 py-0.5 rounded-md mt-1">
                Süper Admin
              </span>
            </div>

            {/* Right Form fields */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    {t.admin.colName}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-semibold"
                  />
                </div>

                {/* Email Address (Readonly) */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    {t.admin.colEmail}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ''}
                    className="block w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-slate-400 font-semibold sm:text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                  Avatar şəklinin linki (URL)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-medium"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {profileLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} className="stroke-[2.5]" />
                  <span>Yadda saxla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── CHANGE PASSWORD ────────────────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600">
            <Lock size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {t.admin.passwordSection}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Şifrənizi təhlükəsizlik qaydalarına uyğun olaraq yeniləyin.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {passError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 flex items-center gap-2">
              <Check size={16} className="text-green-600 stroke-[2.5]" />
              <span>{passSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.newPassword}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-medium"
                placeholder="Minimum 12 simvol"
              />
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                {t.admin.confirmPassword}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-3.5 py-3 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm font-medium"
                placeholder="Şifrəni təkrarlayın"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={passLoading}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {passLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  <span>Şifrəni dəyiş</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── SESSION & INTERFACE DETAILS ────────────────────────── */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600">
            <Globe size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              Sessiya və Dil Seçimləri
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Admin panel dili və fəaliyyətdə olan cari sessiya tənzimləmələri.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language selector */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-36">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Interface Dili</h4>
              <p className="text-xs text-slate-400 font-semibold">
                Yalnız admin paneli üçün deyil, bütün tətbiq dilini buradan tənzimləyə bilərsiniz.
              </p>
            </div>
            <div className="self-start">
              <LanguageSwitcher variant="dark" size="sm" />
            </div>
          </div>

          {/* Active session information */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between h-36">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Aktiv Sessiya</h4>
              <p className="text-xs text-slate-400 font-semibold">
                Cari brauzer üzərindəki admin sessiyasını sonlandıraraq təhlükəsiz çıxış edə bilərsiniz.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-xs font-bold transition-all self-start"
            >
              <LogOut size={13} className="stroke-[2.5]" />
              <span>Brauzerdən çıxış et</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
