'use client'

export default function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Orb 1 - Cyan */}
      <div
        className="absolute animate-float-slow"
        style={{
          width: '600px',
          height: '600px',
          top: '10%',
          left: '20%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.15,
        }}
      />

      {/* Orb 2 - Purple */}
      <div
        className="absolute animate-float-medium"
        style={{
          width: '500px',
          height: '500px',
          top: '50%',
          right: '15%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.12,
        }}
      />

      {/* Orb 3 - Pink */}
      <div
        className="absolute animate-float-fast"
        style={{
          width: '450px',
          height: '450px',
          bottom: '15%',
          left: '10%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: 0.1,
        }}
      />

      {/* Orb 4 - Teal (smaller) */}
      <div
        className="absolute animate-float-slow"
        style={{
          width: '350px',
          height: '350px',
          top: '60%',
          left: '40%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, transparent 70%)',
          filter: 'blur(70px)',
          opacity: 0.08,
        }}
      />

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg) scale(0.9);
          }
        }

        @keyframes float-medium {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(-40px, 25px) rotate(-120deg) scale(1.15);
          }
          66% {
            transform: translate(25px, -35px) rotate(-240deg) scale(0.95);
          }
        }

        @keyframes float-fast {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(35px, 35px) rotate(180deg) scale(1.05);
          }
          66% {
            transform: translate(-30px, -25px) rotate(360deg) scale(1.1);
          }
        }

        .animate-float-slow {
          animation: float-slow 25s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 20s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
