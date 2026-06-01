import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";

function IntroPage({ setShowIntro }) {
  const navigate = useNavigate();

  const handleNavigation = useCallback(() => {
    if (setShowIntro) setShowIntro(false);
    navigate("/login");
  }, [navigate, setShowIntro]);

  useEffect(() => {
    // Auto-navigate after video ends (12 seconds)
    const timer = setTimeout(() => {
      handleNavigation();
    }, 12000);

    return () => clearTimeout(timer);
  }, [handleNavigation]);

  return (
    <div className="w-full h-screen bg-zinc-900 relative flex flex-col items-center justify-between p-0 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 -left-4 size-96 bg-violet-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-indigo-500 opacity-20 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Video Container - Full screen */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        <video
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain bg-black"
          onEnded={handleNavigation}
        >
          <source src="/convo-intro.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Skip Button - Absolute positioning at bottom */}
      <button
        onClick={handleNavigation}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/50"
      >
        Start Chatting
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export default IntroPage;
