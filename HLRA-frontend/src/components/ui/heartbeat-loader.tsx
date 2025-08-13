import { cn } from '../../lib/utils';

interface HeartbeatLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  background?: 'black' | 'white' | 'transparent';
  showFullscreen?: boolean;
}

export function HeartbeatLoader({ 
  className, 
  size = 'md', 
  background = 'transparent',
  showFullscreen = false
}: HeartbeatLoaderProps) {
  const svgSizes = {
    sm: { width: 200, height: 60 },
    md: { width: 300, height: 100 },
    lg: { width: 400, height: 120 }
  };

  const backgroundClasses = {
    black: 'bg-black',
    white: 'bg-white',
    transparent: 'bg-transparent'
  };

  const containerClass = showFullscreen 
    ? "flex items-center justify-center h-screen"
    : "flex items-center justify-center";

  const { width, height } = svgSizes[size];

  return (
    <div className={cn(
      containerClass,
      backgroundClasses[background],
      className
    )}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ECG waveform path */}
        <path
          d={`M 0 ${height/2} 
             L ${width * 0.17} ${height/2} 
             L ${width * 0.20} ${height * 0.20} 
             L ${width * 0.22} ${height * 0.80} 
             L ${width * 0.23} ${height/2} 
             L ${width * 0.40} ${height/2} 
             L ${width * 0.43} ${height * 0.30} 
             L ${width * 0.45} ${height/2} 
             L ${width * 0.67} ${height/2} 
             L ${width * 0.70} ${height * 0.10} 
             L ${width * 0.72} ${height * 0.90} 
             L ${width * 0.73} ${height/2} 
             L ${width} ${height/2}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        >
          <animate
            attributeName="stroke-dasharray"
            from="0,1000"
            to="1000,0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* Moving glow effect */}
        <path
          d={`M 0 ${height/2} 
             L ${width * 0.17} ${height/2} 
             L ${width * 0.20} ${height * 0.20} 
             L ${width * 0.22} ${height * 0.80} 
             L ${width * 0.23} ${height/2} 
             L ${width * 0.40} ${height/2} 
             L ${width * 0.43} ${height * 0.30} 
             L ${width * 0.45} ${height/2} 
             L ${width * 0.67} ${height/2} 
             L ${width * 0.70} ${height * 0.10} 
             L ${width * 0.72} ${height * 0.90} 
             L ${width * 0.73} ${height/2} 
             L ${width} ${height/2}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          opacity="0.4"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-1000"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  );
}