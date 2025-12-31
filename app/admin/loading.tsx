import Image from "next/image"
import Logo from '@/app/favicon.ico'

export default function Loading() {
  return (
    <div className="grid justify-items-center animate-pulse sm:p-60 p-40">
    <Image
    alt="logo"
    src={Logo}
    width={80}
    height={80}
    unoptimized
    />
    </div>
  )
}