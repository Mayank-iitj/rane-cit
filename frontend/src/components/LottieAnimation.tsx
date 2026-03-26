import { useEffect, useState } from 'react'

interface LottieComponentProps {
  animationData: any
  loop?: boolean
  autoplay?: boolean
  style?: React.CSSProperties
  className?: string
}

export default function LottieComponent({
  animationData,
  loop = true,
  autoplay = true,
  style,
  className = '',
}: LottieComponentProps) {
  const [animationInstance, setAnimationInstance] = useState<any>(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Dynamically import lottie-web to avoid SSR issues
    import('lottie-web').then((lottie) => {
      if (containerRef.current) {
        const instance = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          animationData,
        })
        setAnimationInstance(instance)

        return () => {
          instance.destroy()
        }
      }
    })
  }, [animationData, loop, autoplay])

  return <div ref={containerRef} className={className} style={style} />
}

import { useRef } from 'react'
