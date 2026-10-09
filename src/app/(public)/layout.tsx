import { SplashIntro } from '@/components/ui/splash-intro'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashIntro />
      {children}
    </>
  )
}
