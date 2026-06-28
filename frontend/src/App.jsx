import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import IntroPage from "./pages/IntroPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ChatPage from "./pages/ChatPage";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import PageLoader from "./components/PageLoader";
import { Toaster } from "react-hot-toast";
function App() {
  const { checkAuth, isCheckingAuth, authUser, connectSocket, socket } = useAuthStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) connectSocket();
  }, [authUser, connectSocket]);

  useEffect(() => {
    if (socket) {
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  // Always show intro on first load
  useEffect(() => {
    // Only hide intro after user logs in
    if (authUser) {
      const timer = setTimeout(() => setShowIntro(false), 0);
      return () => clearTimeout(timer);
    }
  }, [authUser]);

  if (isCheckingAuth) {
    return <PageLoader />;
  }

  // Show intro only if user is not authenticated and hasn't skipped it
  if (showIntro && !authUser) {
    return <IntroPage setShowIntro={setShowIntro} />;
  }
  return (
    <div className="min-h-screen bg-zinc-900 relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-violet-500 opacity-30 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-indigo-500 opacity-30 blur-[100px]" />

      <Routes>
        <Route
          path="/"
          element={authUser ? <ChatPage /> : <Navigate to={"/login"} />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
