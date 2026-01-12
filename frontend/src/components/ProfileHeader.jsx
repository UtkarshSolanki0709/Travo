import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");
function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };
  return (
    <div className="p-4 md:p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="avatar online">
            <button
              className="size-10 md:size-12 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser?.profilePic || "/avatar.png"}
                alt="user image"
                className="size-full object-cover"
                onError={(e) => (e.target.src = "/avatar.png")}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold text-zinc-100 max-w-[120px] md:max-w-[170px] truncate">
              {authUser?.fullName}
            </h2>
            <p className="text-xs text-zinc-300 truncate">Online</p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
          <button
            className="text-zinc-400 hover:text-slate-200 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={logout}
          >
            <LogOutIcon className="w-5 h-5" />
          </button>

          <button
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound
                .play()
                .catch((error) => console.log("Audio Play Failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
