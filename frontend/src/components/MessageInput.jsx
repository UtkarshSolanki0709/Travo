import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled, isUploadingMedia, uploadProgress } = useChatStore();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && selectedFiles.length === 0) return;
    if (isUploadingMedia) return;

    if (isSoundEnabled) playRandomKeyStrokeSound();
    
    const filesToUpload = selectedFiles.map((f) => f.file);

    // Clear state immediately for responsive UX
    setText("");
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    await sendMessage({
      text: text.trim(),
      files: filesToUpload,
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let updatedFiles = [...selectedFiles];
    let videoCount = updatedFiles.filter((f) => f.type === "video").length;
    let imageCount = updatedFiles.filter((f) => f.type !== "video").length;

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      const isGif = file.type === "image/gif";

      if (!isVideo && !isImage) {
        toast.error(`${file.name} is not a supported file type`);
        continue;
      }

      if (isVideo) {
        if (videoCount >= 3) {
          toast.error("You can upload a maximum of 3 videos");
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`Video ${file.name} exceeds the 15MB limit`);
          continue;
        }
        videoCount++;
      } else {
        if (imageCount >= 5) {
          toast.error("You can upload a maximum of 5 images");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Image ${file.name} exceeds the 10MB limit`);
          continue;
        }
        imageCount++;
      }

      updatedFiles.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : isGif ? "gif" : "image",
      });
    }

    setSelectedFiles(updatedFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };

  return (
    <div className="p-3 md:p-4 border-t border-slate-700/50">
      {/* Media Previews */}
      {selectedFiles.length > 0 && (
        <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-3 p-2 bg-slate-800/20 rounded-lg">
          {selectedFiles.map((fileObj, index) => (
            <div
              key={index}
              className="relative w-16 md:w-20 h-16 md:h-20 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center"
            >
              {fileObj.type === "video" ? (
                <video src={fileObj.preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={fileObj.preview} alt="preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-slate-200 hover:bg-slate-900 flex items-center justify-center min-h-[20px] min-w-[20px] z-10"
              >
                <XIcon className="w-3 h-3" />
              </button>
              {fileObj.type === "video" && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 px-1 rounded text-slate-300 font-semibold uppercase">
                  Video
                </span>
              )}
              {fileObj.type === "gif" && (
                <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 px-1 rounded text-slate-300 font-semibold uppercase">
                  GIF
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploading Status Progress */}
      {isUploadingMedia && (
        <div className="max-w-3xl mx-auto mb-3 p-3 bg-violet-950/20 border border-violet-900/50 rounded-lg flex flex-col gap-1.5 animate-pulse">
          <div className="flex justify-between items-center text-xs font-semibold text-violet-400">
            <span>Uploading attachments...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="max-w-3xl mx-auto flex space-x-2 md:space-x-4"
      >
        <input
          type="text"
          value={text}
          disabled={isUploadingMedia}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 md:px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-600 text-sm md:text-base disabled:opacity-50"
          placeholder={isUploadingMedia ? "Uploading media..." : "Type your message"}
        />
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          disabled={isUploadingMedia}
        />
        <button
          type="button"
          disabled={isUploadingMedia}
          onClick={() => fileInputRef.current.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-3 md:px-4 py-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 ${
            selectedFiles.length > 0 ? "text-cyan-600" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={isUploadingMedia || (!text.trim() && selectedFiles.length === 0)}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-3 md:px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
