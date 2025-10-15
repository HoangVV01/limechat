import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./FilePreview";
import { GifPicker } from "./GifPicker";
import { EmojiPicker } from "./EmojiPicker";

type EmojiObject = {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
};

interface MessageInputProps {
  messageText: string;
  setMessageText: (text: string | ((prev: string) => string)) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export function MessageInput({
  messageText,
  setMessageText,
  selectedFile,
  setSelectedFile,
  onSendMessage,
  onFileSelect,
  onKeyPress,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const emojiPickerElement = document.querySelector(
        '[data-emoji-picker="true"]'
      );
      const gifPickerElement = document.querySelector(
        '[data-gif-picker="true"]'
      );

      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target) &&
        emojiPickerElement &&
        !emojiPickerElement.contains(target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        showGifPicker &&
        gifButtonRef.current &&
        !gifButtonRef.current.contains(target) &&
        gifPickerElement &&
        !gifPickerElement.contains(target)
      ) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, showGifPicker]);

  const handleGifSelect = (gifUrl: string) => {
    setMessageText((prev) => prev + gifUrl);
  };

  const handleEmojiSelect = (emoji: EmojiObject) => {
    setMessageText((prev) => prev + emoji.native);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <FilePreview
        selectedFile={selectedFile}
        onRemove={() => setSelectedFile(null)}
      />

      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={onFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!selectedFile}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            ref={gifButtonRef}
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            disabled={!!selectedFile}
          >
            GIF
          </Button>
          <GifPicker
            isOpen={showGifPicker}
            onGifSelect={handleGifSelect}
            onClose={() => setShowGifPicker(false)}
          />
        </div>

        <div className="flex-1 relative">
          <input
            placeholder={
              selectedFile
                ? "File selected - click send to upload"
                : "Type a message..."
            }
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={onKeyPress}
            className="w-full px-3 py-2 pr-20 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!selectedFile}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                ref={emojiButtonRef}
                disabled={!!selectedFile}
              >
                <Smile className="h-4 w-4 text-gray-400" />
              </Button>
              <EmojiPicker
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={onSendMessage}
          disabled={!messageText.trim() && !selectedFile}
          size="icon"
          className="rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
